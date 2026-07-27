-- Copyright (C) 2026 redbuttontheare@gmail.com
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
-- GNU General Public License for more details.

local wm = {}

local nativeTerm = term.current()
local termW, termH = nativeTerm.getSize()

local tabs = {}
local nextId = 1
local focusedId = nil

local function findIndexById(id)
    for i, tab in ipairs(tabs) do
        if tab.id == id then
            return i
        end
    end
    return nil
end

local function findTabById(id)
    local i = findIndexById(id)
    return i and tabs[i]
end

local function resumeTab(tab, evData)
    if tab.dead then return end
    if coroutine.status(tab.co) == "dead" then
        tab.dead = true
        return
    end

    local eventName = evData[1]
    if tab.filter and eventName and eventName ~= tab.filter and eventName ~= "terminate" then
        return
    end

    local old = term.redirect(tab.win)
    local results = { coroutine.resume(tab.co, table.unpack(evData)) }
    term.redirect(old)

    local ok = results[1]

    if not ok then
        tab.dead = true
        printError("Tab '" .. tab.name .. "' crashed: " .. tostring(results[2]))
    elseif coroutine.status(tab.co) == "dead" then
        tab.dead = true
    else
        tab.filter = results[2]
    end
end

local function wrapProgram(program, selfId)
    return coroutine.create(function()
        if type(program) == "string" then
            _G.currentTabId = selfId
            local ok, err = pcall(dofile, program)
            if not ok then
                printError(tostring(err))
            end
        elseif type(program) == "function" then
            local ok, err = pcall(program, selfId)
            if not ok then
                printError(tostring(err))
            end
        else
            while true do
                os.pullEvent()
            end
        end
    end)
end

function wm.createTab(name, program)
    local win = window.create(nativeTerm, 1, 2, termW, termH - 1, false)

    local id = nextId
    nextId = nextId + 1

    local tab = {
        id = id,
        name = name,
        co = wrapProgram(program, id),
        win = win,
        filter = nil,
        dead = false,
    }

    table.insert(tabs, tab)

    resumeTab(tab, {})

    if not focusedId then
        wm.focusTab(id)
    end

    return id
end

local function drawTabBar()
    nativeTerm.setCursorPos(1, 1)
    nativeTerm.setBackgroundColor(colors.black)
    nativeTerm.clearLine()

    local x = 1
    for _, tab in ipairs(tabs) do
        local label = " " .. tab.name .. " "

        if tab.dead then
            nativeTerm.setBackgroundColor(colors.black)
            nativeTerm.setTextColor(colors.red)
        elseif tab.id == focusedId then
            nativeTerm.setBackgroundColor(colors.white)
            nativeTerm.setTextColor(colors.black)
        else
            nativeTerm.setBackgroundColor(colors.gray)
            nativeTerm.setTextColor(colors.lightGray)
        end

        nativeTerm.setCursorPos(x, 1)
        nativeTerm.write(label)

        tab.x1 = x
        tab.x2 = x + #label - 1
        x = x + #label
    end

    nativeTerm.setBackgroundColor(colors.black)
    nativeTerm.setTextColor(colors.white)
end

function wm.focusTab(id)
    local tab = findTabById(id)
    if not tab or id == focusedId then return end

    local oldTab = focusedId and findTabById(focusedId)
    if oldTab then
        oldTab.win.setVisible(false)
    end

    focusedId = id
    tab.win.setVisible(true)

    drawTabBar()
end

local function focusNextAlive(excludeId)
    for _, tab in ipairs(tabs) do
        if not tab.dead and tab.id ~= excludeId then
            wm.focusTab(tab.id)
            return true
        end
    end
    focusedId = nil
    return false
end

function wm.closeTab(id)
    local index = findIndexById(id)
    if not index then return false end

    local tab = tabs[index]
    tab.win.setVisible(false)
    tab.dead = true

    table.remove(tabs, index)

    if focusedId == id then
        focusedId = nil
        focusNextAlive(id)
    end

    drawTabBar()
    return true
end

local function handleTabBarClick(x)
    for _, tab in ipairs(tabs) do
        if x >= tab.x1 and x <= tab.x2 then
            wm.focusTab(tab.id)
            return
        end
    end
end

local function translateForTab(evData)
    local name = evData[1]
    if name == "mouse_click" or name == "mouse_up" or name == "mouse_drag" or name == "mouse_scroll" then
        local copy = {}
        for i, v in ipairs(evData) do copy[i] = v end
        copy[4] = copy[4] - 1  -- y: компенсація рядка панелі вкладок
        return copy
    end
    return evData
end

local INPUT_EVENTS = {
    mouse_click = true,
    mouse_up = true,
    mouse_drag = true,
    mouse_scroll = true,
    char = true,
    key = true,
    key_up = true,
    paste = true,
}

function wm.run()
    if #tabs == 0 then
        printError("gelaxy: no tabs to run")
        return
    end

    drawTabBar()

    while true do
        local evData = { os.pullEventRaw() }
        local eventName = evData[1]

        if eventName == "mouse_click" then
            local button, x, y = evData[2], evData[3], evData[4]
            if y == 1 then
                handleTabBarClick(x)
                goto continueLoop
            end
        end

        if INPUT_EVENTS[eventName] then
            local tab = focusedId and findTabById(focusedId)
            if tab then
                resumeTab(tab, translateForTab(evData))
            end
        else
            for _, tab in ipairs(tabs) do
                resumeTab(tab, evData)
            end
        end

        if focusedId then
            local tab = findTabById(focusedId)
            if not tab or tab.dead then
                if not focusNextAlive(focusedId) then
                    drawTabBar()
                    if #tabs == 0 then
                        return
                    end
                end
            end
        end

        drawTabBar()

        ::continueLoop::
    end
end

return wm