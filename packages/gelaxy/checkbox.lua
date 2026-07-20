-- Copyright (C) 2026 redbuttontheare@gmail.com
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
-- GNU General Public License for more details.

local checkbox = {}
checkbox.__index = checkbox

-- checkbox.new(x, y, label, checked, on_toggle_function)
-- on_toggle_function(newState) викликається при кожній зміні стану
function checkbox.new(x, y, label, checked, on_toggle_function)
    local self = setmetatable({}, checkbox)
    self.x = x
    self.y = y
    self.label = label
    self.checked = checked or false
    self.onToggle = on_toggle_function or function() end
    return self
end

-- ширина поля [x] або [ ] завжди 3 символи, потім пробіл і текст мітки
function checkbox:draw()
    term.setCursorPos(self.x, self.y)

    local box = self.checked and "[x]" or "[ ]"
    term.write(box .. " " .. self.label)
end

function checkbox:width()
    return 4 + #self.label
end

function checkbox:isClicked(cx, cy)
    return cx >= self.x and cx < self.x + self:width() and cy == self.y
end

function checkbox:setChecked(state)
    self.checked = state
    self.onToggle(self.checked)
end

function checkbox:toggle()
    self:setChecked(not self.checked)
end

function checkbox:handleClick(cx, cy)
    if self:isClicked(cx, cy) then
        self:toggle()
        return true
    end
    return false
end

return checkbox
