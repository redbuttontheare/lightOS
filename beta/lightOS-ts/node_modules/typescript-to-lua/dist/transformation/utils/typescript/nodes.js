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
exports.isAssignmentPattern = isAssignmentPattern;
exports.isDestructuringAssignment = isDestructuringAssignment;
exports.isAmbientNode = isAmbientNode;
exports.isInDestructingAssignment = isInDestructingAssignment;
exports.isInAsyncFunction = isInAsyncFunction;
exports.isInGeneratorFunction = isInGeneratorFunction;
exports.getSymbolOfNode = getSymbolOfNode;
exports.isFirstDeclaration = isFirstDeclaration;
const ts = __importStar(require("typescript"));
const _1 = require(".");
function isAssignmentPattern(node) {
    return ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node);
}
function isDestructuringAssignment(node) {
    return (ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        isAssignmentPattern(node.left));
}
function isAmbientNode(node) {
    return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Ambient) !== 0;
}
function isInDestructingAssignment(node) {
    return (node.parent &&
        ((ts.isVariableDeclaration(node.parent) && ts.isArrayBindingPattern(node.parent.name)) ||
            (ts.isBinaryExpression(node.parent) && ts.isArrayLiteralExpression(node.parent.left))));
}
function isInAsyncFunction(node) {
    var _a, _b;
    // Check if node is in function declaration with `async`
    const declaration = (0, _1.findFirstNodeAbove)(node, ts.isFunctionLike);
    if (!declaration) {
        return false;
    }
    if (ts.canHaveModifiers(declaration)) {
        return (_b = (_a = ts.getModifiers(declaration)) === null || _a === void 0 ? void 0 : _a.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) !== null && _b !== void 0 ? _b : false;
    }
    else {
        return false;
    }
}
function isInGeneratorFunction(node) {
    // Check if node is in function declaration with `async`
    const declaration = (0, _1.findFirstNodeAbove)(node, ts.isFunctionDeclaration);
    if (!declaration) {
        return false;
    }
    return declaration.asteriskToken !== undefined;
}
/**
 * Quite hacky, avoid unless absolutely necessary!
 */
function getSymbolOfNode(context, node) {
    var _a;
    return (_a = node.symbol) !== null && _a !== void 0 ? _a : context.checker.getSymbolAtLocation(node);
}
function isFirstDeclaration(context, node) {
    const symbol = getSymbolOfNode(context, node);
    return symbol ? symbol.valueDeclaration === node : true;
}
//# sourceMappingURL=nodes.js.map