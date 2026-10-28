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
exports.isPromiseClass = isPromiseClass;
exports.createPromiseIdentifier = createPromiseIdentifier;
exports.transformPromiseConstructorCall = transformPromiseConstructorCall;
exports.createStaticPromiseFunctionAccessor = createStaticPromiseFunctionAccessor;
const lua = __importStar(require("../../LuaAST"));
const diagnostics_1 = require("../utils/diagnostics");
const lualib_1 = require("../utils/lualib");
const call_1 = require("../visitors/call");
const typescript_1 = require("../utils/typescript");
function isPromiseClass(context, node) {
    if (node.text !== "Promise")
        return false;
    const type = context.checker.getTypeAtLocation(node);
    return (0, typescript_1.isStandardLibraryType)(context, type, undefined);
}
function createPromiseIdentifier(original) {
    return lua.createIdentifier("__TS__Promise", original);
}
function transformPromiseConstructorCall(context, node, calledMethod) {
    const signature = context.checker.getResolvedSignature(node);
    const params = (0, call_1.transformArguments)(context, node.arguments, signature);
    const expressionName = calledMethod.name.text;
    switch (expressionName) {
        case "all":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.PromiseAll, node, ...params);
        case "allSettled":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.PromiseAllSettled, node, ...params);
        case "any":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.PromiseAny, node, ...params);
        case "race":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.PromiseRace, node, ...params);
        case "resolve":
            (0, lualib_1.importLuaLibFeature)(context, lualib_1.LuaLibFeature.Promise);
            return lua.createCallExpression(createStaticPromiseFunctionAccessor("resolve", calledMethod), params, node);
        case "reject":
            (0, lualib_1.importLuaLibFeature)(context, lualib_1.LuaLibFeature.Promise);
            return lua.createCallExpression(createStaticPromiseFunctionAccessor("reject", calledMethod), params, node);
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(calledMethod.name, "Promise", expressionName));
    }
}
function createStaticPromiseFunctionAccessor(functionName, node) {
    return lua.createTableIndexExpression(lua.createIdentifier("__TS__Promise"), lua.createStringLiteral(functionName), node);
}
//# sourceMappingURL=promise.js.map