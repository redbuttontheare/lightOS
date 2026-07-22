local logger = {}

local function logger.create_logfile(name)
    logfile = fs.open(name, "w")
    logfile.close()
end

local function logger.write_title(logfile, title)
    local lf = fs.open(logfile, "a")
    lf.writeLine(title)
    lf.close()
end

local function logger.write_ok(logfile, log)
    local lf1 = fs.open(logfile, "a")
    lf1.writeLine("[ OK ]: " .. log)
    lf1.close()
end

local function logger.write_err(logfile, log)
    local lf2 = fs.open(logfile, "a")
    lf2.writeLine("[ ERROR ]: " .. log)
    lf2.close()
end

return logger