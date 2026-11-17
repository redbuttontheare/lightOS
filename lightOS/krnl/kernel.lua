local task = dofile("/usr/lib/task.lua")
_G.task = task

task.new("kernel", "/usr/.var/kernel/krnl.lua", "System")