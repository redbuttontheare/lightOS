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
exports.isMultiReturnType = isMultiReturnType;
exports.canBeMultiReturnType = canBeMultiReturnType;
exports.isMultiFunctionCall = isMultiFunctionCall;
exports.returnsMultiType = returnsMultiType;
exports.isMultiReturnCall = isMultiReturnCall;
exports.isMultiFunctionNode = isMultiFunctionNode;
exports.isInMultiReturnFunction = isInMultiReturnFunction;
exports.shouldMultiReturnCallBeWrapped = shouldMultiReturnCallBeWrapped;
const ts = __importStar(require("typescript"));
const extensions = __importStar(require("../../utils/language-extensions"));
const language_extensions_1 = require("../../utils/language-extensions");
const typescript_1 = require("../../utils/typescript");
const multiReturnExtensionName = "__tstlMultiReturn";
function isMultiReturnType(type) {
    return type.getProperty(multiReturnExtensionName) !== undefined;
}
function canBeMultiReturnType(type) {
    return ((type.flags & ts.TypeFlags.Any) !== 0 ||
        isMultiReturnType(type) ||
        (type.isUnion() && type.types.some(t => canBeMultiReturnType(t))));
}
function isMultiFunctionCall(context, expression) {
    return isMultiFunctionNode(context, expression.expression);
}
function returnsMultiType(context, node) {
    const signature = context.checker.getResolvedSignature(node);
    const type = signature === null || signature === void 0 ? void 0 : signature.getReturnType();
    return type ? isMultiReturnType(type) : false;
}
function isMultiReturnCall(context, expression) {
    return ts.isCallExpression(expression) && returnsMultiType(context, expression);
}
function isMultiFunctionNode(context, node) {
    return (ts.isIdentifier(node) &&
        node.text === "$multi" &&
        (0, language_extensions_1.getExtensionKindForNode)(context, node) === extensions.ExtensionKind.MultiFunction);
}
function isInMultiReturnFunction(context, node) {
    const declaration = (0, typescript_1.findFirstNodeAbove)(node, ts.isFunctionLike);
    if (!declaration) {
        return false;
    }
    const signature = context.checker.getSignatureFromDeclaration(declaration);
    const type = signature === null || signature === void 0 ? void 0 : signature.getReturnType();
    return type ? isMultiReturnType(type) : false;
}
function shouldMultiReturnCallBeWrapped(context, node) {
    if (!returnsMultiType(context, node)) {
        return false;
    }
    const parent = (0, typescript_1.findFirstNonOuterParent)(node);
    // Variable declaration with destructuring
    if (ts.isVariableDeclaration(parent) && ts.isArrayBindingPattern(parent.name)) {
        return false;
    }
    // Variable assignment with destructuring
    if (ts.isBinaryExpression(parent) &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isArrayLiteralExpression(parent.left)) {
        return false;
    }
    // Spread operator
    if (ts.isSpreadElement(parent)) {
        return false;
    }
    // Stand-alone expression
    if (ts.isExpressionStatement(parent)) {
        return false;
    }
    // Forwarded multi-return call
    if ((ts.isReturnStatement(parent) || ts.isArrowFunction(parent)) && // Body-less arrow func
        isInMultiReturnFunction(context, node)) {
        return false;
    }
    // Element access expression 'foo()[0]' will be optimized using 'select'
    if (ts.isElementAccessExpression(parent)) {
        return false;
    }
    // LuaIterable in for...of
    if (ts.isForOfStatement(parent) &&
        (0, language_extensions_1.getIterableExtensionKindForNode)(context, node) === language_extensions_1.IterableExtensionKind.Iterable) {
        return false;
    }
    return true;
}
//# sourceMappingURL=multi.js.map