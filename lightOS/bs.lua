term.clear()

local img = paintutils.loadImage("lightOS/bs.img")
paintutils.drawImage(img, 1, 1)

sleep(3)

shell.run("lightOS/init.lua")
