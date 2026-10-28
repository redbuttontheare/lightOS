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
exports.transformSymbolConstructorCall = transformSymbolConstructorCall;
const lua = __importStar(require("../../LuaAST"));
const diagnostics_1 = require("../utils/diagnostics");
const lualib_1 = require("../utils/lualib");
const call_1 = require("../visitors/call");
function transformSymbolConstructorCall(context, node, calledMethod) {
    const signature = context.checker.getResolvedSignature(node);
    const parameters = (0, call_1.transformArguments)(context, node.arguments, signature);
    const methodName = calledMethod.name.text;
    switch (methodName) {
        case "for":
        case "keyFor":
            (0, lualib_1.importLuaLibFeature)(context, lualib_1.LuaLibFeature.SymbolRegistry);
            const upperMethodName = methodName[0].toUpperCase() + methodName.slice(1);
            const functionIdentifier = lua.createIdentifier(`__TS__SymbolRegistry${upperMethodName}`);
            return lua.createCallExpression(functionIdentifier, parameters, node);
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(calledMethod.name, "Symbol", methodName));
    }
}
//# sourceMappingURL=symbol.js.map