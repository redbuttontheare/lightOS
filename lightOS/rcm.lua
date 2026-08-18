local console = dofile("/lib/console.lua")
local base = "https://raw.githubusercontent.com/redbuttontheare/lightOS/main/"
local BghexValue = 0x0341fc

term.setPaletteColor(colors.purple, BghexValue)
local baseblue = colors.purple

local function get(file, savePath)
    local uniqueId = tostring(os.epoch("utc"))
    local url = base .. file .. "?nocache=" .. uniqueId
    
    local response = http.get({
        url = url,
        headers = {
            ["Cache-Control"] = "no-cache, no-store, must-revalidate",
            ["Pragma"] = "no-cache",
            ["Expires"] = "0",
            ["User-Agent"] = "ComputerCraft-lightOS-" .. uniqueId 
        }
    })
    
    if not response then
        return false
    end
    
    local code = response.readAll()
    response.close()
    
    local f = fs.open(savePath, "w")
    if not f then
        return false
    end
    
    f.write(code)
    print("To: " .. savePath)
    f.close()
    return true
end

term.setBackgroundColor(baseblue)
term.clear()
term.setCursorPos(1,1)

print("lightOS Recovery mode")
print("Chose option")
print("1. Resume")
print("2. Reinstall lightOS(requires internet connection)")
print("3. Reboot")

while true do
    input = read()
    if input == "1" then
        shell.run("/lightOS/bs.lua")
        break
    elseif input == "3" then
        os.reboot()
    elseif input == "2" then
        term.setBackgroundColor(colors.black)
        term.clear()
        term.setCursorPos(1,1)
        console.print_info("Downloading installation script...")
        get("install.lua", "/tmp/reinstall.lua")
        sleep(2)
        console.print_ok("The installation script downloaded")
        print("Do you want to reinstall lightOS?")
        write("[1-yes/0-NO]: ")
        yrwr = read()
        if yrwr == "1" then
            shell.run("/tmp/reinstall.lua")
        end
    end
end