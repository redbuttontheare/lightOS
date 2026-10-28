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
exports.transformEnumDeclaration = void 0;
exports.tryGetConstEnumValue = tryGetConstEnumValue;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const annotations_1 = require("../utils/annotations");
const export_1 = require("../utils/export");
const lua_ast_1 = require("../utils/lua-ast");
const typescript_1 = require("../utils/typescript");
const identifier_1 = require("./identifier");
const literal_1 = require("./literal");
function tryGetConstEnumValue(context, node) {
    const value = context.checker.getConstantValue(node);
    if (typeof value === "string") {
        return lua.createStringLiteral(value, node);
    }
    else if (typeof value === "number") {
        return lua.createNumericLiteral(value, node);
    }
}
const transformEnumDeclaration = (node, context) => {
    if (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Const && !context.options.preserveConstEnums) {
        return undefined;
    }
    const type = context.checker.getTypeAtLocation(node);
    const membersOnly = (0, annotations_1.getTypeAnnotations)(type).has(annotations_1.AnnotationKind.CompileMembersOnly);
    const result = [];
    if (!membersOnly && (0, typescript_1.isFirstDeclaration)(context, node)) {
        const name = (0, identifier_1.transformIdentifier)(context, node.name);
        const table = lua.createBinaryExpression((0, export_1.addExportToIdentifier)(context, name), lua.createTableExpression(), lua.SyntaxKind.OrOperator);
        result.push(...(0, lua_ast_1.createLocalOrExportedOrGlobalDeclaration)(context, name, table, node));
    }
    const enumReference = context.transformExpression(node.name);
    for (const member of node.members) {
        const memberName = (0, literal_1.transformPropertyName)(context, member.name);
        let valueExpression;
        const constEnumValue = tryGetConstEnumValue(context, member);
        if (constEnumValue) {
            valueExpression = constEnumValue;
        }
        else if (member.initializer) {
            if (ts.isIdentifier(member.initializer)) {
                const symbol = context.checker.getSymbolAtLocation(member.initializer);
                if ((symbol === null || symbol === void 0 ? void 0 : symbol.valueDeclaration) &&
                    ts.isEnumMember(symbol.valueDeclaration) &&
                    symbol.valueDeclaration.parent === node) {
                    const otherMemberName = (0, literal_1.transformPropertyName)(context, symbol.valueDeclaration.name);
                    valueExpression = lua.createTableIndexExpression(enumReference, otherMemberName);
                }
            }
            valueExpression !== null && valueExpression !== void 0 ? valueExpression : (valueExpression = context.transformExpression(member.initializer));
        }
        else {
            valueExpression = lua.createNilLiteral();
        }
        if (membersOnly) {
            const enumSymbol = context.checker.getSymbolAtLocation(node.name);
            const exportScope = enumSymbol ? (0, export_1.getSymbolExportScope)(context, enumSymbol) : undefined;
            result.push(...(0, lua_ast_1.createLocalOrExportedOrGlobalDeclaration)(context, lua.isIdentifier(memberName)
                ? memberName
                : lua.createIdentifier(member.name.getText(), member.name), valueExpression, node, exportScope));
        }
        else {
            const memberAccessor = lua.createTableIndexExpression(enumReference, memberName);
            result.push(lua.createAssignmentStatement(memberAccessor, valueExpression, member));
            if (!lua.isStringLiteral(valueExpression) && !lua.isNilLiteral(valueExpression)) {
                const reverseMemberAccessor = lua.createTableIndexExpression(enumReference, memberAccessor);
                result.push(lua.createAssignmentStatement(reverseMemberAccessor, memberName, member));
            }
        }
    }
    return result;
};
exports.transformEnumDeclaration = transformEnumDeclaration;
//# sourceMappingURL=enum.js.map