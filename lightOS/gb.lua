local bs = paintutils.loadImage("/lightOS/bs.nfp")
local lapi = dofile("/lib/lapi.lua")
local cfg = lapi.loadConfig("/lightOS/config.cfg")
local gver = cfg.gelaxy_ver

local function drawBootMenu()
    term.cler()
    term.setCursorPos(1,1)
    paintutils.drawImage(bs, 1, 1)

    term.setCursorPos(20,14)
    term.clearLine()
    term.setCursorPos(20,14)
    print(" lightOS")
    term.setCursorPos(1,19)
    term.clearLine()
    term.setCursorPos(1,19)
    print("gelaxy " .. gver)

    sleep(3)

    shell.run("/lightOS/init.lua")
end

drawBootMenu()