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
exports.transformSourceFileNode = void 0;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const utils_1 = require("../../utils");
const lua_ast_1 = require("../utils/lua-ast");
const preceding_statements_1 = require("../utils/preceding-statements");
const scope_1 = require("../utils/scope");
const typescript_1 = require("../utils/typescript");
const transformSourceFileNode = (node, context) => {
    var _a, _b;
    let statements = [];
    if (node.flags & ts.NodeFlags.JsonFile) {
        const [statement] = node.statements;
        if (statement) {
            (0, utils_1.assert)(ts.isExpressionStatement(statement));
            const { precedingStatements, result: expression } = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => context.transformExpression(statement.expression));
            statements.push(...precedingStatements);
            statements.push(lua.createReturnStatement([expression]));
        }
        else {
            const errorCall = lua.createCallExpression(lua.createIdentifier("error"), [
                lua.createStringLiteral("Unexpected end of JSON input"),
            ]);
            statements.push(lua.createExpressionStatement(errorCall));
        }
    }
    else {
        context.pushScope(scope_1.ScopeType.File, node);
        statements = (0, scope_1.performHoisting)(context, context.transformStatements(node.statements));
        context.popScope();
        if (context.isModule) {
            // If export equals was not used. Create the exports table.
            // local ____exports = {}
            if (!(0, typescript_1.hasExportEquals)(node)) {
                statements.unshift(lua.createVariableDeclarationStatement((0, lua_ast_1.createExportsIdentifier)(), lua.createTableExpression()));
            }
            // return ____exports
            statements.push(lua.createReturnStatement([(0, lua_ast_1.createExportsIdentifier)()]));
        }
    }
    const trivia = (_b = (_a = node.getFullText().match(/^#!.*\r?\n/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "";
    return lua.createFile(statements, context.usedLuaLibFeatures, trivia, node);
};
exports.transformSourceFileNode = transformSourceFileNode;
//# sourceMappingURL=sourceFile.js.map