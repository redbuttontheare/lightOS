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
exports.transformObjectConstructorCall = transformObjectConstructorCall;
exports.tryTransformObjectPrototypeCall = tryTransformObjectPrototypeCall;
const lua = __importStar(require("../../LuaAST"));
const diagnostics_1 = require("../utils/diagnostics");
const lualib_1 = require("../utils/lualib");
const call_1 = require("../visitors/call");
function transformObjectConstructorCall(context, node, calledMethod) {
    const args = (0, call_1.transformArguments)(context, node.arguments);
    const methodName = calledMethod.name.text;
    switch (methodName) {
        case "assign":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectAssign, node, ...args);
        case "defineProperty":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectDefineProperty, node, ...args);
        case "entries":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectEntries, node, ...args);
        case "fromEntries":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectFromEntries, node, ...args);
        case "getOwnPropertyDescriptor":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectGetOwnPropertyDescriptor, node, ...args);
        case "getOwnPropertyDescriptors":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectGetOwnPropertyDescriptors, node, ...args);
        case "groupBy":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectGroupBy, node, ...args);
        case "keys":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectKeys, node, ...args);
        case "values":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ObjectValues, node, ...args);
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(calledMethod.name, "Object", methodName));
    }
}
function tryTransformObjectPrototypeCall(context, node, calledMethod) {
    const name = calledMethod.name.text;
    switch (name) {
        case "toString":
            const toStringIdentifier = lua.createIdentifier("tostring");
            return lua.createCallExpression(toStringIdentifier, [context.transformExpression(calledMethod.expression)], node);
        case "hasOwnProperty":
            const expr = context.transformExpression(calledMethod.expression);
            const signature = context.checker.getResolvedSignature(node);
            const parameters = (0, call_1.transformArguments)(context, node.arguments, signature);
            const rawGetIdentifier = lua.createIdentifier("rawget");
            const rawGetCall = lua.createCallExpression(rawGetIdentifier, [expr, ...parameters]);
            return lua.createBinaryExpression(rawGetCall, lua.createNilLiteral(), lua.SyntaxKind.InequalityOperator, node);
    }
}
//# sourceMappingURL=object.js.map