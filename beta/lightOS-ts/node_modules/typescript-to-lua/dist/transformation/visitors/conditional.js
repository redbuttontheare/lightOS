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
exports.transformConditionalExpression = void 0;
exports.transformIfStatement = transformIfStatement;
exports.checkOnlyTruthyCondition = checkOnlyTruthyCondition;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const preceding_statements_1 = require("../utils/preceding-statements");
const scope_1 = require("../utils/scope");
const block_1 = require("./block");
const typescript_1 = require("../utils/typescript");
const diagnostics_1 = require("../utils/diagnostics");
const CompilerOptions_1 = require("../../CompilerOptions");
function transformProtectedConditionalExpression(context, expression, condition, whenTrue, whenFalse) {
    const tempVar = context.createTempNameForNode(expression.condition);
    const trueStatements = whenTrue.precedingStatements.concat(lua.createAssignmentStatement(lua.cloneIdentifier(tempVar), whenTrue.result, expression.whenTrue));
    const falseStatements = whenFalse.precedingStatements.concat(lua.createAssignmentStatement(lua.cloneIdentifier(tempVar), whenFalse.result, expression.whenFalse));
    context.addPrecedingStatements([
        lua.createVariableDeclarationStatement(tempVar, undefined, expression.condition),
        ...condition.precedingStatements,
        lua.createIfStatement(condition.result, lua.createBlock(trueStatements, expression.whenTrue), lua.createBlock(falseStatements, expression.whenFalse), expression),
    ]);
    return lua.cloneIdentifier(tempVar);
}
const transformConditionalExpression = (expression, context) => {
    if (context.luaTarget === CompilerOptions_1.LuaTarget.Luau) {
        // Luau's ternary operator doesn't have these issues
        return lua.createConditionalExpression(context.transformExpression(expression.condition), context.transformExpression(expression.whenTrue), context.transformExpression(expression.whenFalse), expression);
    }
    // Check if we need to add diagnostic about Lua truthiness
    checkOnlyTruthyCondition(expression.condition, context);
    const condition = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => context.transformExpression(expression.condition));
    const whenTrue = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => context.transformExpression(expression.whenTrue));
    const whenFalse = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => context.transformExpression(expression.whenFalse));
    if (whenTrue.precedingStatements.length > 0 ||
        whenFalse.precedingStatements.length > 0 ||
        (0, typescript_1.canBeFalsy)(context, context.checker.getTypeAtLocation(expression.whenTrue))) {
        return transformProtectedConditionalExpression(context, expression, condition, whenTrue, whenFalse);
    }
    // condition and v1 or v2
    context.addPrecedingStatements(condition.precedingStatements);
    const conditionAnd = lua.createBinaryExpression(condition.result, whenTrue.result, lua.SyntaxKind.AndOperator);
    return lua.createBinaryExpression(conditionAnd, whenFalse.result, lua.SyntaxKind.OrOperator, expression);
};
exports.transformConditionalExpression = transformConditionalExpression;
function transformIfStatement(statement, context) {
    context.pushScope(scope_1.ScopeType.Conditional, statement);
    // Check if we need to add diagnostic about Lua truthiness
    checkOnlyTruthyCondition(statement.expression, context);
    const condition = context.transformExpression(statement.expression);
    const statements = (0, scope_1.performHoisting)(context, (0, block_1.transformBlockOrStatement)(context, statement.thenStatement));
    context.popScope();
    const ifBlock = lua.createBlock(statements);
    if (statement.elseStatement) {
        if (ts.isIfStatement(statement.elseStatement)) {
            const tsElseStatement = statement.elseStatement;
            const { precedingStatements, result: elseStatement } = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => transformIfStatement(tsElseStatement, context));
            // If else-if condition generates preceding statements, we can't use elseif, we have to break it down:
            // if conditionA then
            //     ...
            // else
            //     conditionB's preceding statements
            //     if conditionB then
            //     end
            // end
            if (precedingStatements.length > 0) {
                const elseBlock = lua.createBlock([...precedingStatements, elseStatement]);
                return lua.createIfStatement(condition, ifBlock, elseBlock);
            }
            else {
                return lua.createIfStatement(condition, ifBlock, elseStatement);
            }
        }
        else {
            context.pushScope(scope_1.ScopeType.Conditional, statement);
            const elseStatements = (0, scope_1.performHoisting)(context, (0, block_1.transformBlockOrStatement)(context, statement.elseStatement));
            context.popScope();
            const elseBlock = lua.createBlock(elseStatements);
            return lua.createIfStatement(condition, ifBlock, elseBlock);
        }
    }
    return lua.createIfStatement(condition, ifBlock);
}
function checkOnlyTruthyCondition(condition, context) {
    if (context.options.strictNullChecks === false)
        return; // This check is not valid if everything could implicitly be nil
    if (ts.isElementAccessExpression(condition))
        return; // Array index could always implicitly return nil
    if (!(0, typescript_1.canBeFalsy)(context, context.checker.getTypeAtLocation(condition))) {
        context.diagnostics.push((0, diagnostics_1.truthyOnlyConditionalValue)(condition));
    }
}
//# sourceMappingURL=conditional.js.map