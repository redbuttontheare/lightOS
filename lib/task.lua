local task = {}

local schedulerRunning = false

local function pack(...)
    return { n = select("#", ...), ... }
end

local function unpackValues(values)
    return table.unpack(values, 1, values.n)
end

local function getTasks()
    _G.taskList = _G.taskList or {}
    return _G.taskList
end

local function resumeTask(taskInfo, event)
    if taskInfo.status == "queued" then
        taskInfo.status = "running"
    end

    if taskInfo.status ~= "running" or not taskInfo.coroutine then
        return
    end

    local ok, result
    if event then
        ok, result = coroutine.resume(taskInfo.coroutine, unpackValues(event))
    else
        ok, result = coroutine.resume(taskInfo.coroutine)
    end

    if taskInfo.status == "stopped" then
        return
    end

    if not ok then
        taskInfo.status = "failed"
        taskInfo.error = tostring(result)
        taskInfo.coroutine = nil
    elseif coroutine.status(taskInfo.coroutine) == "dead" then
        taskInfo.status = result == false and "failed" or "stopped"
        taskInfo.coroutine = nil
    else
        taskInfo.filter = result
    end
end

function task.new(name, path, taskType, ...)
    local arguments = pack(...)
    local newTask = {
        name = name,
        path = path,
        type = taskType,
        status = "queued",
        filter = nil,
        started = false
    }

    newTask.coroutine = coroutine.create(function()
        local ok, result = pcall(shell.run, path, unpackValues(arguments))
        if not ok then
            error(result)
        end
        return result
    end)

    table.insert(getTasks(), newTask)
    return newTask
end

function task.run()
    if schedulerRunning then
        return false, "Scheduler is already running"
    end

    schedulerRunning = true

    while true do
        local tasks = getTasks()
        local index = 1
        while index <= #tasks do
            local taskInfo = tasks[index]
            if taskInfo.status == "queued" then
                taskInfo.started = true
                resumeTask(taskInfo)
            end
            index = index + 1
        end

        local hasRunnableTask = false
        for _, taskInfo in ipairs(tasks) do
            if taskInfo.status == "queued" or taskInfo.status == "running" then
                hasRunnableTask = true
                break
            end
        end
        if not hasRunnableTask then
            break
        end

        local event = pack(os.pullEventRaw())
        local eventTasks = { table.unpack(tasks) }
        for _, taskInfo in ipairs(eventTasks) do
            if taskInfo.status == "running"
                and taskInfo.started
                and (taskInfo.filter == nil or taskInfo.filter == event[1] or event[1] == "terminate") then
                resumeTask(taskInfo, event)
            end
        end
    end

    schedulerRunning = false
    return true
end

function task.getTaskList()
    return getTasks()
end

function task.getTaskByName(name)
    for _, taskInfo in ipairs(getTasks()) do
        if taskInfo.name == name then
            return taskInfo
        end
    end
    return nil
end

function task.killTask(name)
    for index, taskInfo in ipairs(getTasks()) do
        if taskInfo.name == name then
            taskInfo.status = "stopped"
            taskInfo.coroutine = nil
            table.remove(_G.taskList, index)
            return true
        end
    end
    return false
end

function task.updateTaskStatus(name, status)
    local taskInfo = task.getTaskByName(name)
    if taskInfo then
        taskInfo.status = status
        return true
    end
    return false
end

function task.isTaskRunning(name)
    local taskInfo = task.getTaskByName(name)
    return taskInfo ~= nil and taskInfo.status == "running"
end

function task.isTaskStopped(name)
    local taskInfo = task.getTaskByName(name)
    return taskInfo ~= nil and taskInfo.status == "stopped"
end

function task.isTaskPaused(name)
    local taskInfo = task.getTaskByName(name)
    return taskInfo ~= nil and taskInfo.status == "paused"
end

function task.pauseTask(name)
    local taskInfo = task.getTaskByName(name)
    if taskInfo and (taskInfo.status == "running" or taskInfo.status == "queued") then
        taskInfo.status = "paused"
        return true
    end
    return false
end

function task.resumeTask(name)
    local taskInfo = task.getTaskByName(name)
    if taskInfo and taskInfo.status == "paused" then
        taskInfo.status = taskInfo.started and "running" or "queued"
        return true
    end
    return false
end

return task