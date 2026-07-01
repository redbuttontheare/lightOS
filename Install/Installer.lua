local component = require("component")
local os = require("os")
local filesystem = require("filesystem")

local gpu = component.gpu

-- Конфігурація репозиторію (Заміни на свій нікнейм у GitHub)
local GITHUB_USER = "redbuttontheare"
local REPO_NAME = "lightOS"
local BRANCH = "main"

local BASE_URL = string.format("https://githubusercontent.com", GITHUB_USER, REPO_NAME, BRANCH)

local function clear()
  if gpu then
    gpu.setBackground(0x000000)
    gpu.setForeground(0xFFFFFF)
  end
  print("\27[2J\27[H") -- Очищення екрана консолі
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

-- 1. Створення необхідної структури папок на жорсткому диску OpenOS
if not filesystem.exists("/boot") then
  filesystem.makeDirectory("/boot")
end

-- 2. Завантаження головного файлу ОС (boot.lua)
print("\n[1/3] Downloading OS components...")
local osSuccess = downloadFile("boot.lua", "/boot.lua")

if not osSuccess then
  print("\nError: Failed to download boot.lua from GitHub!")
  os.exit()
end

-- 3. Завантаження файлу BIOS у тимчасову папку для прошивки
print("\n[2/3] Downloading BIOS firmware...")
local biosTmpPath = "/tmp/bios.lua"
local biosSuccess = downloadFile("Install/temp/bios.lua", biosTmpPath)

if not biosSuccess then
  print("\nError: Failed to download bios.lua from GitHub!")
  os.exit()
end

-- 4. Тиха прошивка EEPROM за допомогою системної утиліти flash
print("\n[3/3] Flashing EEPROM...")
if filesystem.exists(biosTmpPath) then
  -- -q (тихо), -n (назва чипа)
  local flashCommand = string.format("flash -q -n 'Lightbios' %s > /dev/null 2>&1", biosTmpPath)
  local flashSuccess = os.execute(flashCommand)
  
  if flashSuccess then
    print("EEPROM flashed successfully")
  else
    print("Warning: EEPROM flashing failed! Check if EEPROM is inserted.")
  end
end

-- 5. Завершення інсталяції
print("\n-----------------------------------")
print("Installation completed successfully!")
print("Please remove any OpenOS floppies.")
print("Press Enter to reboot into LightOS...")

io.read()
if component.computer then
  component.computer.shutdown(true) -- Перезавантаження ПК
end