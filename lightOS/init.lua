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