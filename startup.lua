term.setCursorPos(1,1)
term.clear()

local ver = "1.0"

print("lightOS BIOS v" .. ver)
print("booting from lightOS disk")

shell.run("disk/core/boot.lua")
