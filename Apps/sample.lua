local function loadModule(path)
    local handle = component.invoke(computer.getBootAddress(), "open", path, "r")
    if handle then
        local buffer = ""
        repeat
            local chunk = component.invoke(computer.getBootAddress(), "read", handle, 1024)
            buffer = buffer .. (chunk or "")
        until not chunk
        component.invoke(computer.getBootAddress(), "close", handle)
        
        local code = load(buffer, "=" .. path)
        if code then code() end
    end
end

loadModule("/lib/graphics.lua")

print("Sample application running...")
print("This app using system libraries.")