local button = {}
button.__index = button

-- button.new(x, y, width, text, bgColor, textColor, on_click_function)
function button.new(x, y, width, text, bgColor, textColor, on_click_function)
    local self = setmetatable({}, button)
    self.x = x
    self.y = y
    self.width = width
    self.text = text
    self.bgColor = bgColor
    self.textColor = textColor
    self.onClick = on_click_function or function() end
    return self
end

function button:draw()
    local label = " " .. self.text .. " "
    local padding = math.floor((self.width - #label) / 2)
    local line = string.rep(" ", padding) .. label ..
                 string.rep(" ", self.width - padding - #label)

    term.setCursorPos(self.x, self.y)
    term.setBackgroundColor(self.bgColor)
    term.setTextColor(self.textColor)
    term.write(line)
    term.setBackgroundColor(colors.black)
end

function button:isClicked(cx, cy)
    return cx >= self.x and cx < self.x + self.width and cy == self.y
end

function button:handleClick(cx, cy)
    if self:isClicked(cx, cy) then
        self.onClick()
        return true
    end
    return false
end

return button