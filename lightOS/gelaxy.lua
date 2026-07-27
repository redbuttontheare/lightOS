local button = dofile("/lib/gelaxy/button.lua")
local checkbox = dofile("/lib/gelaxy/checkbox.lua")
local textbox = dofile("/lib/gelaxy/textbox.lua")
local gelaxy_windows = _G.gelaxy
local system = dofile("/lightOS/system.lua")

-- variables

local termW, termH = term.getSize()
local user = _G.currentUser or "root"

-- functions

local function jmp(x, y) return term.setCursorPos(x, y) end
local function cls() term.clear(); term.setCursorPos(1, 1) end
local function bcol(color) return term.setBackgroundColor(color) end
local function tcol(color) return term.setTextColor(color) end

local function rect(x, y, width, height, color)
    bcol(color)

    for i = 0, height - 1 do
        jmp(x, y + i)
        write(string.rep(" ", width))
    end

    bcol(colors.green)
end

local function createTab()
    cls()
    local msgbg = paintutils.loadImage("/img/msg.nfp")

    if msgbg then
        paintutils.drawImage(msgbg, 1, 1)
    end

    jmp(17, 5)
    print("Set up the tab")

    jmp(17, 7)
    write("Title: ")
    local tabname = read()

    jmp(19, 5)
    write("Program path: ")
    local tabprog = read()

    system.run(tabname, tabprog)
end

local function drawHome(addTab)
    bcol(colors.green)
    tcol(colors.white)
    cls()

    rect(1, 1, 15, termH, colors.gray)

    addTab:draw()
end

local function home_tab()
    local addTab = button.new(2, 18, 1, "+", colors.gray, colors.white, createTab)

    drawHome(addTab)

    local running = true
    while running do
        local event, mouseBtn, cx, cy = os.pullEvent("mouse_click")

        if addTab:handleClick(cx, cy) then
            drawHome(addTab)
        end
    end
end

home_tab()