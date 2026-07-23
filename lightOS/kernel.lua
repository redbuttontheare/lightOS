local gelaxy_window = dofile("/lib/gelaxy/window.lua")

gelaxy_window.createTab("shell", "/lightOS/lightshell.lua")
gelaxy_window.createTab("about", "/bin/about")

gelaxy_window.run()