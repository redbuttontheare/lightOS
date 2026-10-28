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
exports.transformExpressionStatement = void 0;
exports.wrapInStatement = wrapInStatement;
const lua = __importStar(require("../../LuaAST"));
const context_1 = require("../context");
const binary_expression_1 = require("./binary-expression");
const unary_expression_1 = require("./unary-expression");
const transformExpressionStatement = (node, context) => {
    const unaryExpressionResult = (0, unary_expression_1.transformUnaryExpressionStatement)(context, node);
    if (unaryExpressionResult) {
        return unaryExpressionResult;
    }
    const binaryExpressionResult = (0, binary_expression_1.transformBinaryExpressionStatement)(context, node);
    if (binaryExpressionResult) {
        return binaryExpressionResult;
    }
    return wrapInStatement(context.transformExpression(node.expression));
};
exports.transformExpressionStatement = transformExpressionStatement;
function wrapInStatement(result) {
    const isTempVariable = lua.isIdentifier(result) && result.symbolId === context_1.tempSymbolId;
    if (isTempVariable) {
        return undefined;
    }
    // "synthetic": no side effects and no original source
    const isSyntheticExpression = (lua.isIdentifier(result) || lua.isLiteral(result)) && result.line === undefined;
    if (isSyntheticExpression) {
        return undefined;
    }
    if (lua.isCallExpression(result) || lua.isMethodCallExpression(result)) {
        return lua.createExpressionStatement(result);
    }
    // Assign expression statements to dummy to make sure they're legal Lua
    return lua.createVariableDeclarationStatement(lua.createAnonymousIdentifier(), result);
}
//# sourceMappingURL=expression-statement.js.map