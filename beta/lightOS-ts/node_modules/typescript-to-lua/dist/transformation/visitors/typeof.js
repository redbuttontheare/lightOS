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
exports.transformTypeOfExpression = void 0;
exports.transformTypeOfBinaryExpression = transformTypeOfBinaryExpression;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const LuaLib_1 = require("../../LuaLib");
const lualib_1 = require("../utils/lualib");
const binary_expression_1 = require("./binary-expression");
const transformTypeOfExpression = (node, context) => {
    const innerExpression = context.transformExpression(node.expression);
    return (0, lualib_1.transformLuaLibFunction)(context, LuaLib_1.LuaLibFeature.TypeOf, node, innerExpression);
};
exports.transformTypeOfExpression = transformTypeOfExpression;
function transformTypeOfBinaryExpression(context, node) {
    const operator = node.operatorToken.kind;
    if (operator !== ts.SyntaxKind.EqualsEqualsToken &&
        operator !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
        operator !== ts.SyntaxKind.ExclamationEqualsToken &&
        operator !== ts.SyntaxKind.ExclamationEqualsEqualsToken) {
        return;
    }
    let literalExpression;
    let typeOfExpression;
    if (ts.isTypeOfExpression(node.left)) {
        typeOfExpression = node.left;
        literalExpression = node.right;
    }
    else if (ts.isTypeOfExpression(node.right)) {
        typeOfExpression = node.right;
        literalExpression = node.left;
    }
    else {
        return;
    }
    const comparedExpression = context.transformExpression(literalExpression);
    if (!lua.isStringLiteral(comparedExpression))
        return;
    if (comparedExpression.value === "object") {
        comparedExpression.value = "table";
    }
    else if (comparedExpression.value === "undefined") {
        comparedExpression.value = "nil";
    }
    const innerExpression = context.transformExpression(typeOfExpression.expression);
    const typeCall = lua.createCallExpression(lua.createIdentifier("type"), [innerExpression], typeOfExpression);
    const { precedingStatements, result } = (0, binary_expression_1.transformBinaryOperation)(context, typeCall, comparedExpression, [], operator, node);
    context.addPrecedingStatements(precedingStatements);
    return result;
}
//# sourceMappingURL=typeof.js.map