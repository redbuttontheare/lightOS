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
    print("To: " .. savePath)
    f.close()
    
    return true
end

local function cls()
    term.clear()
    term.setCursorPos(1,1)
end

local function install_files()
    fs.makeDir("/lightOS")
    fs.makeDir("/bin")
    fs.makeDir("/lib")
    fs.makeDir("/tmp")
    fs.makeDir("/img")
    get("pkg.lua", "/lightOS/pkg.lua")
    get("bm.lua", "/bm.lua")
    get("startup.lua", "/startup.lua")
    get("autoexec.lua", "/lightOS/autoexec.lua")
    get("autoexec_runner.lua", "/lightOS/autoexec_runner.lua")
    get("lightOS/bs.lua", "/lightOS/bs.lua")
    get("lightOS/bs.nfp", "/lightOS/bs.nfp")
    get("lightOS/hello.lua", "/lightOS/hello.lua")
    get("lightOS/init.lua", "/lightOS/init.lua")
    get("lightOS/lightshell.lua", "/lightOS/lightshell.lua")
    get("lightOS/rcm.lua", "/lightOS/rcm.lua")
    get("other/license.txt", "/license.txt")
    get("img/about.nfp", "/img/about.nfp")

    -- commands

    get("bin/cd", "/bin/cd")
    get("bin/clear", "/bin/clear")
    get("bin/cls", "/bin/cls")
    get("bin/ls", "/bin/ls")
    get("bin/reboot", "/bin/reboot")
    get("bin/shutdown", "/bin/shutdown")
    get("bin/which", "/bin/which")
    get("bin/about", "/bin/about")
    get("bin/usermgr", "/bin/usermgr")

    -- libraries

    get("lib/lapi.lua", "/lib/lapi.lua")
    get("lib/console.lua", "/lib/console.lua")
    get("lib/logger.lua", "/lib/logger.lua")
    
    -- gelaxy window meneger libs

    fs.makeDir("lib/gelaxy")
    get("lib/gelaxy/button.lua", "/lib/gelaxy/button.lua")
    get("lib/gelaxy/window.lua", "/lib/gelaxy/window.lua")
    get("lib/gelaxy/checkbox.lua", "/lib/gelaxy/checkbox.lua")
    get("lib/gelaxy/textbox.lua", "/lib/gelaxy/textbox.lua")

    -- gelaxy bootloader

    get("lightOS/gb.lua", "/lightOS/gb.lua")

    -- creating user config

    write("Username: ")
    usn = read()
    write("Label your pc: ")
    pclabel = read()
    local pcfg = fs.open("lightOS/config.cfg", "w")
    pcfg.writeLine("pcname=" .. pclabel)
    pcfg.writeLine("ver=13.2")
    pcfg.writeLine("kver=10.0")
    pcfg.writeLine("gelaxy_ver=0.6")
    pcfg.writeLine("usermgr_ver=0.3")
    pcfg.close()

    fs.makeDir("/home")

    term.setBackgroundColor(colors.black)
    term.clear()
    term.setCursorPos(1,1)
    
    local console = dofile("/lib/console.lua")

    console.print_info("Creating user directory..")
    console.print_ok("User directory created")
    console.print_info("Creating user config..")


    shell.run("/bin/usermgr", "add", usn)
    shell.run("/bin/usermgr", "add", "root")

    console.print_ok("User config created")

    console.print_info("Setting up root superuser...")
    rsu = fs.open("/home/root/.lightshl", "w")
    rsu.writeLine("shellApi.setDir(\"/\")")
    rsu.close()

    console.print_green("Hello, " .. usn .. "!")

    print(" ")
    console.print_yellow("Welcome to lightOS!")
    print(" ")

    print("lightOS installed")
    print("Reboot now?")
    write("[1-YES/0-no]: ")
    rnqr = read()

    if rnqr == "1" then
        print("Rebooting...")
        sleep(2)
        os.reboot()
    elseif rnqr == "0" then
        _G.currentUser = usn
        return 0
    else
        print("Rebooting...")
        sleep(2)
        os.reboot()
    end
end

local function licensepage()
    term.setBackgroundColor(colors.green)
    term.clear()
    term.setCursorPos(4,2)

    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.yellow)
    print("Copyright (c) 2026 RedButton   ")
    term.setTextColor(colors.white)
    term.setCursorPos(4,3)
    print("                               ")
    term.setCursorPos(4,4)
    print("lightOS under GNU GPL v3       ")
    term.setCursorPos(4,5)
    print("See the /license.txt to detalis")
    term.setBackgroundColor(colors.green)
    term.setCursorPos(4,6)
    write("[1-yes/0-no]: ")
    lai = read()

    if lai == "0" then
        os.reboot()
    elseif lai == "1" then
        install_files()
    else
        os.reboot()
    end
end

local function do_setup()
    print("Confirm installation [1 - yes 0 - no]:")
    write("[0/1]> ")
    cis = read()
    if cis == "0" then
        os.reboot()
    elseif cis == "1" then
        licensepage()
    else
        os.reboot()
    end

end

term.setBackgroundColor(baseblue)
term.setTextColor(colors.white)
cls()
local text = "lightOS Installation Wizard"
local w, h = term.getSize()
local x = math.floor((w - #text) / 2) + 1
local y = 1
term.setCursorPos(x, y)
print(text)
if fs.exists("/tmp") then
    fs.delete("/tmp")
end
if pocket then
    error("Didn't use phone to install")
    read()
    os.reboot()
end
do_setup()