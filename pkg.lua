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

local REPOS_PATH = "/lightOS/repos.cfg"
local OFFICIAL_NAME = "lightOS-Official"

local repos = {
    [OFFICIAL_NAME] = "https://raw.githubusercontent.com/redbuttontheare/lightOS/main/packages"
}

-- === repos.cfg: завантаження / збереження ===

local function loadRepos()
    if not fs.exists(REPOS_PATH) then return end
    local f = fs.open(REPOS_PATH, "r")
    local line = f.readLine()
    while line do
        if line ~= "" and not line:match("^%s*#") then
            local name, url = line:match("([^=]+)=(.*)")
            if name and url then
                name = name:match("^%s*(.-)%s*$")
                url = url:match("^%s*(.-)%s*$")
                repos[name] = url
            end
        end
        line = f.readLine()
    end
    f.close()
end

local function saveRepos()
    local f = fs.open(REPOS_PATH, "w")
    -- офіційний репо теж пишемо у файл, щоб він одразу був видимий користувачу
    for name, url in pairs(repos) do
        f.writeLine(name .. "=" .. url)
    end
    f.close()
end

-- === завантаження одного файлу з довільного URL ===

local function get(url, savePath)
    local uniqueId = tostring(os.epoch("utc"))
    local response = http.get({
        url = url .. "?nocache=" .. uniqueId,
        headers = {
            ["Cache-Control"] = "no-cache, no-store, must-revalidate",
            ["Pragma"] = "no-cache",
            ["Expires"] = "0",
            ["User-Agent"] = "ComputerCraft-lightOS-" .. uniqueId
        }
    })

    if not response then return false end

    if response.getResponseCode and response.getResponseCode() ~= 200 then
        response.close()
        return false
    end

    local code = response.readAll()
    response.close()

    local f = fs.open(savePath, "w")
    if not f then return false end
    f.write(code)
    f.close()
    return true
end

-- === побудова списку репо в порядку перевірки: спочатку офіційний, потім решта ===

local function orderedRepoList()
    local ordered = {}

    if repos[OFFICIAL_NAME] then
        table.insert(ordered, { name = OFFICIAL_NAME, base = repos[OFFICIAL_NAME] })
    end

    for name, base in pairs(repos) do
        if name ~= OFFICIAL_NAME then
            table.insert(ordered, { name = name, base = base })
        end
    end

    return ordered
end

-- === пошук <pkgName>_config.lua, офіційний репо перевіряється першим ===

local function findPackageConfig(pkgName)
    for _, repo in ipairs(orderedRepoList()) do
        local url = repo.base .. "/" .. pkgName .. "_config.lua"
        local tmpPath = "/tmp_" .. pkgName .. "_config.lua"

        if get(url, tmpPath) then
            local ok, cfg = pcall(dofile, tmpPath)
            fs.delete(tmpPath)
            if ok and type(cfg) == "table" then
                return cfg, repo.name, repo.base
            end
        end
    end
    return nil
end

-- === встановлення пакету ===

-- завантажити всі файли пакету (cfg.files), розкласти по /bin, /apps/<name>, /lib/<name>
-- залежно від cfg.type. Повертає true, якщо все ок, false якщо були помилки.
local function downloadPackageFiles(cfg, base)
    if not cfg.files then
        printError("Package config has no 'files' list.")
        return false
    end

    local failedAny = false

    for _, filePath in ipairs(cfg.files) do
        local url = base .. "/" .. filePath
        local fileName = fs.getName(filePath)
        local savePath

        if cfg.type == "cmd" then
            savePath = "/bin/" .. fileName
        elseif cfg.type == "app" then
            savePath = "/apps/" .. cfg.name .. "/" .. fileName
        elseif cfg.type == "lib" then
            savePath = "/lib/" .. cfg.name .. "/" .. fileName
        else
            printError("Unknown or missing 'type' in package config: " .. tostring(cfg.type))
            failedAny = true
            savePath = nil
        end

        if savePath then
            write("Downloading " .. filePath .. " -> " .. savePath .. "... ")
            if get(url, savePath) then
                print("OK")
            else
                print("FAILED")
                failedAny = true
            end
        end
    end

    return not failedAny
end

-- завантажує config.lua за прямим URL і повертає (cfg, base),
-- де base - директорія, в якій лежить сам config-файл (для відносних шляхів files)
local function fetchConfigFromUrl(configUrl)
    local tmpPath = "/tmp_dep_config.lua"
    if not get(configUrl, tmpPath) then
        return nil
    end

    local ok, cfg = pcall(dofile, tmpPath)
    fs.delete(tmpPath)

    if not ok or type(cfg) ~= "table" then
        return nil
    end

    local base = configUrl:match("(.+)/[^/]+$")
    return cfg, base
end

-- рекурсивно встановлює пакет за прямим URL на його _config.lua (для залежностей)
-- visited - таблиця вже оброблених URL, щоб не зациклитись при циклічних залежностях
local function installFromConfigUrl(configUrl, visited)
    if visited[configUrl] then
        return true
    end
    visited[configUrl] = true

    local cfg, base = fetchConfigFromUrl(configUrl)
    if not cfg then
        printError("Failed to fetch dependency config: " .. configUrl)
        return false
    end

    print("Resolving dependency: " .. tostring(cfg.name) .. " (" .. tostring(cfg.ver) .. ")")

    if cfg.dependencies then
        for _, depUrl in ipairs(cfg.dependencies) do
            if not installFromConfigUrl(depUrl, visited) then
                printError("Failed to install dependency of '" .. tostring(cfg.name) .. "'")
                return false
            end
        end
    end

    return downloadPackageFiles(cfg, base)
end

local function installPackage(pkgName)
    print("Searching for '" .. pkgName .. "'...")
    local cfg, repoName, base = findPackageConfig(pkgName)

    if not cfg then
        printError("Package not found: " .. pkgName)
        return
    end

    print("Found in repo: " .. repoName)
    print("Name: " .. tostring(cfg.name))
    print("Author: " .. tostring(cfg.author))
    print("Version: " .. tostring(cfg.ver))

    if cfg.dependencies and #cfg.dependencies > 0 then
        print("This package has " .. #cfg.dependencies .. " dependency(ies).")
    end

    if repoName ~= OFFICIAL_NAME then
        print("")
        print("WARNING: this repository is not verified by lightOS.")
        print("Install packages from it at your own risk.")
    end

    write("Proceed with install? (y/n): ")
    local answer = read()
    if answer ~= "y" then
        print("Cancelled.")
        return
    end

    -- спочатку залежності, кожна може мати свої власні залежності (рекурсивно)
    local visited = {}
    if cfg.dependencies then
        for _, depUrl in ipairs(cfg.dependencies) do
            if not installFromConfigUrl(depUrl, visited) then
                printError("Dependency install failed, aborting.")
                return
            end
        end
    end

    -- тепер файли самого пакету
    local ok = downloadPackageFiles(cfg, base)

    if ok then
        print("Done installing '" .. pkgName .. "'.")
    else
        print("Done, but some files failed to download.")
    end
end

-- === додавання нового репозиторію ===

local function addRepository()
    write("Repo name: ")
    local name = read()
    write("Repo base URL: ")
    local url = read()

    if name == OFFICIAL_NAME then
        printError("This name is reserved for the official repository.")
        return
    end

    if repos[name] then
        print("Repo already exists, overwriting.")
    end

    repos[name] = url
    saveRepos()
    print("Repository '" .. name .. "' added.")
end

-- === MAIN ===

loadRepos()

term.clear()
term.setCursorPos(1, 1)

print("lightOS package manager")
print(" 1. Install package by name")
print(" 2. Add repository")
write("> ")

local choice = read()

if choice == "1" then
    write("Package name: ")
    local pkgName = read()
    installPackage(pkgName)
elseif choice == "2" then
    addRepository()
else
    print("Invalid choice.")
end