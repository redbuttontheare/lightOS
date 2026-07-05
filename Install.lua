local function get(path, save)
    local url = base .. path .. "?t=" .. os.time() .. math.random(1, 100000)
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

local function do_setup()
    local nxt_btn1 = button.new(4, 4, "Next ->", colors.white, colors.black, function()
        
    end)

    local function drawAll()
        for _, btn in ipairs(buttons) do
            btn:draw()
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