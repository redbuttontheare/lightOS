-- Copyright (C) 2026 redbuttontheare@gmail.com
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
-- GNU General Public License for more details.

local args = { ... }
local sourceFile = args[1]

if not sourceFile then
    printError("Usage: deps <file.lua>")
    return
end

local path = shell.resolve(sourceFile)

if not fs.exists(path) then
    printError("File not found: " .. path)
    return
end

if fs.isDir(path) then
    printError("Cannot scan a directory: " .. path)
    return
end

local f = fs.open(path, "r")
if not f then
    printError("Could not open file: " .. path)
    return
end

local content = f.readAll()
f.close()

-- функції, виклики яких вважаємо залежностями
local trackedFuncs = { "dofile", "require", "loadfile" }

-- знайдені залежності, з дедуплікацією і збереженням порядку появи
local found = {}
local seen = {}

for lineNum, line in ipairs((function()
    local lines = {}
    for l in (content .. "\n"):gmatch("(.-)\n") do
        table.insert(lines, l)
    end
    return lines
end)()) do
    -- пропускаємо коментарі (прості однорядкові --, не покриває довгі [[ ]] коментарі)
    local codePart = line
    local commentPos = line:find("%-%-")
    if commentPos then
        codePart = line:sub(1, commentPos - 1)
    end

    for _, funcName in ipairs(trackedFuncs) do
        -- шукаємо funcName("...") або funcName('...')
        for quote in codePart:gmatch(funcName .. '%s*%(%s*["\']([^"\']+)["\']') do
            local key = funcName .. ":" .. quote
            if not seen[key] then
                seen[key] = true
                table.insert(found, { func = funcName, value = quote, line = lineNum })
            end
        end
    end
end

if #found == 0 then
    print("No dependencies found in " .. sourceFile)
    return
end

print("Dependencies found in " .. sourceFile .. ":")
print("")

for _, dep in ipairs(found) do
    term.setTextColor(colors.lightGray)
    write("  line " .. dep.line .. ": ")
    term.setTextColor(colors.yellow)
    write(dep.func)
    term.setTextColor(colors.white)
    print("(\"" .. dep.value .. "\")")
end

term.setTextColor(colors.white)
print("")
print("Total: " .. #found .. " dependency(ies)")