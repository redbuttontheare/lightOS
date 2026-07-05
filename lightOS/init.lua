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

local lapi = dofile("lib/lapi.lua")
local autoexec = dofile("lightOS/autoexec_runner.lua")
local autoexec_tbl = dofile("lightOS/autoexec.lua")

local config = lapi.loadConfig("lightOS/config.cfg")
local ver = "v" .. config[ver]

term.clear()
term.setCursorPos(1,1)

print("lightOS " .. ver)

autoexec(autoexec_tbl)

return