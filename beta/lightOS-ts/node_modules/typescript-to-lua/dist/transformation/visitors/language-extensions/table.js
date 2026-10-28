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
exports.tableExtensionTransformers = exports.tableNewExtensions = void 0;
exports.isTableNewCall = isTableNewCall;
const lua = __importStar(require("../../../LuaAST"));
const language_extensions_1 = require("../../utils/language-extensions");
const expression_list_1 = require("../expression-list");
function isTableNewCall(context, node) {
    return (0, language_extensions_1.getExtensionKindForNode)(context, node.expression) === language_extensions_1.ExtensionKind.TableNewType;
}
exports.tableNewExtensions = [language_extensions_1.ExtensionKind.TableNewType];
exports.tableExtensionTransformers = {
    [language_extensions_1.ExtensionKind.TableDeleteType]: transformTableDeleteExpression,
    [language_extensions_1.ExtensionKind.TableDeleteMethodType]: transformTableDeleteExpression,
    [language_extensions_1.ExtensionKind.TableGetType]: transformTableGetExpression,
    [language_extensions_1.ExtensionKind.TableGetMethodType]: transformTableGetExpression,
    [language_extensions_1.ExtensionKind.TableHasType]: transformTableHasExpression,
    [language_extensions_1.ExtensionKind.TableHasMethodType]: transformTableHasExpression,
    [language_extensions_1.ExtensionKind.TableSetType]: transformTableSetExpression,
    [language_extensions_1.ExtensionKind.TableSetMethodType]: transformTableSetExpression,
    [language_extensions_1.ExtensionKind.TableAddKeyType]: transformTableAddKeyExpression,
    [language_extensions_1.ExtensionKind.TableAddKeyMethodType]: transformTableAddKeyExpression,
    [language_extensions_1.ExtensionKind.TableIsEmptyType]: transformTableIsEmptyExpression,
    [language_extensions_1.ExtensionKind.TableIsEmptyMethodType]: transformTableIsEmptyExpression,
};
function transformTableDeleteExpression(context, node, extensionKind) {
    const args = (0, language_extensions_1.getBinaryCallExtensionArgs)(context, node, extensionKind);
    if (!args) {
        return lua.createNilLiteral();
    }
    const [table, key] = (0, expression_list_1.transformOrderedExpressions)(context, args);
    // arg0[arg1] = nil
    context.addPrecedingStatements(lua.createAssignmentStatement(lua.createTableIndexExpression(table, key), lua.createNilLiteral(), node));
    return lua.createBooleanLiteral(true);
}
function transformTableGetExpression(context, node, extensionKind) {
    const args = (0, language_extensions_1.getBinaryCallExtensionArgs)(context, node, extensionKind);
    if (!args) {
        return lua.createNilLiteral();
    }
    const [table, key] = (0, expression_list_1.transformOrderedExpressions)(context, args);
    // arg0[arg1]
    return lua.createTableIndexExpression(table, key, node);
}
function transformTableHasExpression(context, node, extensionKind) {
    const args = (0, language_extensions_1.getBinaryCallExtensionArgs)(context, node, extensionKind);
    if (!args) {
        return lua.createNilLiteral();
    }
    const [table, key] = (0, expression_list_1.transformOrderedExpressions)(context, args);
    // arg0[arg1]
    const tableIndexExpression = lua.createTableIndexExpression(table, key);
    // arg0[arg1] ~= nil
    return lua.createBinaryExpression(tableIndexExpression, lua.createNilLiteral(), lua.SyntaxKind.InequalityOperator, node);
}
function transformTableSetExpression(context, node, extensionKind) {
    const args = (0, language_extensions_1.getNaryCallExtensionArgs)(context, node, extensionKind, 3);
    if (!args) {
        return lua.createNilLiteral();
    }
    const [table, key, value] = (0, expression_list_1.transformOrderedExpressions)(context, args);
    // arg0[arg1] = arg2
    context.addPrecedingStatements(lua.createAssignmentStatement(lua.createTableIndexExpression(table, key), value, node));
    return lua.createNilLiteral();
}
function transformTableAddKeyExpression(context, node, extensionKind) {
    const args = (0, language_extensions_1.getNaryCallExtensionArgs)(context, node, extensionKind, 2);
    if (!args) {
        return lua.createNilLiteral();
    }
    const [table, key] = (0, expression_list_1.transformOrderedExpressions)(context, args);
    // arg0[arg1] = true
    context.addPrecedingStatements(lua.createAssignmentStatement(lua.createTableIndexExpression(table, key), lua.createBooleanLiteral(true), node));
    return lua.createNilLiteral();
}
function transformTableIsEmptyExpression(context, node, extensionKind) {
    const args = (0, language_extensions_1.getUnaryCallExtensionArg)(context, node, extensionKind);
    if (!args) {
        return lua.createNilLiteral();
    }
    const table = context.transformExpression(args);
    // next(arg0) == nil
    return lua.createBinaryExpression(lua.createCallExpression(lua.createIdentifier("next"), [table], node), lua.createNilLiteral(), lua.SyntaxKind.EqualityOperator, node);
}
//# sourceMappingURL=table.js.map