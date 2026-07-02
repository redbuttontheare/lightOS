print("lightOS Home Edition installation wizard")

print("Copying files from /disk...")

mkdir("bin")
mkdir("libs")
mkdir("lightOS")
fs.copy("disk/libs/lapi.lua", "libs/lapi.lua")

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

git("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/bios.lua", "bios.lua")
git("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/Home/lightOSk/init.lua", "lightOS/init.lua")
git("https://raw.githubusercontent.com/redbuttontheare/lightOS/main/startup.lua", "startup.lua")
fs.copy("disk/libs/lapi.lua", "libs/lapi.lua")

print("Creating configuration file...")
write("Enter your username: ")
username = read()
write("Enter your password: ")
local password = read("*")

local configFile = fs.open("lightOS/config.cfg", "w")
configFile.writeLine("# lightOS configuration file")
configFile.writeLine("usr=" .. username)
configFile.writeLine("pass=" .. password)
configFile.writeLine("ver=1.0.0")
configFile.writeLine("lore=Welcome to lightOS Home Edition!")
configFile.close()

sleep(1)
print("Installation complete. Rebooting...")
sleep(1)
os.reboot()