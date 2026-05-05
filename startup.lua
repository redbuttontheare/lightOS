term.setCursorPos(1,1)
term.clear()

local ver = "1.0"

print("lightOS BIOS v" .. ver)
print("booting from lightOS disk")

sleep(3)

term.setCursorPos(1,1)
term.clear()

local os = "lightOS"
local ver = "1.0"

while True do
  print(os .. "v" .. ver)
  print(os .. "basic cmd")
  print("Hello!")
  break
end
