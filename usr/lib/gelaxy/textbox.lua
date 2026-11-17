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

local textbox = {}
textbox.__index = textbox

function textbox.new(x, y, width, initialText, on_change_function)
    local self = setmetatable({}, textbox)
    self.x = x
    self.y = y
    self.width = width
    self.text = initialText or ""
    self.cursorPos = #self.text
    self.focused = false
    self.onChange = on_change_function or function() end
    return self
end

function textbox:draw()
    term.setCursorPos(self.x, self.y)

    local bg = self.focused and colors.gray or colors.black
    local fg = colors.white

    term.setBackgroundColor(bg)
    term.setTextColor(fg)

    local visibleText = self.text
    if #visibleText > self.width then
        visibleText = visibleText:sub(#visibleText - self.width + 1)
    end

    local padded = visibleText .. string.rep(" ", self.width - #visibleText)
    term.write(padded)

    term.setBackgroundColor(colors.black)

    if self.focused then
        local cursorX = self.x + math.min(self.cursorPos, self.width - 1)
        term.setCursorPos(cursorX, self.y)
        term.setCursorBlink(true)
    end
end

function textbox:isClicked(cx, cy)
    return cx >= self.x and cx < self.x + self.width and cy == self.y
end

function textbox:setFocused(state)
    self.focused = state
    if not state then
        term.setCursorBlink(false)
    end
end

function textbox:handleClick(cx, cy)
    if self:isClicked(cx, cy) then
        self:setFocused(true)
        self.cursorPos = #self.text
        return true
    end
    self:setFocused(false)
    return false
end

function textbox:handleChar(char)
    if not self.focused then return end

    local before = self.text:sub(1, self.cursorPos)
    local after = self.text:sub(self.cursorPos + 1)
    self.text = before .. char .. after
    self.cursorPos = self.cursorPos + 1

    self.onChange(self.text)
end

function textbox:handleKey(key)
    if not self.focused then return end

    if key == keys.backspace then
        if self.cursorPos > 0 then
            local before = self.text:sub(1, self.cursorPos - 1)
            local after = self.text:sub(self.cursorPos + 1)
            self.text = before .. after
            self.cursorPos = self.cursorPos - 1
            self.onChange(self.text)
        end
    elseif key == keys.left then
        self.cursorPos = math.max(0, self.cursorPos - 1)
    elseif key == keys.right then
        self.cursorPos = math.min(#self.text, self.cursorPos + 1)
    elseif key == keys.home then
        self.cursorPos = 0
    elseif key == keys["end"] then
        self.cursorPos = #self.text
    end
end

function textbox:getText()
    return self.text
end

function textbox:setText(text)
    self.text = text or ""
    self.cursorPos = #self.text
    self.onChange(self.text)
end

return textbox
