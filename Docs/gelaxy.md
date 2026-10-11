# Gelaxy window meneger dev documentation

### Dynamic Tabs (Since v13.2)

If Gelaxy is already running, programs **must not** use `wm.run()`. Instead, use the global object `_G.gelaxy` to create tabs on the same level.

```lua
-- How to open a new tab from inside another program (e.g. from lightshell)
if _G.gelaxy then
    -- This opens a tab on the same level without nested recursion
    _G.gelaxy.createTab("taskmgr", "/bin/taskmgr.lua")
else
    -- Fallback if running in raw console mode
    shell.run("/bin/taskmgr.lua")
end
```

### Closing Tabs

Programs can close themselves or other tabs by their exact unique name:

```lua
if _G.gelaxy then
    _G.gelaxy.closeTab("about") -- Closes the "about" tab and switches focus
end
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
## gelaxy GUI Component: Checkbox

The `checkbox` component provides interactive toggle elements for user preferences or boolean settings inside applications (e.g., enabling/disabling notifications, terms of service agreements, or system options).

### Constructor

```lua
local myCheckbox = gelaxy.checkbox.new(x, y, label, checked, on_toggle_function)
```

*   **`x`** *(number)*: The X coordinate of the component.
*   **`y`** *(number)*: The Y coordinate of the component.
*   **`label`** *(string)*: The text label displayed next to the checkbox box.
*   **`checked`** *(boolean, optional)*: The initial state of the checkbox. Defaults to `false`.
*   **`on_toggle_function`** *(function, optional)*: Callback function executed automatically on every state toggle. Accepts one argument: the updated boolean state (`true` or `false`).

---

### Methods

| Method | Description | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| `:draw()` | Renders the checkbox state as `[x]` or `[ ]` followed by its text label. | none | none |
| `:width()` | Calculates the total width of the element (4 characters for `[x] ` plus label length). | none | `number` (total width) |
| `:isClicked(cx, cy)` | Evaluates if the mouse coordinates hit the boundary of the box or its label. | `cx` (click X), `cy` (click Y) | `boolean` (true if clicked within bounds) |
| `:setChecked(state)` | Forces the state to `true` or `false` and triggers the `onToggle` callback. | `state` (boolean) | none |
| `:toggle()` | Reverses the current state and triggers the `onToggle` callback. | none | none |
| `:handleClick(cx, cy)` | Evaluates mouse clicks. Automatically toggles the state if clicked inside the boundaries. | `cx` (click X), `cy` (click Y) | `boolean` (true if state was toggled) |

---

### Usage Example

The following script demonstrates a basic implementation within a `lightWeb` page application loop:

```lua
local checkbox = dofile("/lib/gelaxy/checkbox.lua") 

local soundEnabled = false

-- Create a checkbox at position (5, 5) with a default false state
local soundToggle = checkbox.new(5, 5, "Enable sound effects", soundEnabled, function(newState)
    soundEnabled = newState
end)

local function redraw()
    term.clear()
    
    -- Render the component
    soundToggle:draw()
    
    -- Display the value underneath
    term.setCursorPos(5, 7)
    term.write("Current configuration status: " .. tostring(soundEnabled))
end

redraw()

-- Main event loop
while true do
    local event, p1, p2, p3 = os.pullEvent()
    
    if event == "mouse_click" then
        -- Pass coordinates to the component
        soundToggle:handleClick(p2, p3)
        redraw()
        
    elseif event == "key" then
        -- Exit handler: press 'Q' to quit
        if p1 == keys.q then
            break
        end
    end
end
```


### Textboxes
## gelaxy GUI Component: Textbox

The `textbox` component provides interactive input fields for user data entry, suitable for login screens, bank transfers, search queries, or form submissions.

### Constructor

```lua
local myTextbox = gelaxy.textbox.new(x, y, width, initialText, on_change_function)
```

*   **`x`** *(number)*: The X coordinate of the upper-left corner.
*   **`y`** *(number)*: The Y coordinate of the upper-left corner.
*   **`width`** *(number)*: The horizontal width of the input field in characters.
*   **`initialText`** *(string, optional)*: Initial text displayed inside the field. Defaults to `""`.
*   **`on_change_function`** *(function, optional)*: Callback function executed automatically on every text change. Accepts one argument: the updated string.

---

### Methods

| Method | Description | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| `:draw()` | Renders the text box. Enables terminal cursor blinking if the element is currently focused. | none | none |
| `:handleClick(cx, cy)` | Evaluates mouse clicks. Activates focus if clicked inside the box boundaries; otherwise clears focus. | `cx` (click X), `cy` (click Y) | `boolean` (true if clicked inside boundaries) |
| `:handleChar(char)` | Inserts the typed character at the current cursor position (invoke inside the `char` event loop). | `char` (string character) | none |
| `:handleKey(key)` | Processes control keys (`Backspace`, `Left`, `Right`, `Home`, `End`). | `key` (numerical key code) | none |
| `:getText()` | Retrieves the current text string from the input field. | none | `string` |
| `:setText(text)` | Replaces the current content with a new string and triggers the `onChange` callback. | `text` (string) | none |

---

### Usage Example

The following script demonstrates a basic implementation within a `lightWeb` page application loop:

```lua
local textbox = dofile("/lib/gelaxy/textbox.lua") 

local currentText = ""

-- Create a textbox at position (5, 5) with a width of 15 characters
local input = textbox.new(5, 5, 15, "Type here...", function(newText)
    currentText = newText
end)

local function redraw()
    term.clear()
    
    term.setCursorPos(5, 4)
    term.write("Enter your name:")
    
    -- Render the component
    input:draw()
    
    -- Display the value underneath
    term.setCursorPos(5, 7)
    term.write("Live preview: " .. currentText)
end

redraw()

-- Main event loop
while true do
    local event, p1, p2, p3 = os.pullEvent()
    
    if event == "mouse_click" then
        -- Pass coordinates to the component
        input:handleClick(p2, p3)
        redraw()
        
    elseif event == "char" then
        -- Forward alphanumeric character input
        input:handleChar(p1)
        redraw()
        
    elseif event == "key" then
        -- Forward control keys
        input:handleKey(p1)
        
        -- Exit handler: press 'Q' when the input field is not focused
        if p1 == keys.q and not input.focused then
            break
        end
        redraw()
    end
end
```
### Listboxes
## gelaxy GUI Component: Listbox

The `listbox` component provides a scrollable, selectable list of items, suitable for package pickers, file browsers, settings menus, or any situation where the user needs to choose one option from several.

### Constructor

```lua
local myListbox = gelaxy.listbox.new(x, y, width, height, items, on_select_function)
```

*   **`x`** *(number)*: The X coordinate of the upper-left corner.
*   **`y`** *(number)*: The Y coordinate of the upper-left corner.
*   **`width`** *(number)*: The horizontal width of the list in characters. Items longer than this are truncated.
*   **`height`** *(number)*: The number of visible rows. If there are more items than `height`, the list scrolls.
*   **`items`** *(table, optional)*: An array of strings to display. Defaults to `{}`.
*   **`on_select_function`** *(function, optional)*: Callback function executed when an item is clicked. Accepts two arguments: the selected item text and its index.

---

### Methods

| Method | Description | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| `:draw()` | Renders the visible slice of items, highlighting the currently selected one (inverted colors). | none | none |
| `:isClicked(cx, cy)` | Evaluates if the mouse coordinates hit the boundary of the list box. | `cx` (click X), `cy` (click Y) | `boolean` (true if clicked within bounds) |
| `:handleClick(cx, cy)` | Evaluates mouse clicks. Selects the item under the cursor and triggers `onSelect` if one exists at that row. | `cx` (click X), `cy` (click Y) | `boolean` (true if the click landed inside the box) |
| `:handleScroll(direction, cx, cy)` | Scrolls the visible window up or down. Call this from a `mouse_scroll` event handler. | `direction` (`-1` up / `1` down), `cx`, `cy` | `boolean` (true if the scroll landed inside the box) |
| `:setItems(items)` | Replaces the item list entirely and resets selection/scroll. | `items` (table of strings) | none |
| `:getSelected()` | Retrieves the currently selected item and its index. | none | `string, number` (or `nil, nil` if nothing selected) |

---

### Usage Example

The following script demonstrates a package picker built with `listbox`:

```lua
local listbox = dofile("/lib/gelaxy/listbox.lua")

local packages = { "core", "lua-tools", "gelaxy", "networking" }
local chosen = nil

local picker = listbox.new(2, 3, 20, 6, packages, function(item, index)
    chosen = item
end)

local function redraw()
    term.clear()
    term.setCursorPos(2, 1)
    write("Choose a package:")

    picker:draw()

    term.setCursorPos(2, 10)
    write("Selected: " .. tostring(chosen))
end

redraw()

while true do
    local event, p1, p2, p3 = os.pullEvent()

    if event == "mouse_click" then
        picker:handleClick(p2, p3)
        redraw()
    elseif event == "mouse_scroll" then
        picker:handleScroll(p1, p2, p3)
        redraw()
    elseif event == "key" then
        if p1 == keys.q then
            break
        end
    end
end
```

### Textlistboxes
## gelaxy GUI Component: Textlistbox

The `textlistbox` component is a scrollable text block **without selection** - suitable for logs, console-style output, long readable text (such as a license notice), or any content the user only needs to read and scroll through, not pick from.

### Constructor

```lua
local myTextlistbox = gelaxy.textlistbox.new(x, y, width, height, lines)
```

*   **`x`** *(number)*: The X coordinate of the upper-left corner.
*   **`y`** *(number)*: The Y coordinate of the upper-left corner.
*   **`width`** *(number)*: The horizontal width in characters. Lines longer than this are truncated.
*   **`height`** *(number)*: The number of visible rows. If there are more lines than `height`, the block scrolls.
*   **`lines`** *(table, optional)*: An array of strings to display. Defaults to `{}`. Can also be built up afterward with `:addLine()`.

---

### Methods

| Method | Description | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| `:draw()` | Renders the visible slice of lines. No highlighting, no selection - plain scrollable text. | none | none |
| `:isClicked(cx, cy)` | Evaluates if the mouse coordinates hit the boundary of the box. | `cx` (click X), `cy` (click Y) | `boolean` (true if clicked within bounds) |
| `:handleScroll(direction, cx, cy)` | Scrolls the visible window up or down. Call this from a `mouse_scroll` event handler. | `direction` (`-1` up / `1` down), `cx`, `cy` | `boolean` (true if the scroll landed inside the box) |
| `:setLines(lines)` | Replaces all lines entirely and resets scroll. | `lines` (table of strings) | none |
| `:addLine(text)` | Appends one line to the end. If `autoScroll` is `true` (the default), the view jumps to the bottom automatically - ideal for growing logs. | `text` (string) | none |
| `:clear()` | Removes all lines and resets scroll. | none | none |

---

### Properties

| Property | Description |
| :--- | :--- |
| `autoScroll` | `boolean`, defaults to `true`. When `true`, `:addLine()` keeps the view pinned to the newest line, like a live console. Set to `false` to let the user scroll back through history without being pulled back down on every new line. |

---

### Usage Example

The following script demonstrates a live install log built with `textlistbox`:

```lua
local textlistbox = dofile("/lib/gelaxy/textlistbox.lua")

local log = textlistbox.new(2, 3, 36, 10, {})

term.clear()
term.setCursorPos(2, 1)
write("Installing...")

log:addLine("Searching for 'core'...")
log:draw()

log:addLine("Found in repo: lightOS-Official")
log:draw()

log:addLine("Installing core/anet.lua -> /lib/core/anet.lua... OK")
log:draw()
```
