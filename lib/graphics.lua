local gpu = component.list("gpu")()
local screen = component.list("screen")()

local cursorX, cursorY = 3, 2
local maxW, maxH = 50, 16

if gpu and screen then
    component.invoke(gpu, "bind", screen)
    maxW, maxH = component.invoke(gpu, "getResolution")
end

_G.print = function(text)
    if not gpu then return end
    
    text = tostring(text)
    
    if cursorY > maxH - 1 then
        component.invoke(gpu, "copy", 1, 2, maxW, maxH, 0, -1)
        component.invoke(gpu, "fill", 1, maxH, maxW, 1, " ")
        cursorY = maxH - 1
    end
    
    component.invoke(gpu, "set", cursorX, cursorY, text)
    cursorY = cursorY + 1
end
