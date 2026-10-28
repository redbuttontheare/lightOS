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
exports.isPrivateNode = isPrivateNode;
exports.isStaticNode = isStaticNode;
exports.getExtendsClause = getExtendsClause;
exports.getExtendedNode = getExtendedNode;
exports.getExtendedType = getExtendedType;
const ts = __importStar(require("typescript"));
function isPrivateNode(node) {
    var _a;
    return ((_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) === true;
}
function isStaticNode(node) {
    var _a;
    return ((_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.some(m => m.kind === ts.SyntaxKind.StaticKeyword)) === true;
}
function getExtendsClause(node) {
    var _a;
    return (_a = node.heritageClauses) === null || _a === void 0 ? void 0 : _a.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword);
}
function getExtendedNode(node) {
    const extendsClause = getExtendsClause(node);
    if (!extendsClause)
        return;
    return extendsClause.types[0];
}
function getExtendedType(context, node) {
    const extendedNode = getExtendedNode(node);
    return extendedNode && context.checker.getTypeAtLocation(extendedNode);
}
//# sourceMappingURL=utils.js.map