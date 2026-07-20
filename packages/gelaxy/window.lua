-- The gelaxy window manager code

local function createWindow(name, bg, closebtn_file)
    term.setBackgroundColor(bg)
    term.clear()

    term.setCursorPos(1, 1)
    term.setBackgroundColor(colors.gray)
    print(name)
    term.setBackgroundColor(bg)
end

return { createWindow = createWindow }