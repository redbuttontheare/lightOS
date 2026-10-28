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
exports.getConfigDirectory = void 0;
exports.resolvePlugin = resolvePlugin;
const path = __importStar(require("path"));
const resolve = __importStar(require("resolve"));
// TODO: Don't depend on CLI?
const cliDiagnostics = __importStar(require("../cli/diagnostics"));
const diagnosticFactories = __importStar(require("./diagnostics"));
const getConfigDirectory = (options) => options.configFilePath ? path.dirname(options.configFilePath) : process.cwd();
exports.getConfigDirectory = getConfigDirectory;
const getTstlDirectory = () => path.dirname(__dirname);
function resolvePlugin(kind, optionName, basedir, query, importName = "default") {
    if (typeof query !== "string") {
        return { error: cliDiagnostics.compilerOptionRequiresAValueOfType(optionName, "string") };
    }
    const isModuleNotFoundError = (error) => error.code === "MODULE_NOT_FOUND";
    let resolved;
    try {
        resolved = resolve.sync(query, { basedir, extensions: [".js", ".ts", ".tsx"] });
    }
    catch (err) {
        if (!isModuleNotFoundError(err))
            throw err;
        return { error: diagnosticFactories.couldNotResolveFrom(kind, query, basedir) };
    }
    const hasNoRequireHook = require.extensions[".ts"] === undefined;
    if (hasNoRequireHook && (resolved.endsWith(".ts") || resolved.endsWith(".tsx"))) {
        try {
            const tsNodePath = resolve.sync("ts-node", { basedir: getTstlDirectory() });
            const tsNode = require(tsNodePath);
            tsNode.register({ transpileOnly: true });
        }
        catch (err) {
            if (!isModuleNotFoundError(err))
                throw err;
            return { error: diagnosticFactories.toLoadItShouldBeTranspiled(kind, query) };
        }
    }
    const commonjsModule = require(resolved);
    const factoryModule = commonjsModule.__esModule ? commonjsModule : { default: commonjsModule };
    const result = factoryModule[importName];
    if (result === undefined) {
        return { error: diagnosticFactories.shouldHaveAExport(kind, query, importName) };
    }
    return { result };
}
//# sourceMappingURL=utils.js.map