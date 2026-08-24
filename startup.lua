local nativeError = _G.error

local nativeError = _G.error

local function devicePanic(errMessage, level)
    local msg = errMessage or "Unknown device execution error"
    
    term.setBackgroundColor(colors.blue)
    term.setTextColor(colors.white)
    term.clear()
    
    local w, h = term.getSize()
    
    local title = " lightOS Device Panic "
    term.setCursorPos(math.floor((w - #title) / 2) + 1, 3)
    term.setBackgroundColor(colors.red)
    term.write(title)
    
    term.setBackgroundColor(colors.blue)
    term.setTextColor(colors.yellow)
    term.setCursorPos(2, 6)
    print("CRITICAL ERROR: " .. tostring(msg))
    
    term.setTextColor(colors.white)
    term.setCursorPos(2, h - 3)
    print("The device execution environment has been halted.")
    term.setCursorPos(2, h - 2)
    term.setTextColor(colors.lightGray)
    write("Press ANY KEY to reboot the computer...")
    
    os.pullEvent("key")
    os.reboot()
end

_G.error = devicePanic

-- Main

print("lightOS UEFI")
print("Booting device...")
wait(2)
shell.run("/bootmgr.lua")