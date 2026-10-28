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
exports.transformMathProperty = transformMathProperty;
exports.transformMathCall = transformMathCall;
const CompilerOptions_1 = require("../../CompilerOptions");
const lua = __importStar(require("../../LuaAST"));
const diagnostics_1 = require("../utils/diagnostics");
const lualib_1 = require("../utils/lualib");
const call_1 = require("../visitors/call");
function transformMathProperty(context, node) {
    const name = node.name.text;
    switch (name) {
        case "PI":
            const property = lua.createStringLiteral("pi", node.name);
            const math = lua.createIdentifier("math", node.expression);
            return lua.createTableIndexExpression(math, property, node);
        case "E":
        case "LN10":
        case "LN2":
        case "LOG10E":
        case "LOG2E":
        case "SQRT1_2":
        case "SQRT2":
            return lua.createNumericLiteral(Math[name], node);
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(node.name, "Math", name));
    }
}
function transformMathCall(context, node, calledMethod) {
    var _a, _b, _c, _d;
    const signature = context.checker.getResolvedSignature(node);
    const params = (0, call_1.transformArguments)(context, node.arguments, signature);
    const math = lua.createIdentifier("math");
    const expressionName = calledMethod.name.text;
    switch (expressionName) {
        // Lua 5.3+: math.atan(y, x)
        // Otherwise: math.atan2(y, x)
        case "atan2": {
            if (context.luaTarget === CompilerOptions_1.LuaTarget.Universal) {
                return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.MathAtan2, node, ...params);
            }
            const useAtan2 = context.luaTarget === CompilerOptions_1.LuaTarget.Lua50 ||
                context.luaTarget === CompilerOptions_1.LuaTarget.Lua51 ||
                context.luaTarget === CompilerOptions_1.LuaTarget.Lua52 ||
                context.luaTarget === CompilerOptions_1.LuaTarget.LuaJIT ||
                context.luaTarget === CompilerOptions_1.LuaTarget.Luau;
            const method = lua.createStringLiteral(useAtan2 ? "atan2" : "atan");
            return lua.createCallExpression(lua.createTableIndexExpression(math, method), params, node);
        }
        // (math.log(x) / Math.LNe)
        case "log10":
        case "log2": {
            const log1 = lua.createTableIndexExpression(math, lua.createStringLiteral("log"));
            const logCall1 = lua.createCallExpression(log1, params);
            const e = lua.createNumericLiteral(expressionName === "log10" ? Math.LN10 : Math.LN2);
            return lua.createBinaryExpression(logCall1, e, lua.SyntaxKind.DivisionOperator, node);
        }
        // math.log(1 + x)
        case "log1p": {
            const log = lua.createStringLiteral("log");
            const one = lua.createNumericLiteral(1);
            const add = lua.createBinaryExpression(one, (_a = params[0]) !== null && _a !== void 0 ? _a : lua.createNilLiteral(), lua.SyntaxKind.AdditionOperator);
            return lua.createCallExpression(lua.createTableIndexExpression(math, log), [add], node);
        }
        case "pow": {
            // Translate to base ^ power
            return lua.createBinaryExpression((_b = params[0]) !== null && _b !== void 0 ? _b : lua.createNilLiteral(), (_c = params[1]) !== null && _c !== void 0 ? _c : lua.createNilLiteral(), lua.SyntaxKind.PowerOperator, node);
        }
        // math.floor(x + 0.5)
        case "round": {
            const floor = lua.createStringLiteral("floor");
            const half = lua.createNumericLiteral(0.5);
            const add = lua.createBinaryExpression((_d = params[0]) !== null && _d !== void 0 ? _d : lua.createNilLiteral(), half, lua.SyntaxKind.AdditionOperator);
            return lua.createCallExpression(lua.createTableIndexExpression(math, floor), [add], node);
        }
        case "sign": {
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.MathSign, node, ...params);
        }
        case "trunc": {
            return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.MathTrunc, node, ...params);
        }
        case "abs":
        case "acos":
        case "asin":
        case "atan":
        case "ceil":
        case "cos":
        case "exp":
        case "floor":
        case "log":
        case "max":
        case "min":
        case "random":
        case "sin":
        case "sqrt":
        case "tan": {
            const method = lua.createStringLiteral(expressionName);
            return lua.createCallExpression(lua.createTableIndexExpression(math, method), params, node);
        }
        default:
            context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(calledMethod.name, "Math", expressionName));
    }
}
//# sourceMappingURL=math.js.map