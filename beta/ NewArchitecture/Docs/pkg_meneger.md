# lightOS package manager (pkg) dev documentation

`pkg` installs, removes, and lists software packages for lightOS. Packages are distributed as single `.arc` archives (see the `larc`/archive documentation), fetched over HTTP from a repository.

---

## Commands

| Command | Description |
| :--- | :--- |
| `pkg install <name>` | Finds `<name>.arc` across configured repositories (official repo first), shows its metadata, and installs it after confirmation. |
| `pkg uninstall <name>` | Re-resolves the package to find out which files it owns, shows them, and removes them after confirmation. |
| `pkg list` | Lists all packages currently recorded as installed, with their versions. |
| `pkg addrepo <name> <url>` | Registers an additional repository. Saved to `/lightOS/repos.cfg` so it persists across reboots. |
| `pkg repos` | Lists all configured repositories, marking the official one. |

Running `pkg` with no arguments (or an unknown subcommand) prints this usage summary.

---

## How package lookup works

For `pkg install <name>`, `pkg` tries every configured repository **in order, official repository first**:

```
<repo_base>/<name>.arc
```

The first repository where this file exists wins - `pkg` does not search further once a match is found. This means a package name in the official repository always takes priority over the same name in a third-party repository, even if the third-party one was added first.

If no repository has `<name>.arc`, `pkg install` reports `Package not found`.

---

## Package format

A package is a single `.arc` archive (see the archiver documentation for the exact `.arc` file format and the `--raw` / `--sized` compression modes). Inside the archive, the **root folder's contents become the package**:

```
lua-tools:
 package.cfg:
  name=lua-tools
  author=lightOS Team
  ver=0.2
 bin/flash:
  -- flash.lua source...
 bin/deps:
  -- deps.lua source...
```

### `package.cfg`

A plain `key=value` file (same format as `/lightOS/config.cfg`), always at the **root** of the archive. Recognized fields:

| Field | Required | Description |
| :--- | :--- | :--- |
| `name` | No | Package name. Falls back to the name used to look it up if omitted. |
| `author` | No | Shown to the user before install. |
| `ver` | No | Shown to the user before install, and recorded in `pkg list`. |

`package.cfg` itself is **never copied** to the filesystem - it exists purely as metadata for `pkg`. Everything else in the archive is mirrored onto the real filesystem root, preserving its exact relative path:

```
img/myimage.nfp     ->  /img/myimage.nfp
mydir/tst.cfg        ->  /mydir/tst.cfg     (mydir/ is created if missing)
bin/flash            ->  /bin/flash
lib/testlib          ->  /lib/testlib
```

There is no `type` field and no `bin`/`app`/`lib` routing - a package's folder structure **is** its install layout. If you want a file in `/bin`, put it under `bin/` inside the archive; if you want it in `/lib/mylib/`, put it there directly.

> **Note:** package dependencies are not currently supported in this format (the previous Lua-table `_config.lua` format supported a `dependencies` list, but plain `key=value` files cannot cleanly express one). If your package needs another package installed first, say so in its description for now.

---

## Building a package

1. Lay out a folder exactly as you want it mirrored onto the filesystem, with `package.cfg` at its root:

```
mkdir mypackage
mkdir mypackage/bin

echo name=mypackage > mypackage/package.cfg
echo author=Your Name >> mypackage/package.cfg
echo ver=0.1 >> mypackage/package.cfg

cp somefile.lua mypackage/bin/somefile
```

2. Pack it:

```
larc pack mypackage --raw
```

This produces `mypackage.arc` in the current directory, named after the folder - `pkg install` looks for exactly this filename, so the archive's filename (without `.arc`) **must match** the name people will type to install it.

3. Upload `mypackage.arc` to your repository, at the path `<repo_base>/mypackage.arc`.

`--raw` keeps the archive human-readable and easy to hand-edit if you made a mistake - no need to repack from scratch for small fixes. Use `--sized` instead for packages with a lot of repetitive content (e.g. image-heavy packages, games), where RLE compression meaningfully reduces size.

---

## Repositories

The official repository is always built in and cannot be removed or renamed:

```
lightOS-Official = https://raw.githubusercontent.com/redbuttontheare/lightOS/main/packages
```

Add a third-party repository:

```
pkg addrepo myrepo https://raw.githubusercontent.com/someuser/somerepo/main/packages
```

Packages found in any repository other than `lightOS-Official` trigger a warning before install:

```
WARNING: this repository is not verified by lightOS.
Install packages from it at your own risk.
```

This is shown every time, for every package from that repository - `pkg` does not remember that you already trusted a repository once.

---

## Installed package tracking

Every successful `pkg install` records the package's name and version in `/lightOS/installed.cfg`. `pkg list` reads this file to show what's installed:

```
> pkg list
Installed packages:
  core (0.1)
  lua-tools (0.2)
```

This file only tracks **name and version** - it does not store which files belong to a package. `pkg uninstall` works by re-fetching and re-unpacking the package's archive to recompute its file list, then deleting whichever of those files still exist on disk. If the package has since changed upstream (different files in a newer version of the archive), uninstall may not perfectly match what was originally installed.

---

## Caching

`pkg` uses `/lightOS/cache/pkg/` as scratch space for downloaded archives and their temporary extraction - both are cleaned up automatically after each operation. This directory is safe to delete manually if it ever grows unexpectedly (e.g. after an interrupted install).
