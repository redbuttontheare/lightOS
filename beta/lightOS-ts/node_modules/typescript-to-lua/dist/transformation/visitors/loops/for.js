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
exports.transformForStatement = void 0;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../../LuaAST"));
const preceding_statements_1 = require("../../utils/preceding-statements");
const variable_declaration_1 = require("../variable-declaration");
const utils_1 = require("./utils");
const scope_1 = require("../../utils/scope");
const transformForStatement = (statement, context) => {
    const result = [];
    context.pushScope(scope_1.ScopeType.Loop, statement);
    if (statement.initializer) {
        if (ts.isVariableDeclarationList(statement.initializer)) {
            (0, variable_declaration_1.checkVariableDeclarationList)(context, statement.initializer);
            // local initializer = value
            result.push(...statement.initializer.declarations.flatMap(d => (0, variable_declaration_1.transformVariableDeclaration)(context, d)));
        }
        else {
            result.push(...context.transformStatements(ts.factory.createExpressionStatement(statement.initializer)));
        }
    }
    const body = (0, utils_1.transformLoopBody)(context, statement);
    let condition;
    if (statement.condition) {
        const tsCondition = statement.condition;
        const { precedingStatements: conditionPrecedingStatements, result } = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => context.transformExpression(tsCondition));
        condition = result;
        // If condition has preceding statements, ensure they are executed every iteration by using the form:
        //
        // while true do
        //     condition's preceding statements
        //     if not condition then
        //         break
        //     end
        //     ...
        // end
        if (conditionPrecedingStatements.length > 0) {
            conditionPrecedingStatements.push(lua.createIfStatement((0, utils_1.invertCondition)(condition), lua.createBlock([lua.createBreakStatement()]), undefined, statement.condition));
            body.unshift(...conditionPrecedingStatements);
            condition = lua.createBooleanLiteral(true);
        }
    }
    else {
        condition = lua.createBooleanLiteral(true);
    }
    if (statement.incrementor) {
        body.push(...context.transformStatements(ts.factory.createExpressionStatement(statement.incrementor)));
    }
    // while (condition) do ... end
    result.push(lua.createWhileStatement(lua.createBlock(body), condition, statement));
    context.popScope();
    return lua.createDoStatement(result, statement);
};
exports.transformForStatement = transformForStatement;
//# sourceMappingURL=for.js.map