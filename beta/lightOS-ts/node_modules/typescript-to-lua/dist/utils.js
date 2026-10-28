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
exports.trimExtension = exports.normalizeSlashes = exports.createSerialDiagnosticFactory = exports.createDiagnosticFactoryWithCode = exports.intersection = exports.union = exports.intersperse = void 0;
exports.castArray = castArray;
exports.formatPathToLuaPath = formatPathToLuaPath;
exports.getOrUpdate = getOrUpdate;
exports.isNonNull = isNonNull;
exports.cast = cast;
exports.assert = assert;
exports.assertNever = assertNever;
exports.assume = assume;
const ts = __importStar(require("typescript"));
const nativeAssert = __importStar(require("assert"));
const path = __importStar(require("path"));
function castArray(value) {
    return Array.isArray(value) ? value : [value];
}
const intersperse = (values, separator) => values.flatMap((value, index) => (index === 0 ? [value] : [separator, value]));
exports.intersperse = intersperse;
const union = (...values) => [...new Set(...values)];
exports.union = union;
const intersection = (first, ...rest) => (0, exports.union)(first).filter(x => rest.every(r => r.includes(x)));
exports.intersection = intersection;
const createDiagnosticFactoryWithCode = (code, create) => Object.assign((...args) => ({
    file: undefined,
    start: undefined,
    length: undefined,
    category: ts.DiagnosticCategory.Error,
    code,
    source: "typescript-to-lua",
    ...create(...args),
}), { code });
exports.createDiagnosticFactoryWithCode = createDiagnosticFactoryWithCode;
let serialDiagnosticCodeCounter = 100000;
const createSerialDiagnosticFactory = (create) => (0, exports.createDiagnosticFactoryWithCode)(serialDiagnosticCodeCounter++, create);
exports.createSerialDiagnosticFactory = createSerialDiagnosticFactory;
const normalizeSlashes = (filePath) => filePath.replace(/\\/g, "/");
exports.normalizeSlashes = normalizeSlashes;
const trimExtension = (filePath) => filePath.slice(0, -path.extname(filePath).length);
exports.trimExtension = trimExtension;
function formatPathToLuaPath(filePath) {
    filePath = filePath.replace(/\.json$/, "");
    if (process.platform === "win32") {
        // Windows can use backslashes
        filePath = filePath.replace(/\.\\/g, "").replace(/\\/g, ".");
    }
    return filePath.replace(/\.\//g, "").replace(/\//g, ".");
}
function getOrUpdate(map, key, getDefaultValue) {
    if (!map.has(key)) {
        map.set(key, getDefaultValue());
    }
    return map.get(key);
}
function isNonNull(value) {
    return value != null;
}
function cast(item, cast) {
    if (cast(item)) {
        return item;
    }
    else {
        throw new Error(`Failed to cast value to expected type using ${cast.name}.`);
    }
}
function assert(value, message) {
    nativeAssert.ok(value, message);
}
function assertNever(_value) {
    throw new Error("Value is expected to be never");
}
function assume(_value) { }
//# sourceMappingURL=utils.js.map