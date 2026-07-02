term.clear()
term.setCursorPos(1, 1)

print("=== LightOS Boot Disk Creator ===")
print("Looking for floppy drive...")

if not fs.exists("disk") then
    term.setTextColor(colors.red)
    print("\n[Error] No floppy disk detected!")
    term.setTextColor(colors.white)
    print("Please insert a floppy disk into the drive.")
    return
end

print("Floppy disk found at /disk")
write("Prepare to format and copy files? (y/n): ")
local answer = read()

if string.lower(answer) ~= "y" then
    print("Operation cancelled.")
    return
end

print("\nFormatting /disk...")
local diskFiles = fs.list("disk")
for _, file in ipairs(diskFiles) do
    fs.delete("disk/" .. file)
end
