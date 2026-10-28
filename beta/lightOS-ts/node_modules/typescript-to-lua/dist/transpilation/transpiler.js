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
exports.Transpiler = void 0;
exports.getEmitPath = getEmitPath;
exports.getEmitPathRelativeToOutDir = getEmitPathRelativeToOutDir;
exports.getSourceDir = getSourceDir;
exports.getEmitOutDir = getEmitOutDir;
exports.getProjectRoot = getProjectRoot;
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const CompilerOptions_1 = require("../CompilerOptions");
const LuaLib_1 = require("../LuaLib");
const utils_1 = require("../utils");
const bundle_1 = require("./bundle");
const diagnostics_1 = require("./diagnostics");
const plugins_1 = require("./plugins");
const resolve_1 = require("./resolve");
const transpile_1 = require("./transpile");
const performance = __importStar(require("../measure-performance"));
class Transpiler {
    constructor({ emitHost = ts.sys } = {}) {
        this.emitHost = emitHost;
    }
    emit(emitOptions) {
        const { program, writeFile = this.emitHost.writeFile, plugins: optionsPlugins = [] } = emitOptions;
        const { diagnostics: getPluginsDiagnostics, plugins: configPlugins } = (0, plugins_1.getPlugins)(program);
        const plugins = [...optionsPlugins, ...configPlugins];
        const { diagnostics: transpileDiagnostics, transpiledFiles: freshFiles } = (0, transpile_1.getProgramTranspileResult)(this.emitHost, writeFile, {
            ...emitOptions,
            plugins,
        });
        const { emitPlan } = this.getEmitPlan(program, transpileDiagnostics, freshFiles, plugins);
        const emitDiagnostics = this.emitFiles(program, plugins, emitPlan, writeFile);
        return {
            diagnostics: getPluginsDiagnostics.concat(transpileDiagnostics, emitDiagnostics),
            emitSkipped: emitPlan.length === 0,
        };
    }
    emitFiles(program, plugins, emitPlan, writeFile) {
        var _a, _b, _c;
        performance.startSection("emit");
        const options = program.getCompilerOptions();
        if (options.tstlVerbose) {
            console.log("Emitting output");
        }
        const diagnostics = [];
        for (const plugin of plugins) {
            if (plugin.beforeEmit) {
                const beforeEmitPluginDiagnostics = (_a = plugin.beforeEmit(program, options, this.emitHost, emitPlan)) !== null && _a !== void 0 ? _a : [];
                diagnostics.push(...beforeEmitPluginDiagnostics);
            }
        }
        const emitBOM = (_b = options.emitBOM) !== null && _b !== void 0 ? _b : false;
        for (const { outputPath, code, sourceMap, sourceFiles } of emitPlan) {
            if (options.tstlVerbose) {
                console.log(`Emitting ${(0, utils_1.normalizeSlashes)(outputPath)}`);
            }
            writeFile(outputPath, code, emitBOM, undefined, sourceFiles);
            if (options.sourceMap && sourceMap !== undefined) {
                writeFile(outputPath + ".map", sourceMap, emitBOM, undefined, sourceFiles);
            }
        }
        for (const plugin of plugins) {
            if (plugin.afterEmit) {
                const afterEmitPluginDiagnostics = (_c = plugin.afterEmit(program, options, this.emitHost, emitPlan)) !== null && _c !== void 0 ? _c : [];
                diagnostics.push(...afterEmitPluginDiagnostics);
            }
        }
        if (options.tstlVerbose) {
            console.log("Emit finished!");
        }
        performance.endSection("emit");
        return diagnostics;
    }
    getEmitPlan(program, diagnostics, files, plugins) {
        performance.startSection("getEmitPlan");
        const options = program.getCompilerOptions();
        if (options.tstlVerbose) {
            console.log("Constructing emit plan");
        }
        // Resolve imported modules and modify output Lua requires
        const resolutionResult = (0, resolve_1.resolveDependencies)(program, files, this.emitHost, plugins);
        diagnostics.push(...resolutionResult.diagnostics);
        const lualibRequired = resolutionResult.resolvedFiles.some(f => f.fileName === "lualib_bundle");
        if (lualibRequired) {
            // Remove lualib placeholders from resolution result
            resolutionResult.resolvedFiles = resolutionResult.resolvedFiles.filter(f => f.fileName !== "lualib_bundle");
            if (options.tstlVerbose) {
                console.log("Including lualib bundle");
            }
            // Add lualib bundle to source dir 'virtually', will be moved to correct output dir in emitPlan
            const fileName = (0, utils_1.normalizeSlashes)(path.resolve(getSourceDir(program), "lualib_bundle.lua"));
            const code = this.getLuaLibBundleContent(options, resolutionResult.resolvedFiles);
            resolutionResult.resolvedFiles.unshift({ fileName, code });
        }
        let emitPlan;
        if ((0, CompilerOptions_1.isBundleEnabled)(options)) {
            const [bundleDiagnostics, bundleFile] = (0, bundle_1.getBundleResult)(program, resolutionResult.resolvedFiles);
            diagnostics.push(...bundleDiagnostics);
            emitPlan = [bundleFile];
        }
        else {
            const outputPathMap = new Map();
            emitPlan = resolutionResult.resolvedFiles.map(file => {
                const outputPath = getEmitPath(file.fileName, program);
                const existing = outputPathMap.get(outputPath);
                if (existing) {
                    diagnostics.push((0, diagnostics_1.emitPathCollision)(outputPath, existing, file.fileName));
                }
                else {
                    outputPathMap.set(outputPath, file.fileName);
                }
                return { ...file, outputPath };
            });
        }
        performance.endSection("getEmitPlan");
        return { emitPlan };
    }
    getLuaLibBundleContent(options, resolvedFiles) {
        var _a;
        const luaTarget = (_a = options.luaTarget) !== null && _a !== void 0 ? _a : CompilerOptions_1.LuaTarget.Universal;
        if (options.luaLibImport === CompilerOptions_1.LuaLibImportKind.RequireMinimal) {
            const usedFeatures = (0, LuaLib_1.findUsedLualibFeatures)(luaTarget, this.emitHost, resolvedFiles.map(f => f.code));
            return (0, LuaLib_1.buildMinimalLualibBundle)(usedFeatures, luaTarget, this.emitHost);
        }
        else {
            return (0, LuaLib_1.getLuaLibBundle)(luaTarget, this.emitHost);
        }
    }
}
exports.Transpiler = Transpiler;
function getEmitPath(file, program) {
    const relativeOutputPath = getEmitPathRelativeToOutDir(file, program);
    const outDir = getEmitOutDir(program);
    return path.join(outDir, relativeOutputPath);
}
function getEmitPathRelativeToOutDir(fileName, program) {
    var _a;
    const sourceDir = getSourceDir(program);
    // Default output path is relative path in source dir
    let emitPathSplits = path.relative(sourceDir, fileName).split(path.sep);
    // If source is in a parent directory of source dir, move it into the source dir
    emitPathSplits = emitPathSplits.filter(s => s !== "..");
    // To avoid overwriting lua sources in node_modules, emit into lua_modules
    if (emitPathSplits[0] === "node_modules") {
        emitPathSplits[0] = "lua_modules";
    }
    // Replace dots with underscores in path segments so that Lua's require()
    // resolves correctly. Dots are path separators in Lua's module system, so
    // "Foo.Bar/index.lua" would be unreachable via require("Foo.Bar.index")
    // since Lua interprets it as "Foo/Bar/index.lua".
    emitPathSplits[emitPathSplits.length - 1] = (0, utils_1.trimExtension)(emitPathSplits[emitPathSplits.length - 1]);
    emitPathSplits = emitPathSplits.map(segment => segment.replace(/\./g, "_"));
    // Set extension
    const extension = ((_a = program.getCompilerOptions().extension) !== null && _a !== void 0 ? _a : "lua").trim();
    const trimmedExtension = extension.startsWith(".") ? extension.substring(1) : extension;
    emitPathSplits[emitPathSplits.length - 1] += "." + trimmedExtension;
    return path.join(...emitPathSplits);
}
function getSourceDir(program) {
    const rootDir = program.getCompilerOptions().rootDir;
    if (rootDir && rootDir.length > 0) {
        return path.isAbsolute(rootDir) ? rootDir : path.resolve(getProjectRoot(program), rootDir);
    }
    // If no rootDir is given, source is relative to the project root
    return getProjectRoot(program);
}
function getEmitOutDir(program) {
    const outDir = program.getCompilerOptions().outDir;
    if (outDir && outDir.length > 0) {
        return path.isAbsolute(outDir) ? outDir : path.resolve(getProjectRoot(program), outDir);
    }
    // If no outDir is provided, emit in project root
    return getProjectRoot(program);
}
function getProjectRoot(program) {
    // Try to get the directory the tsconfig is in
    const tsConfigPath = program.getCompilerOptions().configFilePath;
    // If no tsconfig is known, use common source directory
    return tsConfigPath ? path.dirname(tsConfigPath) : program.getCommonSourceDirectory();
}
//# sourceMappingURL=transpiler.js.map