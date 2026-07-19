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

local function install_files()
    fs.makeDir("lightOS")
    fs.makeDir("bin")
    fs.makeDir("lib")
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

    -- libraries

    get("lib/lapi.lua", "")
    
    -- gelaxy window meneger libs

    fs.makeDir("lib/gelaxy")
    get("lib/gelaxy/button.lua", "lib/gelaxy/button.lua")
    get("lib/gelaxy/window.lua", "lib/gelaxy/window.lua")

    -- creating user config

    write("Username: ")
    usn = read()
    write("Label your pc: ")
    pclabel = read()
    ucfg = fs.open("lightOS/config.cfg", "w")
    ucfg.writeLine("usr=" .. usn)
    ucfg.writeLine("pcname=" .. pclabel)
    ucfg.writeLine("ver=10.0")
end

local function licensepage()
    term.setBackgroundColor(colors.green)
    term.clear()
    term.setCursorPos(4,1)

    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.yellow)
    print("Copyright (c) 2026 RedButton")
    term.setTextColor(colors.white)
    term.setCursorPos(4,2)
    print("                            ")
    term.setCursorPos(4,3)
    print("The lightOS under GNU GPL v3")
    term.setBackgroundColor(colors.green)
    term.setCursorPos(4,5)
    write("[1-yes/0-no]: ")
    lai = read()

    if lai == "0" then
        os.reboot()
    elseif lai == "1" then
        install_files()
    else
        os.reboot
    end
end

local function do_setup()
    print("Confirm instalation [1 - yes 0 - no]:")
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
term.setTextColor(color.white)
cls()
local text = "lightOS Installation Wizard"
local w, h = term.getSize()
local x = math.floor((w - #text) / 2) + 1
local y = 1
term.setCursorPos(x, y)
print(text)
do_setup()