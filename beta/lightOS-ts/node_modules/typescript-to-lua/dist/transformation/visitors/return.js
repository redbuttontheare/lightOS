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
exports.transformReturnStatement = void 0;
exports.transformExpressionBodyToReturnStatement = transformExpressionBodyToReturnStatement;
exports.createReturnStatement = createReturnStatement;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const assignment_validation_1 = require("../utils/assignment-validation");
const lua_ast_1 = require("../utils/lua-ast");
const scope_1 = require("../utils/scope");
const call_1 = require("./call");
const multi_1 = require("./language-extensions/multi");
const diagnostics_1 = require("../utils/diagnostics");
const typescript_1 = require("../utils/typescript");
function transformExpressionsInReturn(context, node) {
    const expressionType = context.checker.getTypeAtLocation(node);
    // skip type assertions
    // don't skip parenthesis as it may arise confusion with lua behavior (where parenthesis are significant)
    const innerNode = ts.skipOuterExpressions(node, ts.OuterExpressionKinds.Assertions);
    if (ts.isCallExpression(innerNode)) {
        // $multi(...)
        if ((0, multi_1.isMultiFunctionCall)(context, innerNode)) {
            // Don't allow $multi to be implicitly cast to something other than LuaMultiReturn
            const type = context.checker.getContextualType(node);
            if (type && !(0, multi_1.canBeMultiReturnType)(type)) {
                context.diagnostics.push((0, diagnostics_1.invalidMultiFunctionReturnType)(innerNode));
            }
            return (0, call_1.transformArguments)(context, innerNode.arguments);
        }
    }
    else if ((0, multi_1.isInMultiReturnFunction)(context, innerNode) && (0, multi_1.isMultiReturnType)(expressionType)) {
        // Unpack objects typed as LuaMultiReturn
        return [(0, lua_ast_1.createUnpackCall)(context, context.transformExpression(innerNode), innerNode)];
    }
    return [context.transformExpression(node)];
}
function transformExpressionBodyToReturnStatement(context, node) {
    const expressions = transformExpressionsInReturn(context, node);
    return createReturnStatement(context, expressions, node);
}
function transformReturnExpressionForTryCatch(context, node) {
    const innerNode = ts.skipOuterExpressions(node, ts.OuterExpressionKinds.Assertions);
    if (ts.isCallExpression(innerNode)) {
        if ((0, multi_1.isMultiFunctionCall)(context, innerNode)) {
            const type = context.checker.getContextualType(node);
            if (type && !(0, multi_1.canBeMultiReturnType)(type)) {
                context.diagnostics.push((0, diagnostics_1.invalidMultiFunctionReturnType)(innerNode));
            }
            return (0, lua_ast_1.wrapInTable)(...(0, call_1.transformArguments)(context, innerNode.arguments));
        }
        if ((0, multi_1.returnsMultiType)(context, innerNode) && !(0, multi_1.shouldMultiReturnCallBeWrapped)(context, innerNode)) {
            return (0, lua_ast_1.wrapInTable)(context.transformExpression(node));
        }
    }
    return context.transformExpression(node);
}
const transformReturnStatement = (statement, context) => {
    const asyncTryScope = (0, typescript_1.isInAsyncFunction)(statement) ? (0, scope_1.findAsyncTryScopeInStack)(context) : undefined;
    if (statement.expression) {
        const expressionType = context.checker.getTypeAtLocation(statement.expression);
        const returnType = context.checker.getContextualType(statement.expression);
        if (returnType) {
            (0, assignment_validation_1.validateAssignment)(context, statement, expressionType, returnType);
        }
    }
    if (asyncTryScope) {
        asyncTryScope.asyncTryHasReturn = true;
        const stmts = [
            lua.createAssignmentStatement(lua.createIdentifier("____hasReturned"), lua.createBooleanLiteral(true), statement),
        ];
        if (statement.expression) {
            const returnValue = transformReturnExpressionForTryCatch(context, statement.expression);
            stmts.push(lua.createAssignmentStatement(lua.createIdentifier("____returnValue"), returnValue, statement));
        }
        stmts.push(lua.createReturnStatement([], statement));
        return stmts;
    }
    let results;
    if (!statement.expression) {
        results = [];
    }
    else if (isInTryCatch(context)) {
        results = [transformReturnExpressionForTryCatch(context, statement.expression)];
    }
    else {
        results = transformExpressionsInReturn(context, statement.expression);
    }
    return createReturnStatement(context, results, statement);
};
exports.transformReturnStatement = transformReturnStatement;
function createReturnStatement(context, values, node) {
    if ((0, typescript_1.isInAsyncFunction)(node)) {
        return lua.createReturnStatement([
            lua.createCallExpression(lua.createIdentifier("____awaiter_resolve"), [lua.createNilLiteral(), ...values]),
        ]);
    }
    if (isInTryCatch(context)) {
        // Bubble up explicit return flag and check if we're inside a try/catch block
        values = [lua.createBooleanLiteral(true), ...values];
    }
    return lua.createReturnStatement(values, node);
}
function isInTryCatch(context) {
    // Check if context is in a try or catch
    let insideTryCatch = false;
    for (const scope of (0, scope_1.walkScopesUp)(context)) {
        scope.functionReturned = true;
        if (scope.type === scope_1.ScopeType.Function) {
            break;
        }
        insideTryCatch = insideTryCatch || scope.type === scope_1.ScopeType.Try || scope.type === scope_1.ScopeType.Catch;
    }
    return insideTryCatch;
}
//# sourceMappingURL=return.js.map