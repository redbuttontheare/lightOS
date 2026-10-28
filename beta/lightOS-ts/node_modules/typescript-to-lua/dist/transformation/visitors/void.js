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
exports.transformVoidExpression = void 0;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const expression_statement_1 = require("./expression-statement");
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void
const transformVoidExpression = (node, context) => {
    // If content is a literal it is safe to replace the entire expression with nil
    if (!ts.isLiteralExpression(node.expression)) {
        const statements = (0, expression_statement_1.wrapInStatement)(context.transformExpression(node.expression));
        if (statements)
            context.addPrecedingStatements(statements);
    }
    return lua.createNilLiteral();
};
exports.transformVoidExpression = transformVoidExpression;
//# sourceMappingURL=void.js.map