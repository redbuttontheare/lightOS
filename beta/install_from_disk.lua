local sides = peripheral.getNames()
local driveFound = false


for _, side in ipairs(sides) do
    if peripheral.getType(side) == "drive" then
        driveFound = true
        
        if disk.hasData(side) then
            local label = disk.getLabel(side)
            local id = disk.getID(side)
        else
            error("No disk found =" .. side)
        end
    end
end

if not driveFound then
    error("Peripheral device error")
end

if disk.hasData(side) then
    local label = disk.getLabel(side)
    local id = disk.getID(side)
    shell.run("/lightOS/pkg.lua", "local", "/disk/package_files.arc", "-y")
    print("Completed.")
else
    error("No data found on the disk.")
end