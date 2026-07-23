# Gelaxy window meneger dev documentation

### Tabs
#### You can create tabs with this code:
```lua
local gelaxy = dofile("/lib/gelaxy/window.lua")

gelaxy.createTab("lightshell", "/lightOS/lightshell.lua")
gelaxy.createTab("empty", nil) -- an empty tab does nothing

gelaxy.run()
```

### Buttons
#### You can create buttons with this code:
```lua
local Button = dofile("/lib/gelaxy/button.lua")

local function reboot()
    os.reboot()
end

local closeButton = Button.new(35, 5, 1, "Reboot", colors.red, colors.white, reboot) -- creating button 
-- Button.new(x, y, width, bgcolor, textcolor, on_click_function)

closeButton:draw()

local running = true
while running do
    local evData = { os.pullEvent() }
    local event = evData[1]
    
    if event == "mouse_click" then
        local cx, cy = evData[3], evData[4]
        if closeButton:handleClick(cx, cy) then
            running = false 
        end
    end
end

```

### Checkboxes
#### Coming soon...

### Textboxes
#### Coming soon...