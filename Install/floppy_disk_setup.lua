term.clear()
term.setCursorPos(1, 1)

local function git(url, path)
    local h = http.get(url)
 
    if not h then
        print("Download failed: " .. url)
        return
    end
 
    local file = fs.open(path, "w")
    file.write(h.readAll())
    file.close()
    h.close()
 
    print("Downloaded: " .. path)
end

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

local function inst_home()
    print("Downloading lightOS Home Edition files...")
    mkdir("disk/bin")
    mkdir("disk/libs")
    mkdir("disk/lightOS")
    git("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/Home/lib/lapi.lua", "disk/libs/lapi.lua")
    git("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/Home/installer.lua", "disk/installer.lua")
    print("Installation complete.")
end

print("Select edition to install:")
print("Home - lightOS Home Edition")
sep = read()
if sep == "Home" then
    print("Installing lightOS Home Edition...")
    print("Copying files to /disk...")
    inst_home()
end