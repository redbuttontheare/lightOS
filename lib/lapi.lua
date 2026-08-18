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

function lapi.createShortcut(path, target)
    shell.run("/bin/ln", "create", path, target)
end

return lapi