LARC-RAW
bincloud:
 bin/bincloudclient:
  local modem = peripheral.find("modem")
  if not modem then
      error("No wireless modem found!")
  end
  rednet.open(peripheral.getName(modem))
  
  write("Code of paste: ")
  local code = read()
  
  write("Download path: ")
  local path = read()
  
  print("Sending request...")
  rednet.broadcast(code .. "-get")
  
  print("Waiting for file...")
  local senderID, message = rednet.receive(5)
  
  if message then
      local file = fs.open(path, "w")
      if file then
          file.write(message)
          file.close()
          print("File successfully downloaded to: " .. path)
      else
          print("Error: Could not create file at: " .. path)
      end
  else
      print("Error: Timeout reached or code not found.")
  end
  
 bin/bincloudhost:
  local modem = peripheral.find("modem")
  if not modem then
      error("No wireless modem found!")
  end
  rednet.open(peripheral.getName(modem))
  
  write("Code of paste: ")
  local myCode = read()
  
  write("File path to host: ")
  local pasteFile = read()
  
  if not fs.exists(pasteFile) then
      error("File does not exist: " .. pasteFile)
  end
  
  print("\nHost started. Waiting for requests for code [" .. myCode .. "]...")
  
  local function sendFile(targetID)
      local file = fs.open(pasteFile, "r")
      if file then
          local content = file.readAll()
          file.close()
          rednet.send(targetID, content)
          print("File successfully sent to #" .. targetID)
      else
          print("Error reading file: " .. pasteFile)
      end
  end
  
  local tasks = {}
  
  local function listenRequests()
      while true do
          local senderID, message = rednet.receive()
          
          if type(message) == "string" and message:sub(-4) == "-get" then
              local requestedCode = message:sub(1, -5)
              
              if requestedCode == myCode then
                  print("Request received from #" .. senderID .. ". Starting transfer...")
                  table.insert(tasks, function() sendFile(senderID) end)
                  os.queueEvent("new_task")
              end
          end
      end
  end
  
  local function worker()
      while true do
          if #tasks > 0 then
              local currentTasks = tasks
              tasks = {}
              parallel.waitForAll(unpack(currentTasks))
          else
              os.pullEvent("new_task")
          end
      end
  end
  
  parallel.waitForAll(listenRequests, worker)
  
 package.cfg:
  name=bincloud
  author=lightOS Team
  ver=0.1
  