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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasExportEquals = hasExportEquals;
exports.findFirstNodeAbove = findFirstNodeAbove;
exports.findFirstNonOuterParent = findFirstNonOuterParent;
exports.expressionResultIsUsed = expressionResultIsUsed;
exports.getFirstDeclarationInFile = getFirstDeclarationInFile;
exports.isStandardLibraryDeclaration = isStandardLibraryDeclaration;
exports.isStandardLibraryType = isStandardLibraryType;
exports.hasStandardLibrarySignature = hasStandardLibrarySignature;
exports.inferAssignedType = inferAssignedType;
exports.getAllCallSignatures = getAllCallSignatures;
exports.isExpressionWithEvaluationEffect = isExpressionWithEvaluationEffect;
exports.getFunctionTypeForCall = getFunctionTypeForCall;
exports.isConstIdentifier = isConstIdentifier;
const ts = __importStar(require("typescript"));
__exportStar(require("./nodes"), exports);
__exportStar(require("./types"), exports);
// TODO: Move to separate files?
function hasExportEquals(sourceFile) {
    return sourceFile.statements.some(node => ts.isExportAssignment(node) && node.isExportEquals);
}
/**
 * Search up until finding a node satisfying the callback
 */
function findFirstNodeAbove(node, callback) {
    // Synthetic nodes (created by pre-transformers like usingTransformer) may have an unset .parent.
    // Fall back to ts.getOriginalNode so we can still walk the source-parsed parent chain.
    let current = ts.getOriginalNode(node);
    while (current.parent) {
        if (callback(current.parent)) {
            return current.parent;
        }
        else {
            current = ts.getOriginalNode(current.parent);
        }
    }
}
function findFirstNonOuterParent(node) {
    let current = ts.getOriginalNode(node).parent;
    while (ts.isOuterExpression(current)) {
        current = ts.getOriginalNode(current).parent;
    }
    return current;
}
function expressionResultIsUsed(node) {
    return !ts.isExpressionStatement(findFirstNonOuterParent(node));
}
function getFirstDeclarationInFile(symbol, sourceFile) {
    var _a, _b;
    const originalSourceFile = (_a = ts.getParseTreeNode(sourceFile)) !== null && _a !== void 0 ? _a : sourceFile;
    const declarations = ((_b = symbol.getDeclarations()) !== null && _b !== void 0 ? _b : []).filter(d => d.getSourceFile() === originalSourceFile);
    return declarations.length > 0 ? declarations.reduce((p, c) => (p.pos < c.pos ? p : c)) : undefined;
}
function isStandardLibraryDeclaration(context, declaration) {
    var _a;
    const parseTreeNode = (_a = ts.getParseTreeNode(declaration)) !== null && _a !== void 0 ? _a : declaration;
    const sourceFile = parseTreeNode.getSourceFile();
    if (!sourceFile) {
        return false;
    }
    return context.program.isSourceFileDefaultLibrary(sourceFile);
}
function isStandardLibraryType(context, type, name) {
    const symbol = type.getSymbol();
    if (!symbol || (name ? symbol.name !== name : symbol.name === "__type")) {
        return false;
    }
    // Assume to be lib function if no valueDeclaration exists
    const declaration = symbol.valueDeclaration;
    if (!declaration) {
        return true;
    }
    return isStandardLibraryDeclaration(context, declaration);
}
function hasStandardLibrarySignature(context, callExpression) {
    const signature = context.checker.getResolvedSignature(callExpression);
    return (signature === null || signature === void 0 ? void 0 : signature.declaration) ? isStandardLibraryDeclaration(context, signature.declaration) : false;
}
function inferAssignedType(context, expression) {
    var _a;
    return (_a = context.checker.getContextualType(expression)) !== null && _a !== void 0 ? _a : context.checker.getTypeAtLocation(expression);
}
function getAllCallSignatures(type) {
    return type.isUnion() ? type.types.flatMap(getAllCallSignatures) : type.getCallSignatures();
}
// Returns true for expressions that may have effects when evaluated
function isExpressionWithEvaluationEffect(node) {
    return !(ts.isLiteralExpression(node) || ts.isIdentifier(node) || node.kind === ts.SyntaxKind.ThisKeyword);
}
function getFunctionTypeForCall(context, node) {
    const signature = context.checker.getResolvedSignature(node);
    if (!(signature === null || signature === void 0 ? void 0 : signature.declaration)) {
        return;
    }
    const typeDeclaration = findFirstNodeAbove(signature.declaration, ts.isTypeAliasDeclaration);
    if (!typeDeclaration) {
        return;
    }
    return context.checker.getTypeFromTypeNode(typeDeclaration.type);
}
function isConstIdentifier(context, node) {
    let identifier = node;
    if (ts.isComputedPropertyName(identifier)) {
        identifier = identifier.expression;
    }
    if (!ts.isIdentifier(identifier)) {
        return false;
    }
    const symbol = context.checker.getSymbolAtLocation(identifier);
    if (!(symbol === null || symbol === void 0 ? void 0 : symbol.declarations)) {
        return false;
    }
    return symbol.declarations.some(d => ts.isVariableDeclarationList(d.parent) && (d.parent.flags & ts.NodeFlags.Const) !== 0);
}
//# sourceMappingURL=index.js.map