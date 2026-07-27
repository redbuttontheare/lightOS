local gelaxy_window = dofile("/lib/gelaxy/window.lua")

_G.gelaxy_w = gelaxy_window

gelaxy_window.createTab("+", "/lightOS/lightshell.lua")
gelaxy_window.createTab("about", "/bin/about")

gelaxy_window.run()