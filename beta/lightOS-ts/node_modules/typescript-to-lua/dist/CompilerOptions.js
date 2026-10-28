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
exports.isBundleEnabled = exports.BuildMode = exports.LuaTarget = exports.LuaLibImportKind = void 0;
exports.validateOptions = validateOptions;
const typescript_1 = require("typescript");
const diagnosticFactories = __importStar(require("./transpilation/diagnostics"));
var LuaLibImportKind;
(function (LuaLibImportKind) {
    LuaLibImportKind["None"] = "none";
    LuaLibImportKind["Inline"] = "inline";
    LuaLibImportKind["Require"] = "require";
    LuaLibImportKind["RequireMinimal"] = "require-minimal";
})(LuaLibImportKind || (exports.LuaLibImportKind = LuaLibImportKind = {}));
var LuaTarget;
(function (LuaTarget) {
    LuaTarget["Universal"] = "universal";
    LuaTarget["Lua50"] = "5.0";
    LuaTarget["Lua51"] = "5.1";
    LuaTarget["Lua52"] = "5.2";
    LuaTarget["Lua53"] = "5.3";
    LuaTarget["Lua54"] = "5.4";
    LuaTarget["Lua55"] = "5.5";
    LuaTarget["LuaJIT"] = "JIT";
    LuaTarget["Luau"] = "Luau";
})(LuaTarget || (exports.LuaTarget = LuaTarget = {}));
var BuildMode;
(function (BuildMode) {
    BuildMode["Default"] = "default";
    BuildMode["Library"] = "library";
})(BuildMode || (exports.BuildMode = BuildMode = {}));
const isBundleEnabled = (options) => options.luaBundle !== undefined && options.luaBundleEntry !== undefined;
exports.isBundleEnabled = isBundleEnabled;
function validateOptions(options) {
    const diagnostics = [];
    if (options.luaBundle && !options.luaBundleEntry) {
        diagnostics.push(diagnosticFactories.luaBundleEntryIsRequired());
    }
    if (options.luaBundle && options.luaLibImport === LuaLibImportKind.Inline) {
        diagnostics.push(diagnosticFactories.usingLuaBundleWithInlineMightGenerateDuplicateCode());
    }
    if (options.luaBundle && options.buildMode === BuildMode.Library) {
        diagnostics.push(diagnosticFactories.cannotBundleLibrary());
    }
    if (options.jsx && options.jsx !== typescript_1.JsxEmit.React) {
        diagnostics.push(diagnosticFactories.unsupportedJsxEmit());
    }
    return diagnostics;
}
//# sourceMappingURL=CompilerOptions.js.map