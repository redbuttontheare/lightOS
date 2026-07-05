local function get(path, save)
    local url =  path .. "?t=" .. os.time() .. math.random(1, 100000)
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
    get("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/autoexec.lua" "lightOS/autoexec.lua")

local function do_setup()
    fs.makeDir("bin")
    fs.makeDir("lightOS")
    term.setCursorPos(1, 3)
    write("Username: ")
    username = read()
    write("Computer name: ")
    pcname = read()

    local cfg_file = fs.open("lightOS/config.cfg")
    cfg_file.WriteLine("usr=" .. username)
    cfg_file.WriteLine("pcname=" .. pcname)
    cfg_file.WriteLine("ver=6.5")
    cfg_file.close()


    local nxt_btn1 = button.new(4, 4, "Next ->", colors.white, colors.black, function()
        Download_Sys()
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