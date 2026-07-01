local component = require("component")
local os = require("os")
local filesystem = require("filesystem")

local gpu = component.gpu

local GITHUB_USER = "redbuttontheare"
local REPO_NAME = "lightOS"
local BRANCH = "main"

local BASE_URL = string.format("https://githubusercontent.com", GITHUB_USER, REPO_NAME, BRANCH)

local function clear()
  if gpu then
    gpu.setBackground(0x000000)
    gpu.setForeground(0xFFFFFF)
  end
  print("\27[2J\27[H")
end

local function downloadFile(repoPath, localPath)
  print("Downloading: " .. repoPath .. " -> " .. localPath)
  local url = BASE_URL .. repoPath
  local command = string.format("wget -f %s %s > /dev/null", url, localPath)
  local success = os.execute(command)
  return success
end

clear()
print("=== LIGHTOS Installation Wizard ===")
print("-----------------------------------")

local directories = {"/lib", "/Apps", "/bin"}
for _, dir in ipairs(directories) do
  if not filesystem.exists(dir) then
    filesystem.makeDirectory(dir)
  end
end

print("\n[1/4] Downloading OS core components...")
if not downloadFile("boot.lua", "/boot.lua") then
  print("Error: Failed to download boot.lua")
  os.exit()
end

print("\n[2/4] Downloading system libraries...")
if not downloadFile("lib/graphics.lua", "/lib/graphics.lua") then
  print("Error: Failed to download lib/graphics.lua")
  os.exit()
end

print("\n[3/4] Downloading default user applications...")
if not downloadFile("Apps/sample.lua", "/Apps/sample.lua") then
  print("Error: Failed to download Apps/sample.lua")
  os.exit()
end

print("\n[4/4] Flashing EEPROM firmware...")
local biosTmpPath = "/tmp/bios.lua"
if downloadFile("Install/temp/bios.lua", biosTmpPath) then
  local flashCommand = string.format("flash -q -n 'LightOS BIOS' %s > /dev/null 2>&1", biosTmpPath)
  if os.execute(flashCommand) then
    print("EEPROM successfully flashed!")
  else
    print("Warning: Flashing failed!")
  end
else
  print("Warning: Could not download BIOS file!")
end

print("\n-----------------------------------")
print("Installation completed successfully!")
print("Press Enter to reboot into LightOS...")

io.read()
if component.computer then
  component.computer.shutdown(true)
end
