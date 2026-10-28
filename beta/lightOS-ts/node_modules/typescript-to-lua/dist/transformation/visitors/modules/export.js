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
exports.transformExportDeclaration = exports.getExported = exports.transformExportAssignment = void 0;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../../LuaAST"));
const utils_1 = require("../../../utils");
const export_1 = require("../../utils/export");
const lua_ast_1 = require("../../utils/lua-ast");
const literal_1 = require("../literal");
const import_1 = require("./import");
const safe_names_1 = require("../../utils/safe-names");
const path = __importStar(require("path"));
const transformExportAssignment = (node, context) => {
    if (!context.resolver.isValueAliasDeclaration(node)) {
        return undefined;
    }
    const exportedValue = context.transformExpression(node.expression);
    // export = [expression];
    // ____exports = [expression];
    if (node.isExportEquals) {
        return lua.createVariableDeclarationStatement((0, lua_ast_1.createExportsIdentifier)(), exportedValue, node);
    }
    else {
        // export default [expression];
        // ____exports.default = [expression];
        return lua.createAssignmentStatement(lua.createTableIndexExpression((0, lua_ast_1.createExportsIdentifier)(), (0, export_1.createDefaultExportStringLiteral)(node)), exportedValue, node);
    }
};
exports.transformExportAssignment = transformExportAssignment;
function transformExportAll(context, node) {
    (0, utils_1.assert)(node.moduleSpecifier);
    const moduleRequire = (0, import_1.createModuleRequire)(context, node.moduleSpecifier);
    // export * as ns from "...";
    // exports.ns = require(...)
    if (node.exportClause && ts.isNamespaceExport(node.exportClause)) {
        const assignToExports = lua.createAssignmentStatement(lua.createTableIndexExpression((0, lua_ast_1.createExportsIdentifier)(), lua.createStringLiteral(node.exportClause.name.text)), moduleRequire);
        return assignToExports;
    }
    // export * from "...";
    // exports all values EXCEPT "default" from "..."
    const result = [];
    // local ____export = require(...)
    const tempModuleIdentifier = lua.createIdentifier("____export");
    const declaration = lua.createVariableDeclarationStatement(tempModuleIdentifier, moduleRequire);
    result.push(declaration);
    // ____exports[____exportKey] = ____exportValue
    const forKey = lua.createIdentifier("____exportKey");
    const forValue = lua.createIdentifier("____exportValue");
    const leftAssignment = lua.createAssignmentStatement(lua.createTableIndexExpression((0, lua_ast_1.createExportsIdentifier)(), forKey), forValue);
    // if key ~= "default" then
    //  -- export the value, do not export "default" values
    // end
    const ifBody = lua.createBlock([leftAssignment]);
    const ifStatement = lua.createIfStatement(lua.createBinaryExpression(lua.cloneIdentifier(forKey), lua.createStringLiteral("default"), lua.SyntaxKind.InequalityOperator), ifBody);
    // for ____exportKey, ____exportValue in ____export do
    //  -- export ____exportValue, unless ____exportKey is "default"
    // end
    const pairsIdentifier = lua.createIdentifier("pairs");
    const forIn = lua.createForInStatement(lua.createBlock([ifStatement]), [lua.cloneIdentifier(forKey), lua.cloneIdentifier(forValue)], [lua.createCallExpression(pairsIdentifier, [lua.cloneIdentifier(tempModuleIdentifier)])]);
    result.push(forIn);
    // Wrap this in a DoStatement to prevent polluting the scope.
    return lua.createDoStatement(result, node);
}
const isDefaultExportSpecifier = (node) => (node.name &&
    ts.isIdentifier(node.name) &&
    ts.identifierToKeywordKind(node.name) === ts.SyntaxKind.DefaultKeyword) ||
    (node.propertyName &&
        ts.isIdentifier(node.propertyName) &&
        ts.identifierToKeywordKind(node.propertyName) === ts.SyntaxKind.DefaultKeyword);
function transformExportSpecifier(context, node) {
    var _a;
    const exportedName = node.name;
    const exportedValue = (_a = node.propertyName) !== null && _a !== void 0 ? _a : node.name;
    let rhs;
    if (ts.isIdentifier(exportedValue)) {
        const exportedSymbol = context.checker.getExportSpecifierLocalTargetSymbol(node);
        rhs = (0, literal_1.createShorthandIdentifier)(context, exportedSymbol, exportedValue);
    }
    else {
        rhs = lua.createStringLiteral(exportedName.text, exportedValue);
    }
    if (isDefaultExportSpecifier(node)) {
        const lhs = (0, export_1.createDefaultExportExpression)(node);
        return lua.createAssignmentStatement(lhs, rhs, node);
    }
    else {
        const exportsTable = (0, lua_ast_1.createExportsIdentifier)();
        const lhs = lua.createTableIndexExpression(exportsTable, lua.createStringLiteral(exportedName.text), exportedName);
        return lua.createAssignmentStatement(lhs, rhs, node);
    }
}
function transformExportSpecifiersFrom(context, statement, moduleSpecifier, exportSpecifiers) {
    var _a;
    const result = [];
    const importPath = ts.isStringLiteral(moduleSpecifier) ? moduleSpecifier.text.replace(/"/g, "") : "module";
    // Create the require statement to extract values.
    // local ____module = require("module")
    const importUniqueName = lua.createIdentifier((0, safe_names_1.createSafeName)(path.basename(importPath)));
    const requireCall = (0, import_1.createModuleRequire)(context, moduleSpecifier);
    result.push(lua.createVariableDeclarationStatement(importUniqueName, requireCall, statement));
    for (const specifier of exportSpecifiers) {
        // Assign to exports table
        const exportsTable = (0, lua_ast_1.createExportsIdentifier)();
        const exportedName = specifier.name;
        const exportedNameTransformed = (0, literal_1.transformPropertyName)(context, exportedName);
        const lhs = lua.createTableIndexExpression(exportsTable, exportedNameTransformed, exportedName);
        const exportedValue = (_a = specifier.propertyName) !== null && _a !== void 0 ? _a : specifier.name;
        const rhs = lua.createTableIndexExpression(lua.cloneIdentifier(importUniqueName), (0, literal_1.transformPropertyName)(context, exportedValue), specifier);
        result.push(lua.createAssignmentStatement(lhs, rhs, specifier));
    }
    return lua.createDoStatement(result, statement);
}
const getExported = (context, exportSpecifiers) => exportSpecifiers.elements.filter(exportSpecifier => context.resolver.isValueAliasDeclaration(exportSpecifier));
exports.getExported = getExported;
const transformExportDeclaration = (node, context) => {
    if (!node.exportClause) {
        // export * from "...";
        return transformExportAll(context, node);
    }
    if (!context.resolver.isValueAliasDeclaration(node)) {
        return undefined;
    }
    if (ts.isNamespaceExport(node.exportClause)) {
        // export * as ns from "...";
        return transformExportAll(context, node);
    }
    const exportSpecifiers = (0, exports.getExported)(context, node.exportClause);
    // export { ... };
    if (!node.moduleSpecifier) {
        return exportSpecifiers.map(exportSpecifier => transformExportSpecifier(context, exportSpecifier));
    }
    // export { ... } from "...";
    return transformExportSpecifiersFrom(context, node, node.moduleSpecifier, exportSpecifiers);
};
exports.transformExportDeclaration = transformExportDeclaration;
//# sourceMappingURL=export.js.map