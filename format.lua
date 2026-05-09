local computerID = os.getComputerID()

term.clear()
term.setCursorPos(1,1)

-- Set red color for warning
if term.isColor() then term.setTextColor(colors.red) end
print("!!! CRITICAL OPERATION !!!")
print("This will permanently delete ALL data.")
if term.isColor() then term.setTextColor(colors.white) end

print("\nTo confirm, please enter this PC's ID: " .. computerID)
write("Input: ")
local input = read()

if input == tostring(computerID) then
    print("\n[OK] ID confirmed.")
    print("Formatting starts in 3 seconds...")
    sleep(3)

    local files = fs.list("/")
    local total = #files
    
    for i, name in ipairs(files) do
        if name ~= "rom" then
            -- Progress bar logic
            local percent = math.floor((i / total) * 100)
            local barWidth = 20
            local filled = math.floor((i / total) * barWidth)
            
            term.setCursorPos(1, 10)
            term.clearLine()
            write("Progress: [" .. string.rep("#", filled) .. string.rep("-", barWidth - filled) .. "] " .. percent .. "%")
            
            fs.delete(name)
            sleep(0.2) -- Small delay for visual effect
        end
    end

    print("\n\nSystem wiped successfully. Rebooting...")
    sleep(2)
    os.reboot()
else
    print("\n[FAILED] Incorrect ID. Operation aborted.")
end
