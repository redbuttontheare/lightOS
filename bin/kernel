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

local lapi = dofile("/lib/lapi.lua")

local CONFIG_PATH = "/lightOS/config.cfg"

-- дозволені ключі, якими можна керувати через kernel set/get
-- (захист від випадкового зіпсування довільних полів config.cfg)
local ALLOWED_KEYS = {
    autoexec = true
}

local function saveConfig(cfg)
    local f = fs.open(CONFIG_PATH, "w")
    if not f then
        printError("Could not open config for writing: " .. CONFIG_PATH)
        return false
    end
    for key, value in pairs(cfg) do
        f.writeLine(key .. "=" .. tostring(value))
    end
    f.close()
    return true
end

local args = { ... }
local mode = args[1]
local key = args[2]
local value = args[3]

local function usage()
    print("Usage:")
    print("  kernel get <key>")
    print("  kernel set <key> <value>")
    print("")
    print("Known keys: autoexec")
end

if not mode then
    usage()
    return
end

if mode == "get" then
    if not key then
        usage()
        return
    end

    local cfg = lapi.loadConfig(CONFIG_PATH)
    local current = cfg[key]

    if current == nil then
        print(key .. " is not set")
    else
        print(key .. "=" .. current)
    end

elseif mode == "set" then
    if not key or not value then
        usage()
        return
    end

    if not ALLOWED_KEYS[key] then
        printError("Unknown kernel setting: " .. key)
        print("Known keys: autoexec")
        return
    end

    if key == "autoexec" and value ~= "0" and value ~= "1" then
        printError("autoexec must be 0 or 1")
        return
    end

    local cfg = lapi.loadConfig(CONFIG_PATH)
    cfg[key] = value

    if saveConfig(cfg) then
        term.setTextColor(colors.green)
        print(key .. " set to " .. value)
        term.setTextColor(colors.white)
    end

else
    usage()
end