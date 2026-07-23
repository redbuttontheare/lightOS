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

shell.setPath(":/bin:/lightOS:/lib")

local lapi = dofile("/lib/lapi.lua")
-- local autoexec = dofile("/lightOS/autoexec_runner.lua")
-- local autoexec_tbl = dofile("/lightOS/autoexec.lua")
local cfg = lapi.loadConfig("/lightOS/config.cfg")

local version = cfg.ver
_G.ligtos_ver = version

term.clear()
term.setCursorPos(1,1)

-- if cfg.autoexec ~= "0" then
--    local autoexec = dofile("/lightOS/autoexec_runner.lua")
--    local tbl = dofile("/lightOS/autoexec.lua")
--    autoexec(tbl)
-- end

local nativeError = _G.error

local function customKernelPanic(errMessage, level)
    local msg = errMessage or "Unknown system execution error"
    
    term.setBackgroundColor(colors.blue)
    term.setTextColor(colors.white)
    term.clear()
    
    local w, h = term.getSize()
    
    local title = " lightOS Kernel Panic "
    term.setCursorPos(math.floor((w - #title) / 2) + 1, 3)
    term.setBackgroundColor(colors.red)
    term.write(title)
    
    term.setBackgroundColor(colors.blue)
    term.setTextColor(colors.yellow)
    term.setCursorPos(2, 6)
    print("CRITICAL ERROR: " .. tostring(msg))
    
    term.setTextColor(colors.white)
    term.setCursorPos(2, h - 3)
    print("The system execution environment has been halted.")
    term.setCursorPos(2, h - 2)
    term.setTextColor(colors.lightGray)
    write("Press ANY KEY to reboot the computer...")
    
    os.pullEvent("key")
    os.reboot()
end

_G.error = customKernelPanic