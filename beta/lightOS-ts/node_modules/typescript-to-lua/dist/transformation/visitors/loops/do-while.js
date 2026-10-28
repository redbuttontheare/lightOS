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
exports.transformDoStatement = exports.transformWhileStatement = void 0;
const lua = __importStar(require("../../../LuaAST"));
const preceding_statements_1 = require("../../utils/preceding-statements");
const conditional_1 = require("../conditional");
const utils_1 = require("./utils");
const transformWhileStatement = (statement, context) => {
    // Check if we need to add diagnostic about Lua truthiness
    (0, conditional_1.checkOnlyTruthyCondition)(statement.expression, context);
    const body = (0, utils_1.transformLoopBody)(context, statement);
    let { precedingStatements: conditionPrecedingStatements, result: condition } = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => context.transformExpression(statement.expression));
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
        conditionPrecedingStatements.push(lua.createIfStatement((0, utils_1.invertCondition)(condition), lua.createBlock([lua.createBreakStatement()]), undefined, statement.expression));
        body.unshift(...conditionPrecedingStatements);
        condition = lua.createBooleanLiteral(true);
    }
    return lua.createWhileStatement(lua.createBlock(body), condition, statement);
};
exports.transformWhileStatement = transformWhileStatement;
const transformDoStatement = (statement, context) => {
    // Check if we need to add diagnostic about Lua truthiness
    (0, conditional_1.checkOnlyTruthyCondition)(statement.expression, context);
    const body = lua.createDoStatement((0, utils_1.transformLoopBody)(context, statement));
    let { precedingStatements: conditionPrecedingStatements, result: condition } = (0, preceding_statements_1.transformInPrecedingStatementScope)(context, () => (0, utils_1.invertCondition)(context.transformExpression(statement.expression)));
    // If condition has preceding statements, ensure they are executed every iteration by using the form:
    //
    // repeat
    //     ...
    //     condition's preceding statements
    //     if condition then
    //         break
    //     end
    // end
    if (conditionPrecedingStatements.length > 0) {
        conditionPrecedingStatements.push(lua.createIfStatement(condition, lua.createBlock([lua.createBreakStatement()]), undefined, statement.expression));
        condition = lua.createBooleanLiteral(false);
    }
    return lua.createRepeatStatement(lua.createBlock([body, ...conditionPrecedingStatements]), condition, statement);
};
exports.transformDoStatement = transformDoStatement;
//# sourceMappingURL=do-while.js.map