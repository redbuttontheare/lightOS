local REPOS_PATH = "/lightOS/repos.cfg"
local OFFICIAL_NAME = "lightOS-Official"
local CACHE_DIR = "/lightOS/cache/pkg"

if not fs.exists(CACHE_DIR) then
    fs.makeDir(CACHE_DIR)
end

local archive = dofile("/lib/archive.lua")
local lapi = dofile("/lib/lapi.lua")

local repos = {
    [OFFICIAL_NAME] = "https://raw.githubusercontent.com/redbuttontheare/lightOS/main/packages"
}

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
    for name, url in pairs(repos) do
        f.writeLine(name .. "=" .. url)
    end
    f.close()
end

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

local function listFilesRecursive(dir, prefix, result)
    result = result or {}
    prefix = prefix or ""

    for _, name in ipairs(fs.list(dir)) do
        local full = fs.combine(dir, name)
        local rel = (prefix == "") and name or (prefix .. "/" .. name)

        if fs.isDir(full) then
            listFilesRecursive(full, rel, result)
        else
            table.insert(result, rel)
        end
    end

    return result
end

local function extractArchive(archiveUrl, tmpName)
    local tmpArchivePath = CACHE_DIR .. "/" .. tmpName .. ".arc"

    if not get(archiveUrl, tmpArchivePath) then
        return nil, "Could not download archive: " .. archiveUrl
    end

    local extractDir = CACHE_DIR .. "/extract_" .. tmpName
    if fs.exists(extractDir) then
        fs.delete(extractDir)
    end

    local ok, extractedOrErr, destRoot = archive.unpack(tmpArchivePath, extractDir)
    fs.delete(tmpArchivePath)

    if not ok then
        return nil, extractedOrErr
    end

    return destRoot, extractDir
end

local function findPackageArchive(pkgName)
    for _, repo in ipairs(orderedRepoList()) do
        local url = repo.base .. "/" .. pkgName .. ".arc"
        local destRoot, extractDirOrErr = extractArchive(url, pkgName)

        if destRoot then
            local cfgPath = fs.combine(destRoot, "package.cfg")
            if not fs.exists(cfgPath) then
                fs.delete(extractDirOrErr)
            else
                local cfg = lapi.loadConfig(cfgPath)
                cfg.name = cfg.name or pkgName
                return cfg, destRoot, extractDirOrErr, repo.name
            end
        end
    end

    return nil
end

local function installFromExtracted(destRoot)
    local relPaths = listFilesRecursive(destRoot)
    local failedAny = false

    for _, rel in ipairs(relPaths) do
        if rel ~= "package.cfg" then
            local srcPath = fs.combine(destRoot, rel)
            local destPath = "/" .. rel
            local destDir = fs.getDir(destPath)

            if destDir ~= "" and not fs.exists(destDir) then
                fs.makeDir(destDir)
            end

            if fs.exists(destPath) then
                fs.delete(destPath)
            end

            write("Installing " .. rel .. " -> " .. destPath .. "... ")
            local ok = pcall(fs.copy, srcPath, destPath)
            if ok then
                print("OK")
            else
                print("FAILED")
                failedAny = true
            end
        end
    end

    return not failedAny
end

local function findPackageConfigLegacy(pkgName)
    for _, repo in ipairs(orderedRepoList()) do
        local url = repo.base .. "/" .. pkgName .. "_config.lua"
        local tmpPath = CACHE_DIR .. "/" .. pkgName .. "_config.lua"

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

local function resolveInstalledPath(cfg, filePath)
    local fileName = fs.getName(filePath)

    if cfg.type == "cmd" then
        return "/bin/" .. fileName
    elseif cfg.type == "app" then
        return "/apps/" .. cfg.name .. "/" .. fileName
    elseif cfg.type == "lib" then
        return "/lib/" .. cfg.name .. "/" .. fileName
    end

    return nil
end

local function downloadPackageFilesLegacy(cfg, base)
    if not cfg.files then
        printError("Package config has no 'files' list.")
        return false
    end

    local failedAny = false

    for _, filePath in ipairs(cfg.files) do
        local url = base .. "/" .. filePath
        local savePath = resolveInstalledPath(cfg, filePath)

        if not savePath then
            printError("Unknown or missing 'type' in package config: " .. tostring(cfg.type))
            failedAny = true
        else
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

local function fetchConfigFromUrlLegacy(configUrl)
    local tmpPath = CACHE_DIR .. "/dep_config.lua"
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

local function installFromConfigUrlLegacy(configUrl, visited)
    if visited[configUrl] then
        return true
    end
    visited[configUrl] = true

    local cfg, base = fetchConfigFromUrlLegacy(configUrl)
    if not cfg then
        printError("Failed to fetch dependency config: " .. configUrl)
        return false
    end

    print("Resolving dependency: " .. tostring(cfg.name) .. " (" .. tostring(cfg.ver) .. ")")

    if cfg.dependencies then
        for _, depUrl in ipairs(cfg.dependencies) do
            if not installFromConfigUrlLegacy(depUrl, visited) then
                printError("Failed to install dependency of '" .. tostring(cfg.name) .. "'")
                return false
            end
        end
    end

    return downloadPackageFilesLegacy(cfg, base)
end

local function installPackage(pkgName)
    print("Searching for '" .. pkgName .. "'...")

    local cfg, destRoot, extractDir, repoName = findPackageArchive(pkgName)

    if cfg then
        print("Found in repo: " .. repoName .. " (archive)")
        print("Name: " .. tostring(cfg.name))
        print("Author: " .. tostring(cfg.author))
        print("Version: " .. tostring(cfg.ver))

        if repoName ~= OFFICIAL_NAME then
            print("")
            print("WARNING: this repository is not verified by lightOS.")
            print("Install packages from it at your own risk.")
        end

        write("Proceed with install? (y/n): ")
        local answer = read()
        if answer ~= "y" then
            fs.delete(extractDir)
            print("Cancelled.")
            return
        end

        local ok = installFromExtracted(destRoot)
        fs.delete(extractDir)

        if ok then
            print("Done installing '" .. pkgName .. "'.")
        else
            print("Done, but some files failed to install.")
        end
        return
    end

    local legacyCfg, legacyRepoName, legacyBase = findPackageConfigLegacy(pkgName)

    if not legacyCfg then
        printError("Package not found: " .. pkgName)
        return
    end

    print("Found in repo: " .. legacyRepoName .. " (legacy)")
    print("Name: " .. tostring(legacyCfg.name))
    print("Author: " .. tostring(legacyCfg.author))
    print("Version: " .. tostring(legacyCfg.ver))

    if legacyCfg.dependencies and #legacyCfg.dependencies > 0 then
        print("This package has " .. #legacyCfg.dependencies .. " dependency(ies).")
    end

    if legacyRepoName ~= OFFICIAL_NAME then
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

    local visited = {}
    if legacyCfg.dependencies then
        for _, depUrl in ipairs(legacyCfg.dependencies) do
            if not installFromConfigUrlLegacy(depUrl, visited) then
                printError("Dependency install failed, aborting.")
                return
            end
        end
    end

    local ok = downloadPackageFilesLegacy(legacyCfg, legacyBase)

    if ok then
        print("Done installing '" .. pkgName .. "'.")
    else
        print("Done, but some files failed to install.")
    end
end

local function uninstallPackage(pkgName)
    print("Looking up '" .. pkgName .. "'...")

    local cfg, destRoot, extractDir = findPackageArchive(pkgName)

    if cfg then
        local relPaths = listFilesRecursive(destRoot)
        fs.delete(extractDir)

        local pathsToRemove = {}
        for _, rel in ipairs(relPaths) do
            if rel ~= "package.cfg" then
                local diskPath = "/" .. rel
                if fs.exists(diskPath) then
                    table.insert(pathsToRemove, diskPath)
                end
            end
        end

        if #pathsToRemove == 0 then
            print("No installed files found for '" .. pkgName .. "' (already removed?).")
            return
        end

        print("The following files will be removed:")
        for _, path in ipairs(pathsToRemove) do
            print("  " .. path)
        end

        write("Proceed with uninstall? (y/n): ")
        local answer = read()
        if answer ~= "y" then
            print("Cancelled.")
            return
        end

        local failedAny = false
        for _, path in ipairs(pathsToRemove) do
            local ok = pcall(fs.delete, path)
            if ok then
                print("Removed: " .. path)
            else
                printError("Failed to remove: " .. path)
                failedAny = true
            end
        end

        if failedAny then
            print("Done, but some files failed to remove.")
        else
            print("Done uninstalling '" .. pkgName .. "'.")
        end
        return
    end

    local legacyCfg = findPackageConfigLegacy(pkgName)

    if not legacyCfg then
        printError("Package config not found (in any repo): " .. pkgName)
        printError("Cannot determine which files belong to this package.")
        return
    end

    local pathsToRemove = {}
    for _, filePath in ipairs(legacyCfg.files or {}) do
        local diskPath = resolveInstalledPath(legacyCfg, filePath)
        if diskPath and fs.exists(diskPath) then
            table.insert(pathsToRemove, diskPath)
        end
    end

    if #pathsToRemove == 0 then
        print("No installed files found for '" .. pkgName .. "' (already removed?).")
        return
    end

    print("The following files will be removed:")
    for _, path in ipairs(pathsToRemove) do
        print("  " .. path)
    end

    write("Proceed with uninstall? (y/n): ")
    local answer = read()
    if answer ~= "y" then
        print("Cancelled.")
        return
    end

    local failedAny = false
    for _, path in ipairs(pathsToRemove) do
        local ok = pcall(fs.delete, path)
        if ok then
            print("Removed: " .. path)
        else
            printError("Failed to remove: " .. path)
            failedAny = true
        end
    end

    if legacyCfg.type == "app" or legacyCfg.type == "lib" then
        local dirBase = (legacyCfg.type == "app") and "/apps/" or "/lib/"
        local dirPath = dirBase .. legacyCfg.name
        if fs.exists(dirPath) and fs.isDir(dirPath) and #fs.list(dirPath) == 0 then
            fs.delete(dirPath)
        end
    end

    if failedAny then
        print("Done, but some files failed to remove.")
    else
        print("Done uninstalling '" .. pkgName .. "'.")
    end
end

local function addRepository(name, url)
    if not name or not url then
        printError("Usage: pkg addrepo <name> <url>")
        return
    end

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

local function listRepos()
    print("Configured repositories:")
    for _, repo in ipairs(orderedRepoList()) do
        local tag = repo.name == OFFICIAL_NAME and " (official)" or ""
        print("  " .. repo.name .. tag)
        print("    " .. repo.base)
    end
end

local function usage()
    print("lightOS package manager")
    print("")
    print("Usage:")
    print("  pkg install <name>")
    print("  pkg uninstall <name>")
    print("  pkg addrepo <name> <url>")
    print("  pkg repos")
end

loadRepos()

local args = { ... }
local subcommand = args[1]

if subcommand == "install" then
    local pkgName = args[2]
    if not pkgName then
        printError("Usage: pkg install <name>")
    else
        installPackage(pkgName)
    end

elseif subcommand == "uninstall" then
    local pkgName = args[2]
    if not pkgName then
        printError("Usage: pkg uninstall <name>")
    else
        uninstallPackage(pkgName)
    end

elseif subcommand == "addrepo" then
    addRepository(args[2], args[3])

elseif subcommand == "repos" then
    listRepos()

else
    usage()
end