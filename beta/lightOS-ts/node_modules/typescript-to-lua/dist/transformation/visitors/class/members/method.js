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
exports.transformMemberExpressionOwnerName = transformMemberExpressionOwnerName;
exports.transformMethodName = transformMethodName;
exports.transformMethodDeclaration = transformMethodDeclaration;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../../../LuaAST"));
const function_1 = require("../../function");
const literal_1 = require("../../literal");
const utils_1 = require("../utils");
const constructor_1 = require("./constructor");
const decorators_1 = require("../decorators");
function transformMemberExpressionOwnerName(node, className) {
    return (0, utils_1.isStaticNode)(node) ? lua.cloneIdentifier(className) : (0, constructor_1.createPrototypeName)(className);
}
function transformMethodName(context, node) {
    const methodName = (0, literal_1.transformPropertyName)(context, node.name);
    if (lua.isStringLiteral(methodName) && methodName.value === "toString") {
        return lua.createStringLiteral("__tostring", node.name);
    }
    return methodName;
}
function transformMethodDeclaration(context, node, className) {
    var _a, _b;
    // Don't transform methods without body (overload declarations)
    if (!node.body)
        return [];
    const methodTable = transformMemberExpressionOwnerName(node, className);
    const methodName = transformMethodName(context, node);
    const [functionExpression] = (0, function_1.transformFunctionToExpression)(context, node);
    const methodHasDecorators = ((_b = (_a = ts.getDecorators(node)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
    const methodHasParameterDecorators = node.parameters.some(p => { var _a, _b; return ((_b = (_a = ts.getDecorators(p)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0; }); // Legacy decorators
    if (methodHasDecorators || methodHasParameterDecorators) {
        if (context.options.experimentalDecorators) {
            // Legacy decorator statement
            return [
                lua.createAssignmentStatement(lua.createTableIndexExpression(methodTable, methodName), functionExpression),
                lua.createExpressionStatement((0, decorators_1.createClassMethodDecoratingExpression)(context, node, functionExpression, className)),
            ];
        }
        else {
            return [
                lua.createAssignmentStatement(lua.createTableIndexExpression(methodTable, methodName), (0, decorators_1.createClassMethodDecoratingExpression)(context, node, functionExpression, className), node),
            ];
        }
    }
    else {
        return [
            lua.createAssignmentStatement(lua.createTableIndexExpression(methodTable, methodName), functionExpression, node),
        ];
    }
}
//# sourceMappingURL=method.js.map