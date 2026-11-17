# lightshell
## This documentation can help you

### The shell support `#!`
#### let's write simple interpreter:
#### `interpreter.lua`:
```lua
local args = { ... }
local filearg = args[1] -- we file argument


-- main
if filearg then
    print("It works!")
end
```
#### and `test_file.lua`
```lua
#!/home/your_user/interpreter.lua
```
### in shell run `test_file.lua`