local function get(path, save)
    local url = path .. "?t=" .. os.time() .. math.random(1, 100000)
    local h = http.get(url)
    if h then
        local f = fs.open(save, "w")
        f.write(h.readAll())
        f.close()
        h.close()
    end
end

local function cls()
    term.clear()
end

fs.makeDir("lib")
get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/lib/button.lua", "lib/button.lua")
local button = require("lib/button")

local function Download_Sys()
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/lib/lapi.lua", "lib/lapi.lua")
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/lightOS/init.lua", "lightOS/init.lua")
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/lightOS/bs.lua", "lightOS/bs.lua")
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/lightOS/bs.nfp", "lightOS/bs.nfp")
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/autoexec_runner.lua", "lightOS/autoexec_runner.lua")
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/autoexec.lua", "lightOS/autoexec.lua")
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/startup.lua", "startup.lua")
end

local function do_setup()
    fs.makeDir("bin")
    fs.makeDir("lightOS")
    term.setCursorPos(1, 3)
    write("Username: ")
    local username = read()
    write("Computer name: ")
    local pcname = read()

    local cfg_file = fs.open("lightOS/config.cfg", "w")
    cfg_file.writeLine("usr=" .. username)
    cfg_file.writeLine("pcname=" .. pcname)
    cfg_file.writeLine("ver=6.5")
    cfg_file.close()

    local running = true
    local buttons = {}

    local btn_next = button.new(4, 4, 10, "Next ->", colors.white, colors.black, function()
        Download_Sys()
        running = false
    end)

    buttons[#buttons + 1] = btn_next

    local function drawAll()
        for _, btn in ipairs(buttons) do
            btn:draw()
        end
    end

    drawAll()

    while running do
        local event, param1, cx, cy = os.pullEvent("mouse_click")
        for _, btn in ipairs(buttons) do
            if btn:handleClick(cx, cy) then
                break
            end
        end
    end
end

cls()
local text = "lightOS Installation Wizard"
local w, h = term.getSize()
local x = math.floor((w - #text) / 2) + 1
local y = 1
term.setCursorPos(x, y)
print(text)
do_setup()