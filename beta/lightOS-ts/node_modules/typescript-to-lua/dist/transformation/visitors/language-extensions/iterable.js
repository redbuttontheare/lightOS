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
exports.transformForOfIterableStatement = transformForOfIterableStatement;
exports.transformForOfPairsIterableStatement = transformForOfPairsIterableStatement;
exports.transformForOfPairsKeyIterableStatement = transformForOfPairsKeyIterableStatement;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../../LuaAST"));
const utils_1 = require("../loops/utils");
const variable_declaration_1 = require("../variable-declaration");
const diagnostics_1 = require("../../utils/diagnostics");
const utils_2 = require("../../../utils");
const multi_1 = require("./multi");
function transformForOfMultiIterableStatement(context, statement, block, luaIterator, invalidMultiUseDiagnostic) {
    context.pushPrecedingStatements();
    let identifiers = [];
    if (ts.isVariableDeclarationList(statement.initializer)) {
        // Variables declared in for loop
        // for ${initializer} in ${iterable} do
        const binding = (0, utils_1.getVariableDeclarationBinding)(context, statement.initializer);
        if (ts.isArrayBindingPattern(binding)) {
            identifiers = binding.elements.map(e => (0, variable_declaration_1.transformArrayBindingElement)(context, e));
        }
        else {
            context.diagnostics.push(invalidMultiUseDiagnostic(binding));
        }
    }
    else if (ts.isArrayLiteralExpression(statement.initializer)) {
        // Variables NOT declared in for loop - catch iterator values in temps and assign
        // for ____value0 in ${iterable} do
        //     ${initializer} = ____value0
        identifiers = statement.initializer.elements.map((_, i) => lua.createIdentifier(`____value${i}`));
        if (identifiers.length > 0) {
            block.statements.unshift(lua.createAssignmentStatement(statement.initializer.elements.map(e => (0, utils_2.cast)(context.transformExpression(e), lua.isAssignmentLeftHandSideExpression)), identifiers));
        }
    }
    else {
        context.diagnostics.push(invalidMultiUseDiagnostic(statement.initializer));
    }
    if (identifiers.length === 0) {
        identifiers.push(lua.createAnonymousIdentifier());
    }
    block.statements.unshift(...context.popPrecedingStatements());
    return lua.createForInStatement(block, identifiers, [luaIterator], statement);
}
function transformForOfIterableStatement(context, statement, block) {
    const iteratedExpressionType = context.checker.getTypeAtLocation(statement.expression);
    const iterableType = iteratedExpressionType.isIntersection() &&
        iteratedExpressionType.types.find(t => t.symbol.escapedName === "Iterable");
    const iterableTypeArguments = iterableType === null || iterableType === void 0 ? void 0 : iterableType.typeArguments;
    if (iterableTypeArguments && iterableTypeArguments.length > 0 && (0, multi_1.isMultiReturnType)(iterableTypeArguments[0])) {
        const luaIterator = context.transformExpression(statement.expression);
        return transformForOfMultiIterableStatement(context, statement, block, luaIterator, diagnostics_1.invalidMultiIterableWithoutDestructuring);
    }
    const luaIterator = context.transformExpression(statement.expression);
    const identifier = (0, utils_1.transformForInitializer)(context, statement.initializer, block);
    return lua.createForInStatement(block, [identifier], [luaIterator], statement);
}
function transformForOfPairsIterableStatement(context, statement, block) {
    const pairsCall = lua.createCallExpression(lua.createIdentifier("pairs"), [
        context.transformExpression(statement.expression),
    ]);
    return transformForOfMultiIterableStatement(context, statement, block, pairsCall, diagnostics_1.invalidPairsIterableWithoutDestructuring);
}
function transformForOfPairsKeyIterableStatement(context, statement, block) {
    const pairsCall = lua.createCallExpression(lua.createIdentifier("pairs"), [
        context.transformExpression(statement.expression),
    ]);
    const identifier = (0, utils_1.transformForInitializer)(context, statement.initializer, block);
    return lua.createForInStatement(block, [identifier], [pairsCall], statement);
}
//# sourceMappingURL=iterable.js.map