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
exports.transformAwaitExpression = void 0;
exports.isAsyncFunction = isAsyncFunction;
exports.wrapInAsyncAwaiter = wrapInAsyncAwaiter;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const diagnostics_1 = require("../utils/diagnostics");
const lualib_1 = require("../utils/lualib");
const typescript_1 = require("../utils/typescript");
const transformAwaitExpression = (node, context) => {
    // Check if await is inside an async function, it is not allowed at top level or in non-async functions
    if (!(0, typescript_1.isInAsyncFunction)(node)) {
        context.diagnostics.push((0, diagnostics_1.awaitMustBeInAsyncFunction)(node));
    }
    const expression = context.transformExpression(node.expression);
    return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.Await, node, expression);
};
exports.transformAwaitExpression = transformAwaitExpression;
function isAsyncFunction(declaration) {
    var _a, _b;
    return (_b = (_a = declaration.modifiers) === null || _a === void 0 ? void 0 : _a.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) !== null && _b !== void 0 ? _b : false;
}
function wrapInAsyncAwaiter(context, statements, includeResolveParameter = true) {
    (0, lualib_1.importLuaLibFeature)(context, lualib_1.LuaLibFeature.Await);
    const parameters = includeResolveParameter ? [lua.createIdentifier("____awaiter_resolve")] : [];
    return lua.createCallExpression(lua.createIdentifier("__TS__AsyncAwaiter"), [
        lua.createFunctionExpression(lua.createBlock(statements), parameters),
    ]);
}
//# sourceMappingURL=async-await.js.map