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

local textlistbox = {}
textlistbox.__index = textlistbox

function textlistbox.new(x, y, width, height, lines)
    local self = setmetatable({}, textlistbox)
    self.x = x
    self.y = y
    self.width = width
    self.height = height
    self.lines = lines or {}
    self.scrollOffset = 0
    self.autoScroll = false
    return self
end

function textlistbox:setLines(lines)
    self.lines = lines or {}
    self.scrollOffset = 0
end

function textlistbox:addLine(text)
    table.insert(self.lines, text)

    if self.autoScroll then
        local maxOffset = math.max(0, #self.lines - self.height)
        self.scrollOffset = maxOffset
    end
end

function textlistbox:clear()
    self.lines = {}
    self.scrollOffset = 0
end

function textlistbox:draw()
    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.white)

    for row = 0, self.height - 1 do
        local lineIndex = self.scrollOffset + row + 1
        local text = self.lines[lineIndex] or ""

        term.setCursorPos(self.x, self.y + row)

        if #text > self.width then
            text = text:sub(1, self.width)
        end
        local padded = text .. string.rep(" ", self.width - #text)
        term.write(padded)
    end
end

function textlistbox:isClicked(cx, cy)
    return cx >= self.x and cx < self.x + self.width
        and cy >= self.y and cy < self.y + self.height
end

function textlistbox:handleScroll(direction, cx, cy)
    if not self:isClicked(cx, cy) then
        return false
    end

    local maxOffset = math.max(0, #self.lines - self.height)
    self.scrollOffset = self.scrollOffset + direction
    self.scrollOffset = math.max(0, math.min(self.scrollOffset, maxOffset))

    return true
end

return textlistbox