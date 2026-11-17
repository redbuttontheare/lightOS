local image = "/img/err.nfp"

local function handleError(err, level)

    local img = paintutils.loadImage(image)
    local button = dofile("/lib/gelaxy/button.lua")

    if img then
        paintutils.drawImage(img, 1, 1)
    end

    term.setTextColor(colors.black)

    term.setCursorPos(16, 6)
    print("Error")
    term.setCursorPos(16, 7)
    print("an error has occurred")
    term.setCursorPos(16, 8)
    print(tostring(err))

    local function openshell()
        term.clear()
        term.setCursorPos(1, 1)
        shell.run("/lightOS/lightshell.lua")

    end

    local opsbtn = button.new(19, 10, 7, "Open Shell", colors.gray, colors.white, openshell)
    opsbtn:draw()

    local running = true
    while running do
        local event, mouseBtn, cx, cy = os.pullEvent("mouse_click")
        if opsbtn:handleClick(cx, cy) then
            running = false
        end
    end
end

_G.error = handleError