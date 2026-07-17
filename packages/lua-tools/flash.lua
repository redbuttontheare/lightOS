local args = { ... }
local sourceFile = args[1]

if not sourceFile then
    printError("Usage: flash <file.lua>")
    return
end

local path = shell.resolve(sourceFile)

if not fs.exists(path) then
    printError("File not found: " .. path)
    return
end

if fs.isDir(path) then
    printError("Cannot flash a directory: " .. path)
    return
end

-- підтвердження, бо це перезапише startup.lua
term.setTextColor(colors.orange)
print("This will overwrite /startup.lua with:")
print("  " .. path)
term.setTextColor(colors.white)
write("Continue? (y/n): ")
local answer = read()

if answer ~= "y" and answer ~= "Y" then
    print("Flash cancelled.")
    return
end

-- читаємо вміст файлу-джерела
local src = fs.open(path, "r")
local content = src.readAll()
src.close()

-- записуємо його як новий startup.lua
local dst = fs.open("/startup.lua", "w")
dst.write(content)
dst.close()

term.setTextColor(colors.green)
print("Flashed: " .. path .. " -> /startup.lua")
term.setTextColor(colors.white)