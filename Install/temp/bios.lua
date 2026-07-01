local gpu = component.list("gpu")()
local screen = component.list("screen")()

if gpu and screen then
    component.invoke(gpu, "bind", screen)
    component.invoke(gpu, "setBackground", 0xC78E14)
    component.invoke(gpu, "setForeground", 0x000000)
    component.invoke(gpu, "fill", 1, 1, 50, 16, " ")
    component.invoke(gpu, "set", 3, 2, "lightBIOS v1.0")
    component.invoke(gpu, "set", 3, 4, "Booting from boot.lua...")
    component.invoke(gpu, "set", 3, 6, "Created by Height studios")
end

local function bootFrom(address)
    local handle = component.invoke(address, "open", "/boot.lua", "r")
    if not handle then return nil end
    
    local buffer = ""
    repeat
        local chunk = component.invoke(address, "read", handle, 1024)
        buffer = buffer .. (chunk or "")
    repeat until not chunk
    component.invoke(address, "close", handle)
    
    return load(buffer, "=boot")
end

local bootCode = nil

for address in component.list("filesystem") do
    if component.invoke(address, "exists", "/boot.lua") then
        if gpu then component.invoke(gpu, "set", 3, 8, "Found drive: " .. address:sub(1, 4)) end
        bootCode = bootFrom(address)
        if bootCode then break end
    end
end

if bootCode then
    if gpu then component.invoke(gpu, "set", 3, 10, "Starting boot.lua...") end
    bootCode() 
else
    if gpu then component.invoke(gpu, "set", 3, 10, "Error: boot.lua not found!") end
    while true do computer.pullSignal(0.5) end
end
