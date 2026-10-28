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
exports.transformBlock = void 0;
exports.transformBlockOrStatement = transformBlockOrStatement;
exports.transformScopeBlock = transformScopeBlock;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const scope_1 = require("../utils/scope");
function transformBlockOrStatement(context, statement) {
    return context.transformStatements(ts.isBlock(statement) ? statement.statements : statement);
}
function transformScopeBlock(context, node, scopeType) {
    context.pushScope(scopeType, node);
    const statements = (0, scope_1.performHoisting)(context, context.transformStatements(node.statements));
    const scope = context.popScope();
    return [lua.createBlock(statements, node), scope];
}
const transformBlock = (node, context) => {
    context.pushScope(scope_1.ScopeType.Block, node);
    const statements = (0, scope_1.performHoisting)(context, context.transformStatements(node.statements));
    context.popScope();
    return lua.createDoStatement(statements, node);
};
exports.transformBlock = transformBlock;
//# sourceMappingURL=block.js.map