local ver = "1.0.0"

-- Custom BIOS
-- for lightOS
-- In computerCraft

local function boot()
    print("0 - booting lightOS v" .. ver)
    print("1 - Advanced options")
    print("2 - Reboot")

    local input = read()
    if input == "0" then
        print("Booting lightOS...")
        local currentPath = shell.path()
        shell.setPath(":/bin:/lightOS:/libs")
        shell.run("lightOS/init.lua")
    end
    elseif input == "1" then
    -- b
    end
    elseif input == "2" then
        os.reboot()
    else
        print("Invalid option. Rebooting...")
        os.reboot()
    end
end