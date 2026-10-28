"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.locateConfigFile = locateConfigFile;
exports.parseConfigFileWithSystem = parseConfigFileWithSystem;
exports.createConfigFileUpdater = createConfigFileUpdater;
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const utils_1 = require("../utils");
const cliDiagnostics = __importStar(require("./diagnostics"));
const parse_1 = require("./parse");
function locateConfigFile(commandLine) {
    const { project } = commandLine.options;
    if (!project) {
        if (commandLine.fileNames.length > 0) {
            return undefined;
        }
        const searchPath = (0, utils_1.normalizeSlashes)(process.cwd());
        return ts.findConfigFile(searchPath, ts.sys.fileExists);
    }
    if (commandLine.fileNames.length !== 0) {
        return cliDiagnostics.optionProjectCannotBeMixedWithSourceFilesOnACommandLine();
    }
    // TODO: Unlike tsc, this resolves `.` to absolute path
    const fileOrDirectory = (0, utils_1.normalizeSlashes)(path.resolve(process.cwd(), project));
    if (ts.sys.directoryExists(fileOrDirectory)) {
        const configFileName = path.posix.join(fileOrDirectory, "tsconfig.json");
        if (ts.sys.fileExists(configFileName)) {
            return configFileName;
        }
        else {
            return cliDiagnostics.cannotFindATsconfigJsonAtTheSpecifiedDirectory(project);
        }
    }
    else if (ts.sys.fileExists(fileOrDirectory)) {
        return fileOrDirectory;
    }
    else {
        return cliDiagnostics.theSpecifiedPathDoesNotExist(project);
    }
}
function parseConfigFileWithSystem(configFileName, commandLineOptions, system = ts.sys) {
    var _a;
    const configRootDir = path.dirname(configFileName);
    const parsedConfigFile = ts.parseJsonSourceFileConfigFileContent(ts.readJsonConfigFile(configFileName, system.readFile), system, configRootDir, commandLineOptions, configFileName);
    const cycleCache = new Set();
    const extendedTstlOptions = getExtendedTstlOptions(configFileName, configRootDir, cycleCache, system);
    parsedConfigFile.raw.tstl = Object.assign(extendedTstlOptions, (_a = parsedConfigFile.raw.tstl) !== null && _a !== void 0 ? _a : {});
    return (0, parse_1.updateParsedConfigFile)(parsedConfigFile);
}
function resolveNpmModuleConfig(moduleName, configRootDir, host) {
    const resolved = ts.nodeNextJsonConfigResolver(moduleName, path.join(configRootDir, "tsconfig.json"), host);
    if (resolved.resolvedModule) {
        return resolved.resolvedModule.resolvedFileName;
    }
}
function getExtendedTstlOptions(configFilePath, configRootDir, cycleCache, system) {
    const absolutePath = ts.pathIsAbsolute(configFilePath)
        ? configFilePath
        : ts.pathIsRelative(configFilePath)
            ? path.resolve(configRootDir, configFilePath)
            : resolveNpmModuleConfig(configFilePath, configRootDir, system); // if a path is neither relative nor absolute, it is probably a npm module
    if (!absolutePath) {
        return {};
    }
    const newConfigRoot = path.dirname(absolutePath);
    if (cycleCache.has(absolutePath)) {
        return {};
    }
    cycleCache.add(absolutePath);
    const fileContent = system.readFile(absolutePath);
    const options = {};
    if (fileContent) {
        const { config: parsedConfig } = ts.parseConfigFileTextToJson(configFilePath, fileContent);
        if (!parsedConfig) {
            return {};
        }
        if (parsedConfig.extends) {
            if (Array.isArray(parsedConfig.extends)) {
                for (const extendedConfigFile of parsedConfig.extends) {
                    Object.assign(options, getExtendedTstlOptions(extendedConfigFile, newConfigRoot, cycleCache, system));
                }
            }
            else {
                Object.assign(options, getExtendedTstlOptions(parsedConfig.extends, newConfigRoot, cycleCache, system));
            }
        }
        if (parsedConfig.tstl) {
            Object.assign(options, parsedConfig.tstl);
        }
    }
    return options;
}
function createConfigFileUpdater(optionsToExtend) {
    const configFileMap = new WeakMap();
    return options => {
        const { configFile, configFilePath } = options;
        if (!configFile || !configFilePath)
            return [];
        if (!configFileMap.has(configFile)) {
            const parsedConfigFile = parseConfigFileWithSystem(configFilePath, optionsToExtend, ts.sys);
            configFileMap.set(configFile, parsedConfigFile);
        }
        const parsedConfigFile = configFileMap.get(configFile);
        Object.assign(options, parsedConfigFile.options);
        return parsedConfigFile.errors;
    };
}
//# sourceMappingURL=tsconfig.js.map