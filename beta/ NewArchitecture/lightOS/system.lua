local system = {}

function system.run(name, program)
    local gw = _G.gelaxy_w

    if not gw then
        printError("system.run: _G.gelaxy is not set.")
        printError("Make sure the gelaxy initializer sets _G.gelaxy before .run().")
        return nil
    end

    return gw.createTab(name, program)
end

return system