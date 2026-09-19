LARC-RAW
lua-tools:
 bin/deps:
  
  local args = { ... }
  local sourceFile = args[1]
  
  if not sourceFile then
      printError("Usage: deps <file.lua>")
      return
  end
  
  local path = shell.resolve(sourceFile)
  
  if not fs.exists(path) then
      printError("File not found: " .. path)
      return
  end
  
  if fs.isDir(path) then
      printError("Cannot scan a directory: " .. path)
      return
  end
  
  local f = fs.open(path, "r")
  if not f then
      printError("Could not open file: " .. path)
      return
  end
  
  local content = f.readAll()
  f.close()
  
  local trackedFuncs = { "dofile", "require", "loadfile" }
  
  local found = {}
  local seen = {}
  
  for lineNum, line in ipairs((function()
      local lines = {}
      for l in (content .. "\n"):gmatch("(.-)\n") do
          table.insert(lines, l)
      end
      return lines
  end)()) do
      local codePart = line
      local commentPos = line:find("%-%-")
      if commentPos then
          codePart = line:sub(1, commentPos - 1)
      end
  
      for _, funcName in ipairs(trackedFuncs) do
          for quote in codePart:gmatch(funcName .. '%s*%(%s*["\']([^"\']+)["\']')) do
              local key = funcName .. ":" .. quote
              if not seen[key] then
                  seen[key] = true
                  table.insert(found, { func = funcName, value = quote, line = lineNum })
              end
          end
      end
  end
  
  if #found == 0 then
      print("No dependencies found in " .. sourceFile)
      return
  end
  
  print("Dependencies found in " .. sourceFile .. ":")
  print("")
  
  for _, dep in ipairs(found) do
      term.setTextColor(colors.lightGray)
      write("  line " .. dep.line .. ": ")
      term.setTextColor(colors.yellow)
      write(dep.func)
      term.setTextColor(colors.white)
      print("(\"" .. dep.value .. "\")")
  end
  
  term.setTextColor(colors.white)
  print("")
  print("Total: " .. #found .. " dependency(ies)")
  
 bin/flash:
  local args = { ... }
  local sourceFile = args[1]
  
  if not sourceFile then
      printError("Usage: flash <file.lua>")
      return
  end
  
  local path = shell.resolve(sourceFile)
  
  if not fs.exists(path) then
      printError("File not found: " .. path)
      return
  end
  
  if fs.isDir(path) then
      printError("Cannot flash a directory: " .. path)
      return
  end
  
  term.setTextColor(colors.orange)
  print("This will overwrite /startup.lua with:")
  print("  " .. path)
  term.setTextColor(colors.white)
  write("Continue? (y/n): ")
  local answer = read()
  
  if answer ~= "y" and answer ~= "Y" then
      print("Flash cancelled.")
      return
  end
  
  local src = fs.open(path, "r")
  local content = src.readAll()
  src.close()
  
  local dst = fs.open("/startup.lua", "w")
  dst.write(content)
  dst.close()
  
  term.setTextColor(colors.green)
  print("Flashed: " .. path .. " -> /startup.lua")
  term.setTextColor(colors.white)
  
 bin/replace:
  
  local args = { ... }
  local file1 = args[1]
  local file2 = args[2]
  
  if not file1 or not file2 then
      printError("Usage: replace <file1> <file2>")
      return
  end
  
  local path1 = shell.resolve(file1)
  local path2 = shell.resolve(file2)
  
  if not fs.exists(path1) then
      printError("File not found: " .. path1)
      return
  end
  
  if not fs.exists(path2) then
      printError("File not found: " .. path2)
      return
  end
  
  if fs.isDir(path1) then
      printError("Cannot replace a directory: " .. path1)
      return
  end
  
  if fs.isDir(path2) then
      printError("Cannot replace a directory: " .. path2)
      return
  end
  
  term.setTextColor(colors.orange)
  print("This will swap the contents of:")
  print("  " .. path1)
  print("  " .. path2)
  term.setTextColor(colors.white)
  write("Continue? (y/n): ")
  local answer = read()
  
  if answer ~= "y" and answer ~= "Y" then
      print("Replace cancelled.")
      return
  end
  
  local f1 = fs.open(path1, "r")
  if not f1 then
      printError("Could not open for reading: " .. path1)
      return
  end
  local content1 = f1.readAll()
  f1.close()
  
  local f2 = fs.open(path2, "r")
  if not f2 then
      printError("Could not open for reading: " .. path2)
      return
  end
  local content2 = f2.readAll()
  f2.close()
  
  local chunk1, err1 = load(content2)
  if not chunk1 then
      printError("Warning: content from " .. path2 .. " has a syntax error:")
      printError(tostring(err1))
      write("Write anyway? (y/n): ")
      local forceAnswer = read()
      if forceAnswer ~= "y" and forceAnswer ~= "Y" then
          print("Replace cancelled.")
          return
      end
  end
  
  local chunk2, err2 = load(content1)
  if not chunk2 then
      printError("Warning: content from " .. path1 .. " has a syntax error:")
      printError(tostring(err2))
      write("Write anyway? (y/n): ")
      local forceAnswer = read()
      if forceAnswer ~= "y" and forceAnswer ~= "Y" then
          print("Replace cancelled.")
          return
      end
  end
  
  local w1 = fs.open(path1, "w")
  if not w1 then
      printError("Could not open for writing: " .. path1)
      return
  end
  w1.write(content2)
  w1.close()
  
  local w2 = fs.open(path2, "w")
  if not w2 then
      printError("Could not open for writing: " .. path2)
      return
  end
  w2.write(content1)
  w2.close()
  
  term.setTextColor(colors.green)
  print("Swapped: " .. path1 .. " <-> " .. path2)
  term.setTextColor(colors.white)
  
 package.cfg:
  name=lua-tools
  author=lightOS Team
  ver=0.3
  