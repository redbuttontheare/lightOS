local function autoexec(tbl)
    for _, path in pairs(tbl) do
        if fs.exists(path) then
            pcall(dofile, path)
        end
    end
end

return autoexec