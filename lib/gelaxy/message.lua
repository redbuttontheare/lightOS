local message = {}

function message.create_message(title, on_close)
    message.title = title
    message.on_close = on_close

    local bg = paintutils.loadImage("/img/msg.nfp")

    paintutils.drawImage(bg, 1, 1)
    term.setCursorPos(15, 5)
    print(title)
end

function message.run()
    local button = dofile("/lib/gelaxy/button.lua")

    local function runOnClose()
        if message.on_close then
            message.on_close()
        end
    end

    local closeButton = button.new(35, 5, 1, "X", colors.red, colors.white, runOnClose)

    closeButton:draw()

    local running = true
    while running do
        local evData = { os.pullEvent() }
        local event = evData[1]

        if event == "mouse_click" then
            local cx, cy = evData[3], evData[4]
            if closeButton:handleClick(cx, cy) then
                running = false
            end
        end
    end
end

return message