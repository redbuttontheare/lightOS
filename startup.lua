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