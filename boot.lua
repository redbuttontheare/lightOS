_G.lightos = {
    version = "1.1.0-alpha",
    running = true,
    bios_name = "LightOS BIOS"
}

local gpu = component.list("gpu")()
local screen = component.list("screen")()

if gpu and screen then
    component.invoke(gpu, "bind", screen)
    component.invoke(gpu, "setBackground", 0xC78E14)
    component.invoke(gpu, "setForeground", 0x000000)
    component.invoke(gpu, "fill", 1, 1, 50, 16, " ")
end

local function loadFile(path)
    local handle = component.invoke(computer.getBootAddress(), "open", path, "r")
    if not handle then return nil end
    
    local buffer = ""
    repeat
        local chunk = component.invoke(computer.getBootAddress(), "read", handle, 1024)
        buffer = buffer .. (chunk or "")
    until not chunk
    component.invoke(computer.getBootAddress(), "close", handle)
    
    return load(buffer, "=" .. path)
end

local graphics = loadFile("/lib/graphics.lua")
if graphics then graphics() end

local function executeLua(path)
    local code, err = loadFile(path)
    if not code then
        return "Error loading file: " .. tostring(err or "Not found")
    end
    
    local success, runErr = pcall(code)
    if not success then
        return "Runtime error: " .. tostring(runErr)
    end
    return "App finished execution."
end

local function handleCommand(input)
    local parts = {}
    for word in input:gmatch("%S+") do
        table.insert(parts, word)
    end
    
    local cmd = parts[1] or ""
    
    if cmd == "run" then
        local path = parts[2]
        if not path then return "Usage: run <path_to_file>" end
        return executeLua(path)
    elseif cmd == "reboot" then
        computer.shutdown(true)
    elseif cmd == "shutdown" then
        computer.shutdown(false)
    elseif cmd == "" then
        return ""
    else
        local binPath = "/bin/" .. cmd .. ".lua"
        local code = loadFile(binPath)
        if code then
            local success, err = pcall(code, table.unpack(parts, 2))
            if not success then return "Bin error: " .. tostring(err) end
            return ""
        else
            return "Unknown command or file: " .. cmd
        end
    end
end

if _G.print then
    print("Welcome to LightOS Shell")
end

local currentInput = ""

while _G.lightos.running do
    if gpu then
        local w, h = component.invoke(gpu, "getResolution")
        component.invoke(gpu, "fill", 1, h, w, 1, " ")
        component.invoke(gpu, "set", 3, h, "lightos_cli> " .. currentInput .. "_")
    end
    
    local sig, _, char, code = computer.pullSignal()
    
    if sig == "key_down" then
        if code == 28 then
            if _G.print then print("lightos_cli> " .. currentInput) end
            local response = handleCommand(currentInput)
            if response ~= "" and _G.print then
                print(response)
            end
            currentInput = ""
        elseif code == 14 then
            currentInput = currentInput:sub(1, -2)
        elseif char and char >= 32 and char <= 126 then
            currentInput = currentInput .. string.char(char)
        end
    end
end
