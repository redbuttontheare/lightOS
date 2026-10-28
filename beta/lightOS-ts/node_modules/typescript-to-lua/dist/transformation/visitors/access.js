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
exports.transformQualifiedName = exports.transformPropertyAccessExpression = exports.transformElementAccessExpression = void 0;
exports.transformElementAccessArgument = transformElementAccessArgument;
exports.transformElementAccessExpressionWithCapture = transformElementAccessExpressionWithCapture;
exports.transformPropertyAccessExpressionWithCapture = transformPropertyAccessExpressionWithCapture;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const builtins_1 = require("../builtins");
const annotations_1 = require("../utils/annotations");
const diagnostics_1 = require("../utils/diagnostics");
const language_extensions_1 = require("../utils/language-extensions");
const lua_ast_1 = require("../utils/lua-ast");
const lualib_1 = require("../utils/lualib");
const typescript_1 = require("../utils/typescript");
const enum_1 = require("./enum");
const expression_list_1 = require("./expression-list");
const call_extension_1 = require("./language-extensions/call-extension");
const multi_1 = require("./language-extensions/multi");
const optional_chaining_1 = require("./optional-chaining");
const typescript_2 = require("typescript");
const identifier_1 = require("./identifier");
const export_1 = require("../utils/export");
function addOneToArrayAccessArgument(context, node, index) {
    const type = context.checker.getTypeAtLocation(node.expression);
    const argumentType = context.checker.getTypeAtLocation(node.argumentExpression);
    if ((0, typescript_1.isArrayType)(context, type) && (0, typescript_1.isNumberType)(context, argumentType)) {
        return (0, lua_ast_1.addToNumericExpression)(index, 1);
    }
    return index;
}
function transformElementAccessArgument(context, node) {
    const index = context.transformExpression(node.argumentExpression);
    return addOneToArrayAccessArgument(context, node, index);
}
const transformElementAccessExpression = (node, context) => transformElementAccessExpressionWithCapture(context, node, undefined).expression;
exports.transformElementAccessExpression = transformElementAccessExpression;
function transformElementAccessExpressionWithCapture(context, node, thisValueCapture) {
    const constEnumValue = (0, enum_1.tryGetConstEnumValue)(context, node);
    if (constEnumValue) {
        return { expression: constEnumValue };
    }
    if (ts.isOptionalChain(node)) {
        return (0, optional_chaining_1.transformOptionalChainWithCapture)(context, node, thisValueCapture);
    }
    const [table, accessExpression] = (0, expression_list_1.transformOrderedExpressions)(context, [node.expression, node.argumentExpression]);
    const type = context.checker.getTypeAtLocation(node.expression);
    const argumentType = context.checker.getTypeAtLocation(node.argumentExpression);
    if ((0, typescript_1.isStringType)(context, type) && (0, typescript_1.isNumberType)(context, argumentType)) {
        // strings are not callable, so ignore thisValueCapture
        return {
            expression: (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.StringAccess, node, table, accessExpression),
        };
    }
    const updatedAccessExpression = addOneToArrayAccessArgument(context, node, accessExpression);
    if ((0, multi_1.isMultiReturnCall)(context, node.expression)) {
        const accessType = context.checker.getTypeAtLocation(node.argumentExpression);
        if (!(0, typescript_1.isNumberType)(context, accessType)) {
            context.diagnostics.push((0, diagnostics_1.invalidMultiReturnAccess)(node));
        }
        const canOmitSelect = ts.isNumericLiteral(node.argumentExpression) && node.argumentExpression.text === "0";
        if (canOmitSelect) {
            // wrapping in parenthesis ensures only the first return value is used
            // https://www.lua.org/manual/5.1/manual.html#2.5
            return { expression: lua.createParenthesizedExpression(table) };
        }
        const selectIdentifier = lua.createIdentifier("select");
        return { expression: lua.createCallExpression(selectIdentifier, [updatedAccessExpression, table]) };
    }
    if (thisValueCapture) {
        const thisValue = (0, optional_chaining_1.captureThisValue)(context, table, thisValueCapture, node.expression);
        return {
            expression: lua.createTableIndexExpression(thisValue, updatedAccessExpression, node),
            thisValue,
        };
    }
    return { expression: lua.createTableIndexExpression(table, updatedAccessExpression, node) };
}
const transformPropertyAccessExpression = (node, context) => transformPropertyAccessExpressionWithCapture(context, node, undefined).expression;
exports.transformPropertyAccessExpression = transformPropertyAccessExpression;
function transformPropertyAccessExpressionWithCapture(context, node, thisValueCapture) {
    const type = context.checker.getTypeAtLocation(node.expression);
    const isOptionalLeft = (0, optional_chaining_1.isOptionalContinuation)(node.expression);
    let property = node.name.text;
    const symbol = context.checker.getSymbolAtLocation(node.name);
    const customName = (0, identifier_1.getCustomNameFromSymbol)(context, symbol);
    if (customName) {
        property = customName;
    }
    const constEnumValue = (0, enum_1.tryGetConstEnumValue)(context, node);
    if (constEnumValue) {
        return { expression: constEnumValue };
    }
    if (ts.isCallExpression(node.expression) && (0, multi_1.returnsMultiType)(context, node.expression)) {
        context.diagnostics.push((0, diagnostics_1.invalidMultiReturnAccess)(node));
    }
    if (ts.isOptionalChain(node)) {
        return (0, optional_chaining_1.transformOptionalChainWithCapture)(context, node, thisValueCapture);
    }
    // Do not output path for member only enums
    const annotations = (0, annotations_1.getTypeAnnotations)(type);
    if (annotations.has(annotations_1.AnnotationKind.CompileMembersOnly)) {
        if (isOptionalLeft) {
            context.diagnostics.push((0, diagnostics_1.unsupportedOptionalCompileMembersOnly)(node));
        }
        if (ts.isPropertyAccessExpression(node.expression)) {
            // in case of ...x.enum.y transform to ...x.y
            const expression = lua.createTableIndexExpression(context.transformExpression(node.expression.expression), lua.createStringLiteral(property), node);
            return { expression };
        }
        else {
            // Check if we need to account for enum being exported int his file
            if ((0, export_1.isSymbolExported)(context, type.symbol) &&
                (0, export_1.getSymbolExportScope)(context, type.symbol) === node.expression.getSourceFile()) {
                return {
                    expression: lua.createTableIndexExpression((0, lua_ast_1.createExportsIdentifier)(), lua.createStringLiteral(property), node),
                };
            }
            else {
                return { expression: lua.createIdentifier(property, node) };
            }
        }
    }
    const builtinResult = (0, builtins_1.transformBuiltinPropertyAccessExpression)(context, node);
    if (builtinResult) {
        // Ignore thisValueCapture.
        // This assumes that nothing returned by builtin property accesses are callable.
        // If this assumption is no longer true, this may need to be updated.
        return { expression: builtinResult };
    }
    if (ts.isIdentifier(node.expression) &&
        node.parent &&
        (!ts.isCallExpression(node.parent) || node.parent.expression !== node)) {
        // Check if this is a method call extension that is not used as a call
        const extensionType = (0, language_extensions_1.getExtensionKindForNode)(context, node);
        if (extensionType && call_extension_1.callExtensions.has(extensionType)) {
            context.diagnostics.push((0, diagnostics_1.invalidCallExtensionUse)(node));
        }
    }
    const table = context.transformExpression(node.expression);
    if (thisValueCapture) {
        const thisValue = (0, optional_chaining_1.captureThisValue)(context, table, thisValueCapture, node.expression);
        const expression = lua.createTableIndexExpression(thisValue, lua.createStringLiteral(property), node);
        return {
            expression,
            thisValue,
        };
    }
    if (node.expression.kind === typescript_2.SyntaxKind.SuperKeyword) {
        const symbol = context.checker.getSymbolAtLocation(node);
        if (symbol && symbol.flags & ts.SymbolFlags.GetAccessor) {
            return {
                expression: (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.DescriptorGet, node, lua.createIdentifier("self"), table, lua.createStringLiteral(property)),
            };
        }
    }
    return { expression: lua.createTableIndexExpression(table, lua.createStringLiteral(property), node) };
}
const transformQualifiedName = (node, context) => {
    const right = lua.createStringLiteral(node.right.text, node.right);
    const left = context.transformExpression(node.left);
    return lua.createTableIndexExpression(left, right, node);
};
exports.transformQualifiedName = transformQualifiedName;
//# sourceMappingURL=access.js.map