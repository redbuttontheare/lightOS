local lapi = require("libs/lapi.lua")

local syscfg = lapi.loadConfig("lightOS/config.cfg")
term.clear()
term.setCursorPos(1, 1)

lapi.login(syscfg.usr, syscfg.pass)

term.clear()
term.setCursorPos(1, 1)

print("=== lightOS Home Edition ===")
usr_name = syscfg.usr or "root"

lapi.print_vm(syscfg)
lapi.user_hello(syscfg)