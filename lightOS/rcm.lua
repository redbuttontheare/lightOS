term.clear()
term.setCursorPos(1,1)

print("lightOS Recovery mode")
print("Chose option")
print("1. Resume")
print("2. Reboot")

while true do
    input = read()
    if input == "1" then
        shell.run("/lightOS/bs.lua")
        break
    end
    if input == "2" then
        os.reboot()
    end
end