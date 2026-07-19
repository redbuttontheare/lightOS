-- The gelaxy window meneger code

local function createWindow(name, bg, closebtn_file) -- to create window createWindow("window_title", "green" "lightOS/gelaxy.lua")
    term.setBackgroundColor
    term.clear(colors.bg)

    term.setCursorPos(1,1)
    term.setBackgroundColor(colors.gray)
    print(name)
    term.setBackgroundColor(colors.bg)
end