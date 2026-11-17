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

local listbox = {}
listbox.__index = listbox

function listbox.new(x, y, width, height, items, on_select_function)
    local self = setmetatable({}, listbox)
    self.x = x
    self.y = y
    self.width = width
    self.height = height
    self.items = items or {}
    self.selectedIndex = nil
    self.scrollOffset = 0
    self.onSelect = on_select_function or function() end
    return self
end

function listbox:setItems(items)
    self.items = items or {}
    self.selectedIndex = nil
    self.scrollOffset = 0
end

function listbox:getSelected()
    if not self.selectedIndex then return nil, nil end
    return self.items[self.selectedIndex], self.selectedIndex
end

function listbox:draw()
    for row = 0, self.height - 1 do
        local itemIndex = self.scrollOffset + row + 1
        local item = self.items[itemIndex]

        term.setCursorPos(self.x, self.y + row)

        if item then
            local isSelected = (itemIndex == self.selectedIndex)

            if isSelected then
                term.setBackgroundColor(colors.white)
                term.setTextColor(colors.black)
            else
                term.setBackgroundColor(colors.black)
                term.setTextColor(colors.white)
            end

            local text = item
            if #text > self.width then
                text = text:sub(1, self.width)
            end
            local padded = text .. string.rep(" ", self.width - #text)
            term.write(padded)
        else
            term.setBackgroundColor(colors.black)
            term.setTextColor(colors.white)
            term.write(string.rep(" ", self.width))
        end
    end

    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.white)
end

function listbox:isClicked(cx, cy)
    return cx >= self.x and cx < self.x + self.width
        and cy >= self.y and cy < self.y + self.height
end

function listbox:handleClick(cx, cy)
    if not self:isClicked(cx, cy) then
        return false
    end

    local row = cy - self.y
    local itemIndex = self.scrollOffset + row + 1
    local item = self.items[itemIndex]

    if item then
        self.selectedIndex = itemIndex
        self.onSelect(item, itemIndex)
    end

    return true
end

function listbox:handleScroll(direction, cx, cy)
    if not self:isClicked(cx, cy) then
        return false
    end

    local maxOffset = math.max(0, #self.items - self.height)
    self.scrollOffset = self.scrollOffset + direction
    self.scrollOffset = math.max(0, math.min(self.scrollOffset, maxOffset))

    return true
end

return listbox