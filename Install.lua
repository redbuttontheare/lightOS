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

math.randomseed(os.time())

local function get(path, save)
    local url = path .. "?t=" .. os.time() .. math.random(1, 100000)
    local h = http.get(url)
    if h then
        local f = fs.open(save, "w")
        f.write(h.readAll())
        f.close()
        h.close()
    end
end

fs.makeDir("lib")
get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/lib/button.lua", "lib/button.lua")

local button = require("lib/button")

local function Download_Sys()
    get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/lib/lapi.lua", "lib/lapi.lua")
    get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/lightOS/init.lua", "lightOS/init.lua")
    get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/lightOS/bs.lua", "lightOS/bs.lua")
    get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/lightOS/bs.nfp", "lightOS/bs.nfp")
    get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/autoexec_runner.lua", "lightOS/autoexec_runner.lua")
    get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/autoexec.lua", "lightOS/autoexec.lua")
    get("https://cdn.jsdelivr.net/gh/redbuttontheare/lightOS@main/startup.lua", "startup.lua")
end

local function cls()
    term.clear
end

local function do_setup()
    fs.makeDir("bin")
    fs.makeDir("lightOS")
    term.setCursorPos(1, 3)
    write("Username: ")
    local username = read()
    write("Computer name: ")
    local pcname = read()

    local cfg_file = fs.open("lightOS/config.cfg", "w")
    cfg_file.writeLine("usr=" .. username)
    cfg_file.writeLine("pcname=" .. pcname)
    cfg_file.writeLine("ver=6.5")
    cfg_file.close()

    local buttons = {}

    local btn_next = button.new(4, 5, 9, "Next ->", colors.white, colors.black, function()
        Download_Sys()
        running = false
    end)

    btn_next:draw()
    buttons[#buttons + 1] = btn_next 

    while true do
        local event, param1, cx, cy = os.pullEvent("mouse_click")
        for _, btn in ipairs(buttons) do
            if btn:handleClick(cx, cy) then
                break
            end
        end
    end
end

cls()
local text = "lightOS Installation Wizard"
local w, h = term.getSize()
local x = math.floor((w - #text) / 2) + 1
local y = 1
term.setCursorPos(x, y)
print(text)
do_setup()