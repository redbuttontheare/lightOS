local gelaxy_window = dofile("/lib/gelaxy/window.lua")

_G.gelaxy_w = gelaxy_window

gelaxy_window.createTab("+", _G.lightos_shell)
gelaxy_window.createTab("Security", "")

gelaxy_window.run()