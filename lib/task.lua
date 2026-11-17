local task = {}

function task.new(name, path, taskType)
    local newTask = {
        name = name,
        path = path,
        type = taskType,
        status = "running"
    }

    _G.taskList = _G.taskList or {}
    table.insert(_G.taskList, newTask)

    return newTask
end

function task.getTaskList()
    return _G.taskList
end

function task.getTaskByName(name)
    for _, t in ipairs(_G.taskList) do
        if t.name == name then
            return t
        end
    end
    return nil
end

function task.killTask(name)
    for i, t in ipairs(_G.taskList) do
        if t.name == name then
            table.remove(_G.taskList, i)
            return true
        end
    end
    return false
end

function task.updateTaskStatus(name, status)
    local t = task.getTaskByName(name)
    if t then
        t.status = status
        return true
    end
    return false
end

function task.isTaskRunning(name)
    local t = task.getTaskByName(name)
    if t then
        return t.status == "running"
    end
    return false
end

function task.isTaskStopped(name)
    local t = task.getTaskByName(name)
    if t then
        return t.status == "stopped"
    end
    return false
end

function task.isTaskPaused(name)
    local t = task.getTaskByName(name)
    if t then
        return t.status == "paused"
    end
    return false
end

function task.pauseTask(name)
    local t = task.getTaskByName(name)
    if t and t.status == "running" then
        t.status = "paused"
        return true
    end
    return false
end

function task.resumeTask(name)
    local t = task.getTaskByName(name)
    if t and t.status == "paused" then
        t.status = "running"
        return true
    end
    return false
end

return task