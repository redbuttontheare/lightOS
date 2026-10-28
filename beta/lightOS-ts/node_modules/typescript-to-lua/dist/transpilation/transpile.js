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
exports.getProgramTranspileResult = getProgramTranspileResult;
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
const CompilerOptions_1 = require("../CompilerOptions");
const LuaPrinter_1 = require("../LuaPrinter");
const transformation_1 = require("../transformation");
const utils_1 = require("../utils");
const transformers_1 = require("./transformers");
const performance = __importStar(require("../measure-performance"));
function getProgramTranspileResult(emitHost, writeFileResult, { program, sourceFiles: targetSourceFiles, customTransformers = {}, plugins = [] }) {
    var _a, _b;
    performance.startSection("beforeTransform");
    const options = program.getCompilerOptions();
    if (options.tstlVerbose) {
        console.log("Parsing project settings");
    }
    const diagnostics = (0, CompilerOptions_1.validateOptions)(options);
    let transpiledFiles = [];
    if (options.noEmitOnError) {
        const preEmitDiagnostics = [
            ...diagnostics,
            ...program.getOptionsDiagnostics(),
            ...program.getGlobalDiagnostics(),
        ];
        if (targetSourceFiles) {
            for (const sourceFile of targetSourceFiles) {
                preEmitDiagnostics.push(...program.getSyntacticDiagnostics(sourceFile));
                preEmitDiagnostics.push(...program.getSemanticDiagnostics(sourceFile));
            }
        }
        else {
            preEmitDiagnostics.push(...program.getSyntacticDiagnostics());
            preEmitDiagnostics.push(...program.getSemanticDiagnostics());
        }
        if (preEmitDiagnostics.length === 0 && (options.declaration || options.composite)) {
            preEmitDiagnostics.push(...program.getDeclarationDiagnostics());
        }
        if (preEmitDiagnostics.length > 0) {
            performance.endSection("beforeTransform");
            return { diagnostics: preEmitDiagnostics, transpiledFiles };
        }
    }
    for (const plugin of plugins) {
        if (plugin.beforeTransform) {
            const pluginDiagnostics = (_a = plugin.beforeTransform(program, options, emitHost)) !== null && _a !== void 0 ? _a : [];
            diagnostics.push(...pluginDiagnostics);
        }
    }
    const visitorMap = (0, transformation_1.createVisitorMap)(plugins.map(p => p.visitors).filter(utils_1.isNonNull));
    const printer = (0, LuaPrinter_1.createPrinter)(plugins.map(p => p.printer).filter(utils_1.isNonNull));
    const processSourceFile = (sourceFile) => {
        if (options.tstlVerbose) {
            console.log(`Transforming ${sourceFile.fileName}`);
        }
        performance.startSection("transpile");
        const { file, diagnostics: transformDiagnostics } = (0, transformation_1.transformSourceFile)(program, sourceFile, visitorMap);
        diagnostics.push(...transformDiagnostics);
        performance.endSection("transpile");
        if (!options.noEmit && !options.emitDeclarationOnly) {
            performance.startSection("print");
            if (options.tstlVerbose) {
                console.log(`Printing ${sourceFile.fileName}`);
            }
            const printResult = printer(program, emitHost, sourceFile.fileName, file);
            transpiledFiles.push({
                sourceFiles: [sourceFile],
                fileName: path.normalize(sourceFile.fileName),
                luaAst: file,
                ...printResult,
            });
            performance.endSection("print");
        }
    };
    const transformers = (0, transformers_1.getTransformers)(program, diagnostics, customTransformers, processSourceFile);
    const isEmittableJsonFile = (sourceFile) => sourceFile.flags & ts.NodeFlags.JsonFile &&
        !options.emitDeclarationOnly &&
        !program.isSourceFileFromExternalLibrary(sourceFile);
    // We always have to run transformers to get diagnostics
    const oldNoEmit = options.noEmit;
    options.noEmit = false;
    const writeFile = (fileName, ...rest) => {
        if (!fileName.endsWith(".js") && !fileName.endsWith(".js.map") && !fileName.endsWith(".json")) {
            writeFileResult(fileName, ...rest);
        }
    };
    performance.endSection("beforeTransform");
    if (targetSourceFiles) {
        for (const file of targetSourceFiles) {
            if (isEmittableJsonFile(file)) {
                processSourceFile(file);
            }
            else {
                diagnostics.push(...program.emit(file, writeFile, undefined, false, transformers).diagnostics);
            }
        }
    }
    else {
        diagnostics.push(...program.emit(undefined, writeFile, undefined, false, transformers).diagnostics);
        // JSON files don't get through transformers and aren't written when outDir is the same as rootDir
        program.getSourceFiles().filter(isEmittableJsonFile).forEach(processSourceFile);
    }
    performance.startSection("afterPrint");
    options.noEmit = oldNoEmit;
    if (options.noEmit || (options.noEmitOnError && diagnostics.length > 0)) {
        transpiledFiles = [];
    }
    for (const plugin of plugins) {
        if (plugin.afterPrint) {
            const pluginDiagnostics = (_b = plugin.afterPrint(program, options, emitHost, transpiledFiles)) !== null && _b !== void 0 ? _b : [];
            diagnostics.push(...pluginDiagnostics);
        }
    }
    performance.endSection("afterPrint");
    return { diagnostics, transpiledFiles };
}
//# sourceMappingURL=transpile.js.map