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
local command = args[1]

if not command then
    printError("Usage: which <command>")
    return
end

local aliases = shell.aliases()
local realCommand = command

if aliases[command] then
    realCommand = aliases[command]
end

local path = shell.resolveProgram(realCommand)

if not path then
    print(command .. ": not found")
    return
end

if aliases[command] then
    term.setTextColor(colors.lightGray)
    write(command .. " -> " .. realCommand .. ": ")
    term.setTextColor(colors.white)
    print(path)
else
    print(path)
end