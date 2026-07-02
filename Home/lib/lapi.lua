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

function lapi.user_hello(config)
    local username = config.usr or "User"
    print("Hello, " .. username .. "!")
end

function lapi.print_vm(config)
    local version = config.ver or "1.0"
    local update_info = config.lore or "No update info provided."
    
    print("LightOS v" .. version)
    print("├ " .. update_info .. " ┤")
end

function lapi.login(username, password)
    local syscfg = lapi.loadConfig("lightOS/config.cfg")
    print("Logging in as " .. username .. "...")
    write("Enter password: ")
    local input_password = read("*")
    if input_password == password then
        print("Login successful!")
    else
        print("Login failed! Please check your username and password.")
        os.reboot()
    end
end

return lapi
