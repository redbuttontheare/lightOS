local logger = {}

function logger.create_logfile(name)
    local logfile = fs.open(name, "w")
    if logfile then
        logfile.close()
    end
end


function logger.write_title(logfile, title)
    local lf = fs.open(logfile, "a")
    if lf then
        lf.writeLine(title)
        lf.close()
    end
end


function logger.write_ok(logfile, log)
    local lf = fs.open(logfile, "a")
    if lf then
        lf.writeLine("[ OK ]: " .. log)
        lf.close()
    end
end

function logger.write_err(logfile, log)
    local lf = fs.open(logfile, "a")
    if lf then
        lf.writeLine("[ ERROR ]: " .. log)
        lf.close()
    end
end

return logger
