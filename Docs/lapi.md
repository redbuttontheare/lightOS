## lightOS API Reference: lapi

The `lapi` library provides core system utilities for `lightOS`. Currently, it handles system configuration file parsing, allowing applications and services to load key-value settings from external configuration files.

### Configuration File Format

The parser expects standard configuration text files where settings are written as `key=value` pairs. 
* Empty lines are ignored.
* Lines starting with `#` are treated as comments and ignored.
* Leading and trailing spaces around keys and values are automatically stripped.

Example file (`settings.cfg`):
```text
# Server Configuration
port=2525
domain=mycoolsite.cool
enable_logs=true
```

---

### Functions

#### `lapi.loadConfig(path)`

Parses a configuration file and loads its contents into a Lua table.

* **`path`** *(string)*: The full path to the configuration file on the file system.
* **Returns**: `table` - A key-value table containing the parsed settings. If the file does not exist, it prints an error message and returns an empty table `{}`.

---

### Usage Example

The following script demonstrates how to load server configurations using `lapi`:

```lua
local lapi = require("lapi")

-- Load the configuration file
local configPath = "settings.cfg"
local config = lapi.loadConfig(configPath)

-- Access the loaded parameters
local port = config["port"] or "80"
local domain = config["domain"] or "localhost"

print("Server configured on domain: " .. domain)
print("Listening on port: " .. port)
```
