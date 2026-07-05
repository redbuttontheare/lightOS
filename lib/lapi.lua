local lapi = {}

function lapi.loadConfig(path)
    local config = {}
    if not fs.exists(path) then
        print("Config not found: " .. path)
        return config
    end
    local file = fs.open(path, "r")
    local line = file.readLine()
    while line do
        if line ~= "" and not string.match(line, "^%s*#") then
            local key, value = string.match(line, "([^=]+)=(.*)")
            if key and value then
                key = string.match(key, "^%s*(.-)%s*$")
                value = string.match(value, "^%s*(.-)%s*$")
                config[key] = value
            end
        end
        line = file.readLine()
    end
    file.close()
    return config
end

return lapi