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

-- lightOS custom shell
local lapi = dofile("/lib/lapi.lua")

local bExit = false
local sDir = shell and shell.dir() or ""
local sPath = ".:/lightOS:/bin:/apps:/lib"
local tAliases = { ls = "list", dir = "list" }

local shellApi = {}

function shellApi.dir()
    return sDir
end

function shellApi.setDir(dir)
    sDir = dir
end

function shellApi.path()
    return sPath
end

function shellApi.setPath(path)
    sPath = path
end

function shellApi.aliases()
    local copy = {}
    for k, v in pairs(tAliases) do copy[k] = v end
    return copy
end

function shellApi.setAlias(word, program)
    tAliases[word] = program
end

-- резолвить відносний шлях у абсолютний, враховуючи sDir
function shellApi.resolve(path)
    if path:sub(1, 1) == "/" then
        return fs.combine("", path)
    end
    return fs.combine(sDir, path)
end

-- шукає програму по PATH
function shellApi.resolveProgram(command)
    if tAliases[command] then
        command = tAliases[command]
    end

    if command:sub(1, 1) == "/" then
        local path = fs.combine("", command)
        if fs.exists(path) and not fs.isDir(path) then return path end
        if fs.exists(path .. ".lua") and not fs.isDir(path .. ".lua") then return path .. ".lua" end
        return nil
    end

    for dir in sPath:gmatch("[^:]+") do
        local path = fs.combine(shellApi.resolve(dir), command)
        if fs.exists(path) and not fs.isDir(path) then return path end
        if fs.exists(path .. ".lua") and not fs.isDir(path .. ".lua") then return path .. ".lua" end
    end
    return nil
end

function shellApi.exit()
    bExit = true
end

-- запуск програми з аргументами
function shellApi.run(...)
    local words = { ... }
    local command = table.remove(words, 1)
    if not command then return false end

    local path = shellApi.resolveProgram(command)
    if not path then
        printError("No such program: " .. command)
        return false
    end

    -- перевірка на hashbang (#!interpreter)
    local f = fs.open(path, "r")
    local firstLine = f.readLine()
    f.close()

    local env = { shell = shellApi }
    local ok, err

    if firstLine and firstLine:sub(1, 2) == "#!" then
        local interpreter = firstLine:sub(3):match("^%s*(.-)%s*$")
        local interpPath = shellApi.resolveProgram(interpreter)
        if interpPath then
            ok, err = pcall(function()
                os.run(env, interpPath, path, table.unpack(words))
            end)
        else
            printError("Interpreter not found: " .. interpreter)
            return false
        end
    else
        ok, err = pcall(function()
            os.run(env, path, table.unpack(words))
        end)
    end

    if not ok then
        printError(tostring(err))
        return false
    end
    return true
end

_G.shell = shellApi

-- === ПРОМПТ ===
local function printPrompt()
    local burmalda = lapi.loadConfig("/lightOS/config.cfg")
    local pcname = burmalda.pcname or "unknown"
    local usr = burmalda.usr or "unknown"
    local dir = shellApi.dir()
    if dir == "" then dir = "/" end

    -- 1 рядок: жовтий, pcname==директорія:
    term.setTextColor(colors.yellow)
    print(pcname .. "==" .. dir .. ":")

    -- 2 рядок: usr темно-синім, $ оранжевим
    term.setTextColor(colors.blue)
    write(usr)
    term.setTextColor(colors.orange)
    write("$ ")

    term.setTextColor(colors.white)
end

-- === ГОЛОВНИЙ ЦИКЛ ===
while not bExit do
    printPrompt()
    local input = read()

    if input and input:match("%S") then
        local words = {}
        for w in input:gmatch("%S+") do table.insert(words, w) end
        shellApi.run(table.unpack(words))
    end
end