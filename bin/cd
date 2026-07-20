-- lightOS/bin/cd.lua
local args = { ... }
local target = args[1]

if not target then
    printError("Usage: cd <directory>")
    return
end

local newDir = shell.resolve(target)

if not fs.exists(newDir) then
    printError("No such directory: " .. newDir)
    return
end

if not fs.isDir(newDir) then
    printError("Not a directory: " .. newDir)
    return
end

shell.setDir(newDir)