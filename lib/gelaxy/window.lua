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
local focusedIndex = nil


local function wrapProgram(program)
    return coroutine.create(function()
        if type(program) == "string" then
            local ok, err = pcall(dofile, program)
            if not ok then
                printError(tostring(err))
            end
        elseif type(program) == "function" then
            local ok, err = pcall(program)
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

    local tab = {
        name = name,
        co = wrapProgram(program),
        win = win,
        filter = nil,
        dead = false,
    }

    table.insert(tabs, tab)

    if not focusedIndex then
        focusedIndex = #tabs
    end

    return #tabs
end


local function drawTabBar()
    nativeTerm.setCursorPos(1, 1)
    nativeTerm.setBackgroundColor(colors.black)
    nativeTerm.clearLine()

    local x = 1
    for i, tab in ipairs(tabs) do
        local label = " " .. tab.name .. " "

        if tab.dead then
            nativeTerm.setBackgroundColor(colors.black)
            nativeTerm.setTextColor(colors.red)
        elseif i == focusedIndex then
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

local function focusTab(index)
    if not tabs[index] or index == focusedIndex then return end

    if focusedIndex and tabs[focusedIndex] then
        tabs[focusedIndex].win.setVisible(false)
    end

    focusedIndex = index
    tabs[focusedIndex].win.setVisible(true) 

    drawTabBar()
end

local function focusNextAlive()
    for i = 1, #tabs do
        if not tabs[i].dead then
            focusTab(i)
            return true
        end
    end
    return false
end

local function handleTabBarClick(x)
    for i, tab in ipairs(tabs) do
        if x >= tab.x1 and x <= tab.x2 then
            focusTab(i)
            return
        end
    end
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

    tabs[focusedIndex].win.setVisible(true)
    drawTabBar()

    for _, tab in ipairs(tabs) do
        resumeTab(tab, {})
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
            local tab = tabs[focusedIndex]
            if tab then
                resumeTab(tab, evData)
            end
        else
            for _, tab in ipairs(tabs) do
                resumeTab(tab, evData)
            end
        end

        if tabs[focusedIndex] and tabs[focusedIndex].dead then
            if not focusNextAlive() then
                drawTabBar()
                return 
            end
        end

        drawTabBar()

        ::continueLoop::
    end
end

return wm