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

-- anet: покращена обгортка над стандартним http API CC:Tweaked
-- дає зручніший інтерфейс поверх http.get/http.post:
--   - автоматичний anti-cache (unique nocache-параметр + заголовки)
--   - перевірка HTTP response code замість сліпого читання тіла
--   - зручне збереження файлу на диск (download)
--   - опційний retry при невдалому запиті
--   - базовий JSON encode/decode через textutils (вбудований в CC:Tweaked)

local anet = {}

local DEFAULT_RETRIES = 1

local function noCacheHeaders(uniqueId)
    return {
        ["Cache-Control"] = "no-cache, no-store, must-revalidate",
        ["Pragma"] = "no-cache",
        ["Expires"] = "0",
        ["User-Agent"] = "ComputerCraft-lightOS-" .. uniqueId
    }
end

local function addNoCache(url, uniqueId)
    local sep = url:find("?") and "&" or "?"
    return url .. sep .. "nocache=" .. uniqueId
end

-- anet.get(url, options)
-- options (усі опційні):
--   noCache = true/false (default true)
--   headers = {}         (додаткові заголовки, зливаються з anti-cache)
--   retries = число спроб при невдачі (default 1, тобто без повторів)
--
-- повертає: body (рядок), code (число) при успіху
--           nil, errMessage при невдачі
function anet.get(url, options)
    options = options or {}
    local retries = options.retries or DEFAULT_RETRIES
    local useNoCache = options.noCache
    if useNoCache == nil then useNoCache = true end

    local lastErr = "unknown error"

    for attempt = 1, retries do
        local uniqueId = tostring(os.epoch("utc")) .. "_" .. attempt
        local requestUrl = useNoCache and addNoCache(url, uniqueId) or url

        local headers = {}
        for k, v in pairs(options.headers or {}) do headers[k] = v end
        if useNoCache then
            local nc = noCacheHeaders(uniqueId)
            for k, v in pairs(nc) do
                if headers[k] == nil then headers[k] = v end
            end
        end

        local response, err = http.get({ url = requestUrl, headers = headers })

        if response then
            local code = response.getResponseCode and response.getResponseCode() or 200
            local body = response.readAll()
            response.close()

            if code == 200 then
                return body, code
            else
                lastErr = "HTTP " .. tostring(code)
            end
        else
            lastErr = err or "http.get failed"
        end
    end

    return nil, lastErr
end

-- anet.post(url, body, options)
-- options: headers (опційно)
-- повертає: body, code   або   nil, errMessage
function anet.post(url, body, options)
    options = options or {}
    local headers = options.headers or {}

    local response, err = http.post({ url = url, body = body, headers = headers })

    if not response then
        return nil, err or "http.post failed"
    end

    local code = response.getResponseCode and response.getResponseCode() or 200
    local respBody = response.readAll()
    response.close()

    if code ~= 200 and code ~= 201 then
        return nil, "HTTP " .. tostring(code)
    end

    return respBody, code
end

-- anet.download(url, savePath, options)
-- качає url і одразу зберігає у файл на диску
-- повертає true при успіху, або false, errMessage при невдачі
function anet.download(url, savePath, options)
    local body, errOrCode = anet.get(url, options)

    if not body then
        return false, errOrCode
    end

    local f = fs.open(savePath, "w")
    if not f then
        return false, "Could not open file for writing: " .. savePath
    end

    f.write(body)
    f.close()

    return true
end

-- anet.getJSON(url, options)
-- качає і одразу парсить JSON через textutils
-- повертає: table, code   або   nil, errMessage
function anet.getJSON(url, options)
    local body, errOrCode = anet.get(url, options)

    if not body then
        return nil, errOrCode
    end

    local ok, decoded = pcall(textutils.unserializeJSON, body)
    if not ok or decoded == nil then
        return nil, "Failed to parse JSON response"
    end

    return decoded, errOrCode
end

-- anet.postJSON(url, tbl, options)
-- серіалізує таблицю в JSON, відправляє POST, парсить відповідь назад як JSON
function anet.postJSON(url, tbl, options)
    options = options or {}
    local headers = {}
    for k, v in pairs(options.headers or {}) do headers[k] = v end
    headers["Content-Type"] = headers["Content-Type"] or "application/json"

    local body = textutils.serializeJSON(tbl)
    local respBody, errOrCode = anet.post(url, body, { headers = headers })

    if not respBody then
        return nil, errOrCode
    end

    local ok, decoded = pcall(textutils.unserializeJSON, respBody)
    if not ok or decoded == nil then
        return nil, "Failed to parse JSON response"
    end

    return decoded, errOrCode
end

return anet
