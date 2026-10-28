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
exports.transformDeleteExpression = void 0;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const lualib_1 = require("../utils/lualib");
const diagnostics_1 = require("../utils/diagnostics");
const typescript_1 = require("../utils/typescript");
const lua_ast_1 = require("../utils/lua-ast");
const optional_chaining_1 = require("./optional-chaining");
const transformDeleteExpression = (node, context) => {
    if (ts.isOptionalChain(node.expression)) {
        return (0, optional_chaining_1.transformOptionalDeleteExpression)(context, node, node.expression);
    }
    let ownerExpression;
    let propertyExpression;
    if (ts.isPropertyAccessExpression(node.expression)) {
        if (ts.isPrivateIdentifier(node.expression.name))
            throw new Error("PrivateIdentifier is not supported");
        ownerExpression = context.transformExpression(node.expression.expression);
        propertyExpression = lua.createStringLiteral(node.expression.name.text);
    }
    else if (ts.isElementAccessExpression(node.expression)) {
        ownerExpression = context.transformExpression(node.expression.expression);
        propertyExpression = context.transformExpression(node.expression.argumentExpression);
        const type = context.checker.getTypeAtLocation(node.expression.expression);
        const argumentType = context.checker.getTypeAtLocation(node.expression.argumentExpression);
        if ((0, typescript_1.isArrayType)(context, type) && (0, typescript_1.isNumberType)(context, argumentType)) {
            propertyExpression = (0, lua_ast_1.addToNumericExpression)(propertyExpression, 1);
        }
    }
    if (!ownerExpression || !propertyExpression) {
        context.diagnostics.push((0, diagnostics_1.unsupportedProperty)(node, "delete", ts.SyntaxKind[node.kind]));
        return lua.createNilLiteral();
    }
    return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.Delete, node, ownerExpression, propertyExpression);
};
exports.transformDeleteExpression = transformDeleteExpression;
//# sourceMappingURL=delete.js.map