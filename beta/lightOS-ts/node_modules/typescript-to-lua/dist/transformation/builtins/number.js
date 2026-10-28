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
exports.transformNumberPrototypeCall = transformNumberPrototypeCall;
exports.transformNumberProperty = transformNumberProperty;
exports.transformNumberConstructorCall = transformNumberConstructorCall;
const lua = __importStar(require("../../LuaAST"));
const lua_ast_1 = require("../utils/lua-ast");
const diagnostics_1 = require("../utils/diagnostics");
const lualib_1 = require("../utils/lualib");
const call_1 = require("../visitors/call");
const CompilerOptions_1 = require("../../CompilerOptions");
function transformNumberPrototypeCall(context, node, calledMethod) {
    const signature = context.checker.getResolvedSignature(node);
    const params = (0, call_1.transformArguments)(context, node.arguments, signature);
    const caller = context.transformExpression(calledMethod.expression);
    const expressionName = calledMethod.name.text;
    switch (expressionName) {
        case "toString":
            return params.length === 0
                ? lua.createCallExpression(lua.createIdentifier("tostring"), [caller], node)
                : (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.NumberToString, node, caller, ...params);
        case "toFixed":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.NumberToFixed, node, caller, ...params);
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(calledMethod.name, "number", expressionName));
    }
}
function transformNumberProperty(context, node) {
    const name = node.name.text;
    /*
        Read the docs on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number for further info about what these numbers entail.
        Most of them should be fairly straight forward base on their name(s) though.
    */
    switch (name) {
        case "POSITIVE_INFINITY":
            if (context.luaTarget === CompilerOptions_1.LuaTarget.Lua50) {
                const one = lua.createNumericLiteral(1);
                const zero = lua.createNumericLiteral(0);
                return lua.createBinaryExpression(one, zero, lua.SyntaxKind.DivisionOperator);
            }
            else {
                const math = lua.createIdentifier("math");
                const huge = lua.createStringLiteral("huge");
                return lua.createTableIndexExpression(math, huge, node);
            }
        case "NEGATIVE_INFINITY":
            if (context.luaTarget === CompilerOptions_1.LuaTarget.Lua50) {
                const one = lua.createNumericLiteral(1);
                const zero = lua.createNumericLiteral(0);
                return lua.createUnaryExpression(lua.createBinaryExpression(one, zero, lua.SyntaxKind.DivisionOperator), lua.SyntaxKind.NegationOperator);
            }
            else {
                const math = lua.createIdentifier("math");
                const huge = lua.createStringLiteral("huge");
                return lua.createUnaryExpression(lua.createTableIndexExpression(math, huge, node), lua.SyntaxKind.NegationOperator);
            }
        case "NaN":
            return (0, lua_ast_1.createNaN)(node);
        case "EPSILON":
            return lua.createBinaryExpression(lua.createNumericLiteral(2), lua.createNumericLiteral(-52), lua.SyntaxKind.PowerOperator, node);
        case "MIN_VALUE":
            // 2 ^ -1074 = 5e-324 (smallest positive double)
            return lua.createBinaryExpression(lua.createNumericLiteral(2), lua.createNumericLiteral(-1074), lua.SyntaxKind.PowerOperator, node);
        case "MIN_SAFE_INTEGER":
            // -(2 ^ 53 - 1) = -9007199254740991
            return lua.createUnaryExpression(lua.createParenthesizedExpression(lua.createBinaryExpression(lua.createBinaryExpression(lua.createNumericLiteral(2), lua.createNumericLiteral(53), lua.SyntaxKind.PowerOperator), lua.createNumericLiteral(1), lua.SyntaxKind.SubtractionOperator)), lua.SyntaxKind.NegationOperator, node);
        case "MAX_SAFE_INTEGER":
            // 2 ^ 53 - 1 = 9007199254740991
            return lua.createBinaryExpression(lua.createBinaryExpression(lua.createNumericLiteral(2), lua.createNumericLiteral(53), lua.SyntaxKind.PowerOperator), lua.createNumericLiteral(1), lua.SyntaxKind.SubtractionOperator, node);
        case "MAX_VALUE":
            // (2 - 2 ^ -52) * 2 ^ 1023 = 1.7976931348623157e+308
            return lua.createBinaryExpression(lua.createParenthesizedExpression(lua.createBinaryExpression(lua.createNumericLiteral(2), lua.createBinaryExpression(lua.createNumericLiteral(2), lua.createNumericLiteral(-52), lua.SyntaxKind.PowerOperator), lua.SyntaxKind.SubtractionOperator)), lua.createBinaryExpression(lua.createNumericLiteral(2), lua.createNumericLiteral(1023), lua.SyntaxKind.PowerOperator), lua.SyntaxKind.MultiplicationOperator, node);
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(node.name, "Number", name));
    }
}
function transformNumberConstructorCall(context, node, calledMethod) {
    const parameters = (0, call_1.transformArguments)(context, node.arguments);
    const methodName = calledMethod.name.text;
    switch (methodName) {
        case "isInteger":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.NumberIsInteger, node, ...parameters);
        case "isNaN":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.NumberIsNaN, node, ...parameters);
        case "isFinite":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.NumberIsFinite, node, ...parameters);
        case "parseInt":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.NumberParseInt, node, ...parameters);
        case "parseFloat":
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.NumberParseFloat, node, ...parameters);
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(calledMethod.name, "Number", methodName));
    }
}
//# sourceMappingURL=number.js.map