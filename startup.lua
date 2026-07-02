-- loading instalation floppy if exists
if fs.exists("disk/installer.lua") then
    shell.run("disk/installer.lua")


-- loading bios.lua
if fs.exists("boot/bios.lua") then
    shell.run("boot/bios.lua")
else
    term.setBackgroundColor(colors.blue)
    term.clear()
    term.setCursorPos(1, 1)
    print("Error: BIOS not found.")
    print("Please insert a bootable floppy drive for install lightOS.")
end

while true do
        local event, side = os.pullEvent()
        if event == "disk" then
            print("\nDisk detected! Rebooting...")
            sleep(1)
            os.reboot()
        end
    end
end