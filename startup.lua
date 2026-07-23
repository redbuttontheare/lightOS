local nativeError = _G.error

local function customKernelPanic(errMessage, level)
    local msg = errMessage or "Unknown system execution error"
    
    term.setBackgroundColor(colors.blue)
    term.setTextColor(colors.white)
    term.clear()
    
    local w, h = term.getSize()
    
    local title = " lightOS Kernel Panic "
    term.setCursorPos(math.floor((w - #title) / 2) + 1, 3)
    term.setBackgroundColor(colors.red)
    term.write(title)
    
    term.setBackgroundColor(colors.blue)
    term.setTextColor(colors.yellow)
    term.setCursorPos(2, 6)
    print("CRITICAL ERROR: " .. tostring(msg))
    
    term.setTextColor(colors.white)
    term.setCursorPos(2, h - 3)
    print("The system execution environment has been halted.")
    term.setCursorPos(2, h - 2)
    term.setTextColor(colors.lightGray)
    write("Press ANY KEY to reboot the computer...")
    
    os.pullEvent("key")
    os.reboot()
end

_G.error = customKernelPanic

local success, boot_options = pcall(dofile, "bm.lua")

if not success or type(boot_options) ~= "table" then
    print("Device not bootable...")
    sleep(3)
    os.reboot()
end

term.clear()
term.setCursorPos(1, 1)

print("=== Bootloader ===")
print("")

for i, option in ipairs(boot_options) do
    print(i .. ". " .. option.name)
end

print("")

local choice = nil
while true do
    term.write("Boot in: ")
    local input = read()
    local num = tonumber(input)
    
    if num and boot_options[num] then
        choice = boot_options[num]
        break
    else
        print("Invalid choice. Please try again.")
    end
end

term.clear()
term.setCursorPos(1, 1)

print("Booting " .. choice.name .. "...")
sleep(0.5)

local success, err = shell.run(choice.kernel_path)

if not success then
    print("Boot failed: " .. tostring(err))
end
