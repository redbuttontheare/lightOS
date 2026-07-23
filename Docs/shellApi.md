# shellApi Documentation
## shellApi - this simple analog(shell.option) but for lightshell

### shellApi path variable
#### you can set path to run programs from it path
```lua
shellApi.setPath(".:/apps/myapp") -- analog of shell.setPath()
```

### shellAPi change directory for user
#### you can change directory for user
```lua
shellApi.setDir("/home") -- analog of shell.setDir()
```

### shellApi run lua files
#### you can run lua files
```lua
shellApi.run("/apps/myapp/main.lua") -- analog of shell.run()
```