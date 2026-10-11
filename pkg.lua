local REPOS_PATH = "/lightOS/repos.cfg"
local INSTALLED_PATH = "/lightOS/installed.cfg"
local PKGDB_DIR = "/lightOS/pkgdb"
local OFFICIAL_NAME = "lightOS-Official"
local CACHE_DIR = "/lightOS/cache/pkg"

local quiet = false

if not fs.exists(CACHE_DIR) then
    fs.makeDir(CACHE_DIR)
end

local archive = dofile("/lib/archive.lua")
local lapi = dofile("/lib/lapi.lua")

local repos = {
    [OFFICIAL_NAME] = "https://raw.githubusercontent.com/redbuttontheare/lightOS/main/packages"
}

local function say(text)
    if not quiet then
        print(text)
    end
end

local function confirm(prompt)
    if quiet then
        return true
    end
    write(prompt)
    local answer = (read() or ""):lower()
    return answer == "y" or answer == "yes"
end

local function isValidName(name)
    return type(name) == "string"
        and name ~= ""
        and name:match("^[%w_%.%-]+$") ~= nil
        and not name:find("..", 1, true)
end

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

local function unpackToCache(archivePath, tmpName)
    local extractDir = CACHE_DIR .. "/extract_" .. tmpName
    if fs.exists(extractDir) then
        fs.delete(extractDir)
    end

    local ok, extractedOrErr, destRoot = archive.unpack(archivePath, extractDir)

    if not ok then
        if fs.exists(extractDir) then
            fs.delete(extractDir)
        end
        return nil, extractedOrErr
    end

    return destRoot, extractDir
end

local function extractArchive(archiveUrl, tmpName)
    local tmpArchivePath = CACHE_DIR .. "/" .. tmpName .. ".arc"

    if not get(archiveUrl, tmpArchivePath) then
        return nil, "Could not download archive: " .. archiveUrl
    end

    local destRoot, extractDirOrErr = unpackToCache(tmpArchivePath, tmpName)
    fs.delete(tmpArchivePath)

    return destRoot, extractDirOrErr
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
    local installedPaths = {}
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

            local ok = pcall(fs.copy, srcPath, destPath)
            if ok then
                table.insert(installedPaths, destPath)
                say("Installing " .. rel .. " -> " .. destPath)
            else
                printError("Failed to install: " .. destPath)
                failedAny = true
            end
        end
    end

    return not failedAny, installedPaths
end

local function readInstalled()
    if not fs.exists(INSTALLED_PATH) then
        return {}
    end
    return lapi.loadConfig(INSTALLED_PATH)
end

local function writeInstalled(installed)
    local f = fs.open(INSTALLED_PATH, "w")
    for pkgName, pkgVer in pairs(installed) do
        f.writeLine(pkgName .. "=" .. pkgVer)
    end
    f.close()
end

local function fileListPath(name)
    return PKGDB_DIR .. "/" .. name .. ".files"
end

local function recordInstalled(name, ver, paths)
    local installed = readInstalled()
    installed[name] = ver or "unknown"
    writeInstalled(installed)

    if not fs.exists(PKGDB_DIR) then
        fs.makeDir(PKGDB_DIR)
    end

    local f = fs.open(fileListPath(name), "w")
    if f then
        for _, path in ipairs(paths) do
            f.writeLine(path)
        end
        f.close()
    end
end

local function readFileList(name)
    local path = fileListPath(name)
    if not fs.exists(path) then
        return nil
    end

    local f = fs.open(path, "r")
    if not f then
        return nil
    end

    local paths = {}
    local line = f.readLine()
    while line do
        if line ~= "" then
            table.insert(paths, line)
        end
        line = f.readLine()
    end
    f.close()

    return paths
end

local function removeInstalledRecord(name)
    local installed = readInstalled()
    installed[name] = nil
    writeInstalled(installed)

    local path = fileListPath(name)
    if fs.exists(path) then
        fs.delete(path)
    end
end

local function listInstalled()
    local installed = readInstalled()
    local names = {}
    for name in pairs(installed) do
        table.insert(names, name)
    end
    table.sort(names)

    if #names == 0 then
        print("No packages installed.")
        return
    end

    print("Installed packages:")
    for _, name in ipairs(names) do
        print("  " .. name .. " (" .. installed[name] .. ")")
    end
end

local function finishInstall(cfg, destRoot, extractDir, repoName)
    if not isValidName(cfg.name) then
        fs.delete(extractDir)
        printError("Invalid package name in package.cfg: " .. tostring(cfg.name))
        return
    end

    say("Name: " .. tostring(cfg.name))
    say("Author: " .. tostring(cfg.author))
    say("Version: " .. tostring(cfg.ver))

    if repoName and repoName ~= OFFICIAL_NAME then
        if quiet then
            printError("WARNING: installing from unverified repository '" .. repoName .. "'")
        else
            print("")
            print("WARNING: this repository is not verified by lightOS.")
            print("Install packages from it at your own risk.")
        end
    end

    if not confirm("Proceed with install? (y/n): ") then
        fs.delete(extractDir)
        say("Cancelled.")
        return
    end

    local ok, installedPaths = installFromExtracted(destRoot)
    fs.delete(extractDir)

    if ok then
        recordInstalled(cfg.name, cfg.ver, installedPaths)
        say("Done installing '" .. cfg.name .. "'.")
    else
        printError("Done, but some files failed to install.")
    end
end

local function installPackage(pkgName)
    if not isValidName(pkgName) then
        printError("Invalid package name: " .. tostring(pkgName))
        return
    end

    say("Searching for '" .. pkgName .. "'...")

    local cfg, destRoot, extractDir, repoName = findPackageArchive(pkgName)

    if not cfg then
        printError("Package not found: " .. pkgName)
        return
    end

    say("Found in repo: " .. repoName)
    finishInstall(cfg, destRoot, extractDir, repoName)
end

local function installLocal(path)
    local archivePath = path
    if shell and shell.resolve then
        archivePath = shell.resolve(path)
    end

    if not fs.exists(archivePath) or fs.isDir(archivePath) then
        printError("Archive not found: " .. archivePath)
        return
    end

    say("Reading '" .. archivePath .. "'...")

    local destRoot, extractDirOrErr = unpackToCache(archivePath, "local_install")

    if not destRoot then
        printError(extractDirOrErr)
        return
    end

    local cfgPath = fs.combine(destRoot, "package.cfg")
    if not fs.exists(cfgPath) then
        fs.delete(extractDirOrErr)
        printError("Invalid package: package.cfg not found in archive.")
        return
    end

    local cfg = lapi.loadConfig(cfgPath)
    cfg.name = cfg.name or fs.getName(destRoot)

    say("Source: local archive")
    finishInstall(cfg, destRoot, extractDirOrErr, nil)
end

local function uninstallPackage(pkgName)
    if not isValidName(pkgName) then
        printError("Invalid package name: " .. tostring(pkgName))
        return
    end

    say("Looking up '" .. pkgName .. "'...")

    local diskPaths = readFileList(pkgName)

    if not diskPaths then
        local cfg, destRoot, extractDir = findPackageArchive(pkgName)

        if not cfg then
            printError("Package not found (no install record, not in any repo): " .. pkgName)
            return
        end

        local relPaths = listFilesRecursive(destRoot)
        fs.delete(extractDir)

        diskPaths = {}
        for _, rel in ipairs(relPaths) do
            if rel ~= "package.cfg" then
                table.insert(diskPaths, "/" .. rel)
            end
        end
    end

    local pathsToRemove = {}
    for _, diskPath in ipairs(diskPaths) do
        if fs.exists(diskPath) then
            table.insert(pathsToRemove, diskPath)
        end
    end

    if #pathsToRemove == 0 then
        say("No installed files found for '" .. pkgName .. "' (already removed?).")
        removeInstalledRecord(pkgName)
        return
    end

    if not quiet then
        print("The following files will be removed:")
        for _, path in ipairs(pathsToRemove) do
            print("  " .. path)
        end
    end

    if not confirm("Proceed with uninstall? (y/n): ") then
        say("Cancelled.")
        return
    end

    local failedAny = false
    for _, path in ipairs(pathsToRemove) do
        local ok = pcall(fs.delete, path)
        if ok then
            say("Removed: " .. path)
        else
            printError("Failed to remove: " .. path)
            failedAny = true
        end
    end

    removeInstalledRecord(pkgName)

    if failedAny then
        printError("Done, but some files failed to remove.")
    else
        say("Done uninstalling '" .. pkgName .. "'.")
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
    print("  pkg install <name> [-y]")
    print("  pkg local <archive.arc> [-y]")
    print("  pkg uninstall <name> [-y]")
    print("  pkg list")
    print("  pkg addrepo <name> <url>")
    print("  pkg repos")
    print("")
    print("-y  skip confirmations and hide progress output (errors are still shown)")
end

loadRepos()

local positional = {}
for _, a in ipairs({ ... }) do
    if a == "-y" then
        quiet = true
    else
        table.insert(positional, a)
    end
end

local subcommand = positional[1]

if subcommand == "install" then
    if not positional[2] then
        printError("Usage: pkg install <name> [-y]")
    else
        installPackage(positional[2])
    end

elseif subcommand == "local" then
    if not positional[2] then
        printError("Usage: pkg local <archive.arc> [-y]")
    else
        installLocal(positional[2])
    end

elseif subcommand == "uninstall" then
    if not positional[2] then
        printError("Usage: pkg uninstall <name> [-y]")
    else
        uninstallPackage(positional[2])
    end

elseif subcommand == "list" then
    listInstalled()

elseif subcommand == "addrepo" then
    addRepository(positional[2], positional[3])

elseif subcommand == "repos" then
    listRepos()

else
    usage()
end
