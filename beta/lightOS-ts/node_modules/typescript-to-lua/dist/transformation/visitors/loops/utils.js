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
exports.transformLoopBody = transformLoopBody;
exports.getVariableDeclarationBinding = getVariableDeclarationBinding;
exports.transformForInitializer = transformForInitializer;
exports.invertCondition = invertCondition;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../../LuaAST"));
const preceding_statements_1 = require("../../utils/preceding-statements");
const scope_1 = require("../../utils/scope");
const typescript_1 = require("../../utils/typescript");
const assignments_1 = require("../binary-expression/assignments");
const destructuring_assignments_1 = require("../binary-expression/destructuring-assignments");
const block_1 = require("../block");
const identifier_1 = require("../identifier");
const variable_declaration_1 = require("../variable-declaration");
function transformLoopBody(context, loop) {
    context.pushScope(scope_1.ScopeType.Loop, loop);
    const body = (0, scope_1.performHoisting)(context, (0, block_1.transformBlockOrStatement)(context, loop.statement));
    const scope = context.popScope();
    const scopeId = scope.id;
    switch (scope.loopContinued) {
        case undefined:
        case scope_1.LoopContinued.WithContinue:
            return body;
        case scope_1.LoopContinued.WithGoto:
            return [lua.createDoStatement(body), lua.createLabelStatement(`__continue${scopeId}`)];
        case scope_1.LoopContinued.WithRepeatBreak:
            const identifier = lua.createIdentifier(`__continue${scopeId}`);
            const literalTrue = lua.createBooleanLiteral(true);
            // If there is a break in the body statements, do not include any code afterwards
            const transformedBodyStatements = [];
            let bodyBroken = false;
            for (const statement of body) {
                transformedBodyStatements.push(statement);
                if (lua.isBreakStatement(statement)) {
                    bodyBroken = true;
                    break;
                }
            }
            if (!bodyBroken) {
                // Tell loop to continue if not broken
                transformedBodyStatements.push(lua.createAssignmentStatement(identifier, literalTrue));
            }
            return [
                lua.createDoStatement([
                    lua.createVariableDeclarationStatement(identifier),
                    lua.createRepeatStatement(lua.createBlock(transformedBodyStatements), literalTrue),
                    lua.createIfStatement(lua.createUnaryExpression(identifier, lua.SyntaxKind.NotOperator), lua.createBlock([lua.createBreakStatement()])),
                ]),
            ];
    }
}
function getVariableDeclarationBinding(context, node) {
    (0, variable_declaration_1.checkVariableDeclarationList)(context, node);
    if (node.declarations.length === 0) {
        return ts.factory.createIdentifier("____");
    }
    return node.declarations[0].name;
}
function transformForInitializer(context, initializer, block) {
    const valueVariable = lua.createIdentifier("____value");
    context.pushScope(scope_1.ScopeType.LoopInitializer, initializer);
    if (ts.isVariableDeclarationList(initializer)) {
        // Declaration of new variable
        const binding = getVariableDeclarationBinding(context, initializer);
        if (ts.isArrayBindingPattern(binding) || ts.isObjectBindingPattern(binding)) {
            const { precedingStatements, result: bindings } = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => (0, variable_declaration_1.transformBindingPattern)(context, binding, valueVariable));
            block.statements.unshift(...precedingStatements, ...bindings);
        }
        else {
            // Single variable declared in for loop
            context.popScope();
            return (0, identifier_1.transformIdentifier)(context, binding);
        }
    }
    else {
        // Assignment to existing variable(s)
        block.statements.unshift(...((0, typescript_1.isAssignmentPattern)(initializer)
            ? (0, destructuring_assignments_1.transformAssignmentPattern)(context, initializer, valueVariable, false)
            : (0, assignments_1.transformAssignment)(context, initializer, valueVariable)));
    }
    context.popScope();
    return valueVariable;
}
function invertCondition(expression) {
    if (lua.isUnaryExpression(expression) && expression.operator === lua.SyntaxKind.NotOperator) {
        return expression.operand;
    }
    else {
        const notExpression = lua.createUnaryExpression(expression, lua.SyntaxKind.NotOperator);
        lua.setNodePosition(notExpression, lua.getOriginalPos(expression));
        return notExpression;
    }
}
//# sourceMappingURL=utils.js.map