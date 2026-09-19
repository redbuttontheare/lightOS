local archive = {}

local RLE_ESCAPE = string.char(1)

local function rleCompress(data)
    local out = {}
    local i = 1
    local len = #data

    while i <= len do
        local byte = data:sub(i, i)

        if byte == RLE_ESCAPE then
            out[#out + 1] = RLE_ESCAPE .. "\0" .. RLE_ESCAPE
            i = i + 1
        else
            local j = i
            while j < len and data:sub(j + 1, j + 1) == byte do
                j = j + 1
            end
            local runLen = j - i + 1

            if runLen >= 4 then
                local remaining = runLen
                while remaining > 0 do
                    local chunk = math.min(remaining, 255)
                    out[#out + 1] = RLE_ESCAPE .. string.char(chunk) .. byte
                    remaining = remaining - chunk
                end
                i = j + 1
            else
                out[#out + 1] = byte
                i = i + 1
            end
        end
    end

    return table.concat(out)
end

local function rleDecompress(data)
    local out = {}
    local i = 1
    local len = #data

    while i <= len do
        local byte = data:sub(i, i)

        if byte == RLE_ESCAPE then
            local count = string.byte(data, i + 1)

            if count == 0 then
                out[#out + 1] = RLE_ESCAPE
                i = i + 3
            else
                local ch = data:sub(i + 2, i + 2)
                out[#out + 1] = string.rep(ch, count)
                i = i + 3
            end
        else
            out[#out + 1] = byte
            i = i + 1
        end
    end

    return table.concat(out)
end

archive.rleCompress = rleCompress
archive.rleDecompress = rleDecompress

local function splitLines(s)
    local lines = {}
    local start = 1
    while true do
        local nlPos = s:find("\n", start, true)
        if not nlPos then
            table.insert(lines, s:sub(start))
            break
        end
        table.insert(lines, s:sub(start, nlPos - 1))
        start = nlPos + 1
    end
    return lines
end

local function collectFiles(dir, prefix, result)
    result = result or {}
    prefix = prefix or ""

    for _, name in ipairs(fs.list(dir)) do
        local fullPath = fs.combine(dir, name)
        local relPath = (prefix == "") and name or (prefix .. "/" .. name)

        if fs.isDir(fullPath) then
            collectFiles(fullPath, relPath, result)
        else
            table.insert(result, { disk = fullPath, rel = relPath })
        end
    end

    return result
end

local function buildStructure(sourceDir, rootName)
    local lines = { rootName .. ":" }
    local files = collectFiles(sourceDir)

    for _, file in ipairs(files) do
        local f = fs.open(file.disk, "r")
        local content = f.readAll()
        f.close()

        table.insert(lines, " " .. file.rel .. ":")

        for _, contentLine in ipairs(splitLines(content)) do
            table.insert(lines, "  " .. contentLine)
        end
    end

    return table.concat(lines, "\n"), #files
end

function archive.pack(sourceDir, outputPath, rootName, compress)
    if not fs.exists(sourceDir) or not fs.isDir(sourceDir) then
        return false, "Source directory not found: " .. tostring(sourceDir)
    end

    if compress == nil then compress = true end
    rootName = rootName or fs.getName(sourceDir)

    local structure, fileCount = buildStructure(sourceDir, rootName)

    local out = fs.open(outputPath, "w")
    if not out then
        return false, "Could not open output file: " .. outputPath
    end

    if compress then
        out.writeLine("LARC-RLE")
        out.write(rleCompress(structure))
    else
        out.writeLine("LARC-RAW")
        out.write(structure)
    end

    out.close()
    return true, fileCount
end

local function parseStructure(structure, destParentDir)
    local lines = splitLines(structure)

    local rootLine = lines[1]
    if not rootLine or rootLine:sub(-1) ~= ":" then
        return false, "Invalid archive: missing root name"
    end
    local rootName = rootLine:sub(1, -2)
    local destRoot = fs.combine(destParentDir, rootName)

    local currentRelPath = nil
    local currentContentLines = nil
    local extracted = 0

    local function flushCurrentFile()
        if not currentRelPath then return true end

        local content = table.concat(currentContentLines, "\n")
        local destPath = fs.combine(destRoot, currentRelPath)
        local destDir = fs.getDir(destPath)

        if destDir ~= "" and not fs.exists(destDir) then
            fs.makeDir(destDir)
        end

        local outFile = fs.open(destPath, "w")
        if not outFile then
            return false, "Could not write: " .. destPath
        end
        outFile.write(content)
        outFile.close()

        extracted = extracted + 1
        return true
    end

    for i = 2, #lines do
        local line = lines[i]

        if line:sub(1, 1) == " " and line:sub(2, 2) ~= " " and line:sub(-1) == ":" then
            local ok, err = flushCurrentFile()
            if not ok then return false, err end

            currentRelPath = line:sub(2, -2)
            currentContentLines = {}

        elseif line:sub(1, 2) == "  " then
            if not currentContentLines then
                return false, "Corrupt archive: content line before any file declaration"
            end
            table.insert(currentContentLines, line:sub(3))

        elseif line == "" then

        else
            return false, "Corrupt archive: unexpected line: " .. line
        end
    end

    local ok, err = flushCurrentFile()
    if not ok then return false, err end

    return true, extracted, destRoot
end

function archive.unpack(archivePath, destParentDir)
    if not fs.exists(archivePath) then
        return false, "Archive not found: " .. archivePath
    end

    local f = fs.open(archivePath, "r")
    if not f then
        return false, "Could not open archive: " .. archivePath
    end

    local mode = f.readLine()
    local rest = f.readAll()
    f.close()

    local structure

    if mode == "LARC-RLE" then
        structure = rleDecompress(rest)
    elseif mode == "LARC-RAW" then
        structure = rest
    else
        return false, "Unknown or missing archive mode marker"
    end

    return parseStructure(structure, destParentDir)
end

return archive