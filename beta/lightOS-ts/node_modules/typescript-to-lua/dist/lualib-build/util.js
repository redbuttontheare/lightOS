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
exports.isExportTableDeclaration = isExportTableDeclaration;
exports.isExportTable = isExportTable;
exports.isExportTableIndex = isExportTableIndex;
exports.isExportAlias = isExportAlias;
exports.isExportAssignment = isExportAssignment;
exports.isRequire = isRequire;
exports.isImport = isImport;
exports.isExportsReturn = isExportsReturn;
const tstl = __importStar(require(".."));
function isExportTableDeclaration(node) {
    return tstl.isVariableDeclarationStatement(node) && isExportTable(node.left[0]);
}
function isExportTable(node) {
    return tstl.isIdentifier(node) && node.text === "____exports";
}
function isExportTableIndex(node) {
    return tstl.isTableIndexExpression(node) && isExportTable(node.table) && tstl.isStringLiteral(node.index);
}
function isExportAlias(node) {
    return tstl.isVariableDeclarationStatement(node) && node.right !== undefined && isExportTableIndex(node.right[0]);
}
function isExportAssignment(node) {
    return tstl.isAssignmentStatement(node) && isExportTableIndex(node.left[0]);
}
function isRequire(node) {
    return (tstl.isVariableDeclarationStatement(node) &&
        node.right &&
        tstl.isCallExpression(node.right[0]) &&
        tstl.isIdentifier(node.right[0].expression) &&
        node.right[0].expression.text === "require");
}
function isImport(node, importNames) {
    return tstl.isVariableDeclarationStatement(node) && importNames.has(node.left[0].text);
}
function isExportsReturn(node) {
    return (tstl.isReturnStatement(node) &&
        tstl.isIdentifier(node.expressions[0]) &&
        node.expressions[0].text === "____exports");
}
//# sourceMappingURL=util.js.map