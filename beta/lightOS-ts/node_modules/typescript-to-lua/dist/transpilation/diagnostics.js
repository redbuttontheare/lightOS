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
exports.emitPathCollision = exports.unsupportedJsxEmit = exports.cannotBundleLibrary = exports.usingLuaBundleWithInlineMightGenerateDuplicateCode = exports.luaBundleEntryIsRequired = exports.couldNotFindBundleEntryPoint = exports.transformerShouldBeATsTransformerFactory = exports.shouldHaveAExport = exports.couldNotResolveFrom = exports.toLoadItShouldBeTranspiled = exports.couldNotReadDependency = exports.couldNotResolveRequire = void 0;
const ts = __importStar(require("typescript"));
const utils_1 = require("../utils");
const createDiagnosticFactory = (getMessage, category = ts.DiagnosticCategory.Error) => (0, utils_1.createSerialDiagnosticFactory)((...args) => ({ messageText: getMessage(...args), category }));
exports.couldNotResolveRequire = createDiagnosticFactory((requirePath, containingFile) => `Could not resolve lua source files for require path '${requirePath}' in file ${containingFile}.`);
exports.couldNotReadDependency = createDiagnosticFactory((dependency) => `Could not read content of resolved dependency ${dependency}.`);
exports.toLoadItShouldBeTranspiled = createDiagnosticFactory((kind, transform) => `To load "${transform}" ${kind} it should be transpiled or "ts-node" should be installed.`);
exports.couldNotResolveFrom = createDiagnosticFactory((kind, transform, base) => `Could not resolve "${transform}" ${kind} from "${base}".`);
exports.shouldHaveAExport = createDiagnosticFactory((kind, transform, importName) => `"${transform}" ${kind} should have a "${importName}" export.`);
exports.transformerShouldBeATsTransformerFactory = createDiagnosticFactory((transform) => `"${transform}" transformer should be a ts.TransformerFactory or an object with ts.TransformerFactory values.`);
exports.couldNotFindBundleEntryPoint = createDiagnosticFactory((entryPoint) => `Could not find bundle entry point '${entryPoint}'. It should be a file in the project.`);
exports.luaBundleEntryIsRequired = createDiagnosticFactory(() => "'luaBundleEntry' is required when 'luaBundle' is enabled.");
exports.usingLuaBundleWithInlineMightGenerateDuplicateCode = (0, utils_1.createSerialDiagnosticFactory)(() => ({
    category: ts.DiagnosticCategory.Warning,
    messageText: "Using 'luaBundle' with 'luaLibImport: \"inline\"' might generate duplicate code. " +
        "It is recommended to use 'luaLibImport: \"require\"'.",
}));
exports.cannotBundleLibrary = createDiagnosticFactory(() => 'Cannot bundle projects with "buildmode": "library". Projects including the library can still bundle (which will include external library files).');
exports.unsupportedJsxEmit = createDiagnosticFactory(() => 'JSX is only supported with "react" jsx option.');
exports.emitPathCollision = createDiagnosticFactory((outputPath, file1, file2) => `Output path '${outputPath}' is used by both '${file1}' and '${file2}'. ` +
    `Dots in file/directory names are replaced with underscores for Lua module resolution.`);
//# sourceMappingURL=diagnostics.js.map