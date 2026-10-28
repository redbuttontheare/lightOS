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

local progressbar = {}
progressbar.__index = progressbar

function progressbar.new(x, y, width, max, fillColor, emptyColor)
    local self = setmetatable({}, progressbar)
    self.x = x
    self.y = y
    self.width = width
    self.max = (max and max > 0) and max or 100
    self.value = 0
    self.fillColor = fillColor or colors.green
    self.emptyColor = emptyColor or colors.gray
    self.textColor = colors.white
    self.showPercent = true
    return self
end

function progressbar:setValue(value)
    self.value = math.max(0, math.min(value, self.max))
end

function progressbar:increment(amount)
    self:setValue(self.value + (amount or 1))
end

function progressbar:setMax(max)
    if max and max > 0 then
        self.max = max
        self:setValue(self.value)
    end
end

function progressbar:getValue()
    return self.value
end

function progressbar:getPercent()
    return math.floor(self.value / self.max * 100 + 0.5)
end

function progressbar:draw()
    local filled = math.floor(self.width * self.value / self.max + 0.5)

    local label = ""
    if self.showPercent then
        label = self:getPercent() .. "%"
        if #label > self.width then
            label = ""
        end
    end
    local labelStart = math.floor((self.width - #label) / 2) + 1

    term.setCursorPos(self.x, self.y)
    term.setTextColor(self.textColor)

    for i = 1, self.width do
        if i <= filled then
            term.setBackgroundColor(self.fillColor)
        else
            term.setBackgroundColor(self.emptyColor)
        end

        local ch = " "
        if #label > 0 and i >= labelStart and i < labelStart + #label then
            ch = label:sub(i - labelStart + 1, i - labelStart + 1)
        end
        term.write(ch)
    end

    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.white)
end

return progressbar