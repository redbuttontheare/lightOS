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

local PROTOCOL = "lweb"
local REQUEST_TIMEOUT = 5


local function openModem()
    local sides = peripheral.getNames()
    for _, name in ipairs(sides) do
        if peripheral.getType(name) == "modem" then
            rednet.open(name)
            return true, name
        end
    end
    return false, "No modem found"
end

local ok, modemSide = openModem()
if not ok then
    printError("lweb: " .. tostring(modemSide))
    return
end


write("Enter address: ")
local input = read()

if not input or input == "" then
    printError("No address entered.")
    return
end

local rest = input:gsub("^lpage://", "")
local hostPart, pagePart = rest:match("^([^/]+)/?(.*)$")

if not hostPart or hostPart == "" then
    printError("Invalid address: " .. input)
    return
end

local ip = "lpage://" .. hostPart
local pageName = (pagePart ~= "") and pagePart or nil

print("Looking up " .. ip .. "...")
local serverId = rednet.lookup(PROTOCOL, ip)

if not serverId then
    printError("Page not found: " .. ip)
    return
end

local function request(reqTable, timeout)
    timeout = timeout or REQUEST_TIMEOUT
    rednet.send(serverId, reqTable, PROTOCOL)

    local endTime = os.clock() + timeout
    while os.clock() < endTime do
        local senderId, response = rednet.receive(PROTOCOL, endTime - os.clock())
        if senderId == serverId then
            return response
        end
    end

    return nil, "Timeout waiting for response from server"
end

print("Loading page" .. (pageName and (" '" .. pageName .. "'") or "") .. "...")
local pageResp, pageErr = request({ action = "getPage", page = pageName })

if not pageResp or not pageResp.ok then
    printError("Failed to load page: " .. tostring(pageErr or (pageResp and pageResp.error)))
    return
end

local source = pageResp.source
local page = {}

function page.getState(key)
    local resp, err = request({ action = "getState", key = key })
    if not resp or not resp.ok then
        printError("page.getState failed: " .. tostring(err or (resp and resp.error)))
        return nil
    end
    return resp.value
end

function page.setState(key, value)
    local resp, err = request({ action = "setState", key = key, value = value })
    if not resp or not resp.ok then
        printError("page.setState failed: " .. tostring(err or (resp and resp.error)))
        return false
    end
    return true
end

local function loadGelaxyWidget(name)
    local path = "/lib/gelaxy/" .. name .. ".lua"
    if fs.exists(path) then
        return dofile(path)
    end
    return nil
end

local pageEnv = setmetatable({
    page = page,
    button = loadGelaxyWidget("button"),
    checkbox = loadGelaxyWidget("checkbox"),
    textbox = loadGelaxyWidget("textbox"),
    window = loadGelaxyWidget("window"),
}, { __index = _G })

local chunk, loadErr = load(source, "=" .. ip, "t", pageEnv)

if not chunk then
    printError("Page has a syntax error:")
    printError(tostring(loadErr))
    return
end

term.clear()
term.setCursorPos(1, 1)

local runOk, runErr = pcall(chunk)

if not runOk then
    printError("Page crashed: " .. tostring(runErr))
end