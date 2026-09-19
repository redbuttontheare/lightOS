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

local base = "https://raw.githubusercontent.com/redbuttontheare/lightOS/main/"
local BghexValue = 0x0341fc

local Button = dofile("/tmp/gl/button.lua")
local Checkbox = dofile("/tmp/gl/checkbox.lua")
local Textbox = dofile("/tmp/gl/textbox.lua")
local Textlistbox = dofile("/tmp/gl/textlistbox.lua")

local lv = 15.0
local gv = 1.0
local kv = 10.1
local usrmgr_ver = 0.3
local pv = 0.2

term.setPaletteColor(colors.purple, BghexValue)
local baseblue = colors.purple

local function get(file, savePath)
    local uniqueId = tostring(os.epoch("utc"))
    local url = base .. file .. "?nocache=" .. uniqueId

    local response = http.get({
        url = url,
        headers = {
            ["Cache-Control"] = "no-cache, no-store, must-revalidate",
            ["Pragma"] = "no-cache",
            ["Expires"] = "0",
            ["User-Agent"] = "ComputerCraft-lightOS-" .. uniqueId
        }
    })

    if not response then
        return false
    end

    local code = response.readAll()
    response.close()

    local f = fs.open(savePath, "w")
    if not f then
        return false
    end

    f.write(code)
    f.close()

    return true
end

local function cls()
    term.clear()
    term.setCursorPos(1, 1)
end

local function runScreen(widgets)
    local screen = { done = false }
    function screen.finish() screen.done = true end

    local function redraw()
        for _, w in ipairs(widgets) do
            w:draw()
        end
    end

    redraw()

    while not screen.done do
        local evData = { os.pullEvent() }
        local event = evData[1]

        if event == "mouse_click" then
            local cx, cy = evData[3], evData[4]
            for _, w in ipairs(widgets) do
                if w.handleClick then
                    w:handleClick(cx, cy)
                end
            end
            redraw()
        elseif event == "char" then
            for _, w in ipairs(widgets) do
                if w.handleChar then
                    w:handleChar(evData[2])
                end
            end
            redraw()
        elseif event == "key" then
            for _, w in ipairs(widgets) do
                if w.handleKey then
                    w:handleKey(evData[2])
                end
            end
            redraw()
        elseif event == "mouse_scroll" then
            local direction, cx, cy = evData[2], evData[3], evData[4]
            for _, w in ipairs(widgets) do
                if w.handleScroll then
                    w:handleScroll(direction, cx, cy)
                end
            end
            redraw()
        end
    end
end

local function install_files()
    term.setBackgroundColor(colors.green)
    cls()

    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.yellow)
    term.setCursorPos(2, 1)
    write("Installing lightOS...")
    term.setTextColor(colors.white)

    local w, h = term.getSize()
    local logBox = Textlistbox.new(2, 3, w - 2, h - 4, {})

    local function downloadWithLog(file, savePath)
        local ok = get(file, savePath)
        if ok then
            logBox:addLine("OK   " .. file)
        else
            logBox:addLine("FAIL " .. file)
        end
        logBox:draw()
        return ok
    end

    fs.makeDir("/lightOS")
    fs.makeDir("/bin")
    fs.makeDir("/lib")
    fs.makeDir("/img")
    fs.makeDir("/apps")
    downloadWithLog("pkg.lua", "/lightOS/pkg.lua")
    downloadWithLog("bm.lua", "/bm.lua")
    downloadWithLog("startup.lua", "/startup.lua")
    downloadWithLog("bootmgr.lua", "/bootmgr.lua")
    downloadWithLog("autoexec.lua", "/lightOS/autoexec.lua")
    downloadWithLog("autoexec_runner.lua", "/lightOS/autoexec_runner.lua")
    downloadWithLog("lightOS/bs.lua", "/lightOS/bs.lua")
    downloadWithLog("lightOS/bs.nfp", "/lightOS/bs.nfp")
    downloadWithLog("lightOS/hello.lua", "/lightOS/hello.lua")
    downloadWithLog("lightOS/init.lua", "/lightOS/init.lua")
    downloadWithLog("lightOS/lightshell.lua", "/lightOS/lightshell.lua")
    downloadWithLog("lightOS/rcm.lua", "/lightOS/rcm.lua")
    downloadWithLog("other/license.txt", "/license.txt")
    downloadWithLog("lightOS/kernel.lua", "/lightOS/kernel.lua")

    -- commands

    downloadWithLog("bin/cd", "/bin/cd")
    downloadWithLog("bin/clear", "/bin/clear")
    downloadWithLog("bin/ls", "/bin/ls")
    downloadWithLog("bin/reboot", "/bin/reboot")
    downloadWithLog("bin/shutdown", "/bin/shutdown")
    downloadWithLog("bin/which", "/bin/which")
    downloadWithLog("bin/about", "/bin/about")
    downloadWithLog("bin/usermgr", "/bin/usermgr")
    downloadWithLog("bin/fetch", "/bin/fetch")
    downloadWithLog("bin/pastebin", "/bin/pastebin")
    downloadWithLog("bin/ln", "/bin/ln")
    downloadWithLog("bin/lnr", "/bin/lnr")
    downloadWithLog("bin/id", "/bin/id")
    downloadWithLog("bin/larc", "/bin/larc")

    -- libraries

    downloadWithLog("lib/lapi.lua", "/lib/lapi.lua")
    downloadWithLog("lib/console.lua", "/lib/console.lua")
    downloadWithLog("lib/logger.lua", "/lib/logger.lua")
    downloadWithLog("lightOS/system.lua", "/lightOS/system.lua")
    downloadWithLog("lib/archive.lua", "/lib/archive.lua")

    -- gelaxy window meneger libs

    fs.makeDir("lib/gelaxy")
    downloadWithLog("lib/gelaxy/button.lua", "/lib/gelaxy/button.lua")
    downloadWithLog("lib/gelaxy/window.lua", "/lib/gelaxy/window.lua")
    downloadWithLog("lib/gelaxy/checkbox.lua", "/lib/gelaxy/checkbox.lua")
    downloadWithLog("lib/gelaxy/textbox.lua", "/lib/gelaxy/textbox.lua")
    downloadWithLog("lib/gelaxy/message.lua", "/lib/gelaxy/message.lua")
    downloadWithLog("lib/gelaxy/listbox.lua", "/lib/gelaxy/listbox.lua")
    downloadWithLog("lib/gelaxy/textlistbox.lua", "/lib/gelaxy/textlistbox.lua")

    -- gelaxy bootloader

    downloadWithLog("lightOS/gb.lua", "/lightOS/gb.lua")

    -- images

    downloadWithLog("img/about.nfp", "/img/about.nfp")
    downloadWithLog("img/msg.nfp", "/img/msg.nfp")

    -- Applications

    fs.makeDir("apps/lightWeb")
    downloadWithLog("apps/lightWeb/lweb.lua", "/apps/lightWeb/lweb.lua")


    term.setBackgroundColor(baseblue)
    cls()
    term.setTextColor(colors.white)
    term.setCursorPos(4, 2)
    print("Set up your account")

    local usnBox = Textbox.new(4, 4, 20, "", nil)
    local pclabelBox = Textbox.new(4, 7, 20, "", nil)

    local usn, pclabel

    local continueBtn = Button.new(4, 9, 12, "Continue", colors.green, colors.white, function()
        usn = usnBox:getText()
        pclabel = pclabelBox:getText()

        if usn == "" or pclabel == "" then
            return
        end
    end)

    term.setCursorPos(4, 3)
    write("Username:")
    term.setCursorPos(4, 6)
    write("PC label:")

    local screen = { done = false }
    local widgets = { usnBox, pclabelBox, continueBtn }

    local function redraw()
        for _, w in ipairs(widgets) do w:draw() end
    end

    redraw()

    while not screen.done do
        local evData = { os.pullEvent() }
        local event = evData[1]

        if event == "mouse_click" then
            local cx, cy = evData[3], evData[4]
            usnBox:handleClick(cx, cy)
            pclabelBox:handleClick(cx, cy)
            continueBtn:handleClick(cx, cy)

            if usn and pclabel and usn ~= "" and pclabel ~= "" then
                screen.done = true
            end
        elseif event == "char" then
            usnBox:handleChar(evData[2])
            pclabelBox:handleChar(evData[2])
        elseif event == "key" then
            usnBox:handleKey(evData[2])
            pclabelBox:handleKey(evData[2])
        end

        redraw()
    end

    local pcfg = fs.open("lightOS/config.cfg", "w")
    pcfg.writeLine("pcname=" .. pclabel)
    pcfg.writeLine("ver=" .. lv)
    pcfg.writeLine("kver=" .. kv)
    pcfg.writeLine("gelaxy_ver=" .. gv)
    pcfg.writeLine("usermgr_ver=" .. usrmgr_ver)
    pcfg.writeLine("pkg_ver=" .. pv)
    pcfg.close()

    fs.makeDir("/home")

    term.setBackgroundColor(colors.black)
    term.clear()
    term.setCursorPos(1, 1)

    local console = dofile("/lib/console.lua")

    console.print_info("Creating user directory..")
    console.print_ok("User directory created")
    console.print_info("Creating user config..")

    shell.run("/bin/usermgr", "add", usn)
    shell.run("/bin/usermgr", "add", "root")

    console.print_ok("User config created")

    console.print_info("Setting up root superuser...")
    local rsu = fs.open("/home/root/.lightshl", "w")
    rsu.writeLine("shellApi.setDir(\"/\")")
    rsu.close()

    console.print_green("Hello, " .. usn .. "!")

    print(" ")
    console.print_yellow("Welcome to lightOS!")
    print(" ")
    console.print_info("lightOS version: " .. lv)
    console.print_info("lightOS kernel version: " .. kv)
    console.print_info("lightOS gelaxy version: " .. gv)
    console.print_info("lightOS user manager version: " .. usrmgr_ver)
    console.print_info("lightOS package manager version: " .. pv)
    print(" ")

    print("Press enter to reboot")
    read()
    os.reboot()
end

local GPL_NOTICE_LINES = {
    "lightOS - a custom OS for CC:Tweaked",
    "Copyright (C) 2026 RedButton",
    "",
    "This program is free software: you",
    "can redistribute it and/or modify",
    "it under the terms of the GNU",
    "General Public License as published",
    "by the Free Software Foundation,",
    "either version 3 of the License, or",
    "(at your option) any later version.",
    "",
    "This program comes WITHOUT ANY",
    "WARRANTY, without even the implied",
    "warranty of MERCHANTABILITY or",
    "FITNESS FOR A PARTICULAR PURPOSE.",
    "",
    "See /license.txt for the full text.",
}

local function licensepage()
    term.setBackgroundColor(colors.green)
    term.clear()

    term.setCursorPos(4, 1)
    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.yellow)
    print("License")

    term.setBackgroundColor(colors.green)

    local licenseBox = Textlistbox.new(4, 3, 34, 10, GPL_NOTICE_LINES)

    local agreeCheckbox = Checkbox.new(4, 14, "I agree to the GNU GPL v3 license", false, nil)

    local continueBtn = Button.new(4, 16, 10, "Continue", colors.gray, colors.white, function()
        if agreeCheckbox.checked then
            install_files()
        end
    end)

    local cancelBtn = Button.new(16, 16, 10, "Cancel", colors.gray, colors.white, function()
        os.reboot()
    end)

    runScreen({ licenseBox, agreeCheckbox, continueBtn, cancelBtn })
end

local function do_setup()
    term.setBackgroundColor(baseblue)
    term.setTextColor(colors.white)
    cls()

    term.setCursorPos(4, 2)
    print("Confirm installation")

    local confirmCheckbox = Checkbox.new(4, 4, "I want to install lightOS", false, nil)

    local continueBtn = Button.new(4, 6, 10, "Continue", colors.green, colors.white, function()
        if confirmCheckbox.checked then
            licensepage()
        end
    end)

    local cancelBtn = Button.new(16, 6, 10, "Cancel", colors.gray, colors.white, function()
        os.reboot()
    end)

    runScreen({ confirmCheckbox, continueBtn, cancelBtn })
end

print("Downloading Installer...")

sleep(4)

term.setBackgroundColor(baseblue)
term.setTextColor(colors.white)
cls()
local text = "lightOS Installation Wizard"
local w, h = term.getSize()
local x = math.floor((w - #text) / 2) + 1
local y = 1
term.setCursorPos(x, y)
print(text)

if pocket then
    print("lightOS not supports phones")
    print("press enter to reboot")
    read()
    os.reboot()
end

local function open_terminal()
    term.setBackgroundColor(colors.black)
    term.clear()
    term.setCursorPos(1, 1)
    print("CraftOS Terminal")
end

local terminalButton = Button.new(5, 5, 15, "Open Terminal", colors.blue, colors.white, open_terminal)
local installButton = Button.new(5, 7, 18, "Install lightOS", colors.green, colors.white, do_setup)

terminalButton:draw()
installButton:draw()

local running = true
while running do
    local evData = { os.pullEvent() }
    local event = evData[1]

    if event == "mouse_click" then
        local cx, cy = evData[3], evData[4]
        if terminalButton:handleClick(cx, cy) then
            running = false
        end
        if installButton:handleClick(cx, cy) then
            running = false
        end
    end
end