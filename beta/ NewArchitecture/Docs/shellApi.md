# shellApi Documentation
## shellApi - A simple analogue of shell API, tailored for lightshell
#### /lightOS/lightshell.lus rewrites global _G.shell variable

### shellApi path variable
#### you can set path to run programs from it path
```lua
shell.setPath("/home/redbutton") 
```

### shellAPi change directory for user
#### you can change directory for user
```lua
shell.setDir("/")
```

### shellApi run lua files
#### you can run lua files
```lua
shell.run("/apps/mycoolapp/app.lua")
```

## See mini-shell doc in Docs/lightshell.md