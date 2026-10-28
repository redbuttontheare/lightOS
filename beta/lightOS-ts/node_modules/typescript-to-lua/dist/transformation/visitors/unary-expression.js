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
exports.transformPrefixUnaryExpression = exports.transformPostfixUnaryExpression = void 0;
exports.transformUnaryExpressionStatement = transformUnaryExpressionStatement;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const utils_1 = require("../../utils");
const bit_1 = require("./binary-expression/bit");
const compound_1 = require("./binary-expression/compound");
const typescript_1 = require("../utils/typescript");
const lualib_1 = require("../utils/lualib");
function transformUnaryExpressionStatement(context, node) {
    const expression = ts.isExpressionStatement(node) ? node.expression : node;
    if (ts.isPrefixUnaryExpression(expression) &&
        (expression.operator === ts.SyntaxKind.PlusPlusToken || expression.operator === ts.SyntaxKind.MinusMinusToken)) {
        // ++i, --i
        const replacementOperator = expression.operator === ts.SyntaxKind.PlusPlusToken ? ts.SyntaxKind.PlusToken : ts.SyntaxKind.MinusToken;
        return (0, compound_1.transformCompoundAssignmentStatement)(context, expression, expression.operand, ts.factory.createNumericLiteral(1), replacementOperator);
    }
    else if (ts.isPostfixUnaryExpression(expression)) {
        // i++, i--
        const replacementOperator = expression.operator === ts.SyntaxKind.PlusPlusToken ? ts.SyntaxKind.PlusToken : ts.SyntaxKind.MinusToken;
        return (0, compound_1.transformCompoundAssignmentStatement)(context, expression, expression.operand, ts.factory.createNumericLiteral(1), replacementOperator);
    }
}
const transformPostfixUnaryExpression = (expression, context) => {
    switch (expression.operator) {
        case ts.SyntaxKind.PlusPlusToken:
            return (0, compound_1.transformCompoundAssignmentExpression)(context, expression, expression.operand, ts.factory.createNumericLiteral(1), ts.SyntaxKind.PlusToken, true);
        case ts.SyntaxKind.MinusMinusToken:
            return (0, compound_1.transformCompoundAssignmentExpression)(context, expression, expression.operand, ts.factory.createNumericLiteral(1), ts.SyntaxKind.MinusToken, true);
        default:
            (0, utils_1.assertNever)(expression.operator);
    }
};
exports.transformPostfixUnaryExpression = transformPostfixUnaryExpression;
const transformPrefixUnaryExpression = (expression, context) => {
    switch (expression.operator) {
        case ts.SyntaxKind.PlusPlusToken:
            return (0, compound_1.transformCompoundAssignmentExpression)(context, expression, expression.operand, ts.factory.createNumericLiteral(1), ts.SyntaxKind.PlusToken, false);
        case ts.SyntaxKind.MinusMinusToken:
            return (0, compound_1.transformCompoundAssignmentExpression)(context, expression, expression.operand, ts.factory.createNumericLiteral(1), ts.SyntaxKind.MinusToken, false);
        case ts.SyntaxKind.PlusToken: {
            const operand = context.transformExpression(expression.operand);
            const type = context.checker.getTypeAtLocation(expression.operand);
            if ((0, typescript_1.isNumberType)(context, type)) {
                return operand;
            }
            else {
                return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.Number, expression, operand);
            }
        }
        case ts.SyntaxKind.MinusToken: {
            const operand = context.transformExpression(expression.operand);
            const type = context.checker.getTypeAtLocation(expression.operand);
            if ((0, typescript_1.isNumberType)(context, type)) {
                return lua.createUnaryExpression(operand, lua.SyntaxKind.NegationOperator);
            }
            else {
                return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.Number, expression, lua.createUnaryExpression(operand, lua.SyntaxKind.NegationOperator));
            }
        }
        case ts.SyntaxKind.ExclamationToken:
            return lua.createUnaryExpression(context.transformExpression(expression.operand), lua.SyntaxKind.NotOperator);
        case ts.SyntaxKind.TildeToken:
            return (0, bit_1.transformUnaryBitOperation)(context, expression, context.transformExpression(expression.operand), lua.SyntaxKind.BitwiseNotOperator);
        default:
            (0, utils_1.assertNever)(expression.operator);
    }
};
exports.transformPrefixUnaryExpression = transformPrefixUnaryExpression;
//# sourceMappingURL=unary-expression.js.map