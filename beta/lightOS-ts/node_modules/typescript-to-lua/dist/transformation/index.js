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
exports.createVisitorMap = createVisitorMap;
exports.transformSourceFile = transformSourceFile;
const ts = __importStar(require("typescript"));
const utils_1 = require("../utils");
const context_1 = require("./context");
const visitors_1 = require("./visitors");
const using_transformer_1 = require("./pre-transformers/using-transformer");
function createVisitorMap(customVisitors) {
    const objectVisitorMap = new Map();
    for (const visitors of [visitors_1.standardVisitors, ...customVisitors]) {
        const priority = visitors === visitors_1.standardVisitors ? -Infinity : 0;
        for (const [syntaxKindKey, visitor] of Object.entries(visitors)) {
            if (!visitor)
                continue;
            const syntaxKind = Number(syntaxKindKey);
            const nodeVisitors = (0, utils_1.getOrUpdate)(objectVisitorMap, syntaxKind, () => []);
            const objectVisitor = typeof visitor === "function" ? { transform: visitor, priority } : visitor;
            nodeVisitors.push(objectVisitor);
        }
    }
    const result = new Map();
    for (const [kind, nodeVisitors] of objectVisitorMap) {
        result.set(kind, nodeVisitors.sort((a, b) => { var _a, _b; return ((_a = a.priority) !== null && _a !== void 0 ? _a : 0) - ((_b = b.priority) !== null && _b !== void 0 ? _b : 0); }).map(visitor => visitor.transform));
    }
    return result;
}
function transformSourceFile(program, sourceFile, visitorMap) {
    const context = new context_1.TransformationContext(program, sourceFile, visitorMap);
    // TS -> TS pre-transformation
    const preTransformers = [(0, using_transformer_1.usingTransformer)(context)];
    const result = ts.transform(sourceFile, preTransformers);
    // TS -> Lua transformation
    const [file] = context.transformNode(result.transformed[0]);
    return { file, diagnostics: context.diagnostics };
}
//# sourceMappingURL=index.js.map