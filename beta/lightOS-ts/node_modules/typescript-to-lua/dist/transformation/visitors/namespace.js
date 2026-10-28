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
exports.transformModuleDeclaration = void 0;
exports.createModuleLocalName = createModuleLocalName;
exports.createModuleLocalNameIdentifier = createModuleLocalNameIdentifier;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const export_1 = require("../utils/export");
const lua_ast_1 = require("../utils/lua-ast");
const safe_names_1 = require("../utils/safe-names");
const scope_1 = require("../utils/scope");
const symbols_1 = require("../utils/symbols");
const identifier_1 = require("./identifier");
function createModuleLocalName(context, module) {
    if (!ts.isSourceFile(module.parent) && ts.isModuleDeclaration(module.parent)) {
        const parentDeclaration = createModuleLocalName(context, module.parent);
        const name = createModuleLocalNameIdentifier(context, module);
        return lua.createTableIndexExpression(parentDeclaration, lua.createStringLiteral(name.text), module.name);
    }
    return createModuleLocalNameIdentifier(context, module);
}
function createModuleLocalNameIdentifier(context, declaration) {
    const moduleSymbol = context.checker.getSymbolAtLocation(declaration.name);
    if (moduleSymbol !== undefined && (0, safe_names_1.isUnsafeName)(moduleSymbol.name, context.options)) {
        return lua.createIdentifier((0, safe_names_1.createSafeName)(declaration.name.text), declaration.name, moduleSymbol && (0, symbols_1.getSymbolIdOfSymbol)(context, moduleSymbol), declaration.name.text);
    }
    return (0, identifier_1.transformIdentifier)(context, declaration.name);
}
// TODO: Do it based on transform result?
function moduleHasEmittedBody(node) {
    if (node.body) {
        if (ts.isModuleBlock(node.body)) {
            // Ignore if body has no emitted statements
            return node.body.statements.some(s => !ts.isInterfaceDeclaration(s) && !ts.isTypeAliasDeclaration(s));
        }
        else if (ts.isModuleDeclaration(node.body)) {
            return true;
        }
    }
    return false;
}
const transformModuleDeclaration = (node, context) => {
    var _a, _b;
    const currentNamespace = context.currentNamespaces;
    const result = [];
    const symbol = context.checker.getSymbolAtLocation(node.name);
    const hasExports = symbol !== undefined && context.checker.getExportsOfModule(symbol).length > 0;
    const nameIdentifier = (0, identifier_1.transformIdentifier)(context, node.name);
    const exportScope = (0, export_1.getIdentifierExportScope)(context, nameIdentifier);
    // Non-module namespace could be merged if:
    // - is top level
    // - is nested and exported
    const isNonModuleMergeable = !context.isModule && (!currentNamespace || exportScope);
    // This is NOT the first declaration if:
    // - declared as a module before this (ignore interfaces with same name)
    // - declared as a class or function at all (TS requires these to be before module, unless module is empty)
    const isFirstDeclaration = symbol === undefined ||
        (!((_a = symbol.declarations) === null || _a === void 0 ? void 0 : _a.some(d => ts.isClassLike(d) || ts.isFunctionDeclaration(d))) &&
            ts.getOriginalNode(node) === ((_b = symbol.declarations) === null || _b === void 0 ? void 0 : _b.find(ts.isModuleDeclaration)));
    if (isNonModuleMergeable) {
        // 'local NS = NS or {}' or 'exportTable.NS = exportTable.NS or {}'
        const localDeclaration = (0, lua_ast_1.createLocalOrExportedOrGlobalDeclaration)(context, nameIdentifier, lua.createBinaryExpression((0, export_1.addExportToIdentifier)(context, nameIdentifier), lua.createTableExpression(), lua.SyntaxKind.OrOperator));
        result.push(...localDeclaration);
    }
    else if (isFirstDeclaration) {
        // local NS = {} or exportTable.NS = {}
        const localDeclaration = (0, lua_ast_1.createLocalOrExportedOrGlobalDeclaration)(context, nameIdentifier, lua.createTableExpression());
        result.push(...localDeclaration);
    }
    if ((isNonModuleMergeable || isFirstDeclaration) && exportScope && hasExports && moduleHasEmittedBody(node)) {
        // local NS = exportTable.NS
        const localDeclaration = (0, lua_ast_1.createHoistableVariableDeclarationStatement)(context, createModuleLocalNameIdentifier(context, node), (0, export_1.createExportedIdentifier)(context, nameIdentifier, exportScope));
        result.push(localDeclaration);
    }
    // Set current namespace for nested NS
    // Keep previous namespace to reset after block transpilation
    context.currentNamespaces = node;
    // Transform moduleblock to block and visit it
    if (moduleHasEmittedBody(node)) {
        context.pushScope(scope_1.ScopeType.Block, node);
        const statements = (0, scope_1.performHoisting)(context, context.transformStatements(ts.isModuleBlock(node.body) ? node.body.statements : node.body));
        context.popScope();
        result.push(lua.createDoStatement(statements));
    }
    context.currentNamespaces = currentNamespace;
    return result;
};
exports.transformModuleDeclaration = transformModuleDeclaration;
//# sourceMappingURL=namespace.js.map