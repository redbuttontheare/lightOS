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

local dialog = {}
dialog.__index = dialog

local function wrapText(text, maxWidth)
    local lines = {}

    for paragraph in (tostring(text) .. "\n"):gmatch("(.-)\n") do
        local before = #lines
        local current = ""

        for word in paragraph:gmatch("%S+") do
            local rest = word
            while #rest > maxWidth do
                if current ~= "" then
                    table.insert(lines, current)
                    current = ""
                end
                table.insert(lines, rest:sub(1, maxWidth))
                rest = rest:sub(maxWidth + 1)
            end

            if current == "" then
                current = rest
            elseif #current + 1 + #rest <= maxWidth then
                current = current .. " " .. rest
            else
                table.insert(lines, current)
                current = rest
            end
        end

        if current ~= "" then
            table.insert(lines, current)
        end

        if #lines == before then
            table.insert(lines, "")
        end
    end

    return lines
end

function dialog.new(title, message, labels)
    local self = setmetatable({}, dialog)
    self.title = tostring(title or "")
    self.message = tostring(message or "")
    self.labels = (labels and #labels > 0) and labels or { "OK" }
    self.defaultIndex = 1
    self.bgColor = colors.lightGray
    self.textColor = colors.black
    self.titleColor = colors.blue
    self.titleTextColor = colors.white
    self.buttonColor = colors.gray
    self.buttonTextColor = colors.white
    self.focusColor = colors.blue
    return self
end

function dialog:layout()
    local termW, termH = term.getSize()

    local buttonsWidth = 0
    for i, label in ipairs(self.labels) do
        buttonsWidth = buttonsWidth + #label + 2
        if i > 1 then
            buttonsWidth = buttonsWidth + 2
        end
    end

    local maxInner = math.max(termW - 6, 1)
    local lines = wrapText(self.message, maxInner)

    local maxLines = math.max(termH - 6, 1)
    if #lines > maxLines then
        local trimmed = {}
        for i = 1, maxLines do
            trimmed[i] = lines[i]
        end
        trimmed[maxLines] = "..."
        lines = trimmed
    end

    local longest = math.max(#self.title + 2, buttonsWidth, 12)
    for _, line in ipairs(lines) do
        longest = math.max(longest, #line)
    end

    local inner = math.min(longest, maxInner)
    local w = inner + 4
    local h = #lines + 5

    local x = math.max(math.floor((termW - w) / 2) + 1, 1)
    local y = math.max(math.floor((termH - h) / 2) + 1, 1)

    local buttonRow = y + 3 + #lines
    local buttons = {}
    local bx = x + math.floor((w - buttonsWidth) / 2)
    for i, label in ipairs(self.labels) do
        local bw = #label + 2
        buttons[i] = { x1 = bx, x2 = bx + bw - 1, label = label }
        bx = bx + bw + 2
    end

    return {
        termW = termW, termH = termH,
        x = x, y = y, w = w, h = h,
        lines = lines, buttons = buttons, buttonRow = buttonRow,
    }
end

function dialog:draw(L, focus)
    term.setBackgroundColor(colors.gray)
    if L.x + L.w <= L.termW then
        for row = L.y + 1, math.min(L.y + L.h, L.termH) do
            term.setCursorPos(L.x + L.w, row)
            term.write(" ")
        end
    end
    if L.y + L.h <= L.termH then
        term.setCursorPos(L.x + 1, L.y + L.h)
        term.write(string.rep(" ", math.min(L.w, L.termW - L.x)))
    end

    for row = 0, L.h - 1 do
        term.setCursorPos(L.x, L.y + row)
        term.setBackgroundColor(row == 0 and self.titleColor or self.bgColor)
        term.write(string.rep(" ", L.w))
    end

    term.setCursorPos(L.x + 1, L.y)
    term.setBackgroundColor(self.titleColor)
    term.setTextColor(self.titleTextColor)
    term.write(self.title:sub(1, L.w - 2))

    term.setBackgroundColor(self.bgColor)
    term.setTextColor(self.textColor)
    for i, line in ipairs(L.lines) do
        term.setCursorPos(L.x + 2, L.y + 1 + i)
        term.write(line)
    end

    term.setTextColor(self.buttonTextColor)
    for i, b in ipairs(L.buttons) do
        term.setCursorPos(b.x1, L.buttonRow)
        term.setBackgroundColor(i == focus and self.focusColor or self.buttonColor)
        term.write(" " .. b.label .. " ")
    end

    term.setBackgroundColor(colors.black)
    term.setTextColor(colors.white)
end

function dialog:show()
    local L = self:layout()
    local count = #self.labels
    local focus = math.max(1, math.min(self.defaultIndex, count))

    self:draw(L, focus)

    while true do
        local ev = { os.pullEvent() }
        local name = ev[1]

        if name == "mouse_click" then
            local cx, cy = ev[3], ev[4]
            if cy == L.buttonRow then
                for i, b in ipairs(L.buttons) do
                    if cx >= b.x1 and cx <= b.x2 then
                        return i, b.label
                    end
                end
            end

        elseif name == "key" then
            local key = ev[2]
            if key == keys.enter then
                return focus, self.labels[focus]
            elseif key == keys.left then
                focus = (focus - 2) % count + 1
                self:draw(L, focus)
            elseif key == keys.right or key == keys.tab then
                focus = focus % count + 1
                self:draw(L, focus)
            end
        end
    end
end

function dialog.alert(title, message)
    dialog.new(title, message, { "OK" }):show()
    return true
end

function dialog.confirm(title, message, defaultYes)
    local d = dialog.new(title, message, { "Yes", "No" })
    d.defaultIndex = defaultYes and 1 or 2
    local index = d:show()
    return index == 1
end

return dialog