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
exports.createPrototypeName = createPrototypeName;
exports.createConstructorName = createConstructorName;
exports.transformConstructorDeclaration = transformConstructorDeclaration;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../../../LuaAST"));
const lua_ast_1 = require("../../../utils/lua-ast");
const scope_1 = require("../../../utils/scope");
const function_1 = require("../../function");
const identifier_1 = require("../../identifier");
const fields_1 = require("./fields");
function createPrototypeName(className) {
    return lua.createTableIndexExpression(lua.cloneIdentifier(className), lua.createStringLiteral("prototype"));
}
function createConstructorName(className) {
    return lua.createTableIndexExpression(createPrototypeName(className), lua.createStringLiteral("____constructor"));
}
function transformConstructorDeclaration(context, statement, className, instanceFields, classDeclaration) {
    // Don't transform methods without body (overload declarations)
    if (!statement.body) {
        return undefined;
    }
    // Transform body
    const scope = context.pushScope(scope_1.ScopeType.Function, statement);
    const body = (0, function_1.transformFunctionBodyContent)(context, statement.body);
    const [params, dotsLiteral, restParamName] = (0, function_1.transformParameters)(context, statement.parameters, (0, lua_ast_1.createSelfIdentifier)());
    // Make sure default parameters are assigned before fields are initialized
    const bodyWithFieldInitializers = (0, function_1.transformFunctionBodyHeader)(context, scope, statement.parameters, restParamName);
    // Check for field declarations in constructor
    const constructorFieldsDeclarations = statement.parameters.filter(p => p.modifiers !== undefined);
    const classInstanceFields = (0, fields_1.transformClassInstanceFields)(context, instanceFields);
    // If there are field initializers and there is a super call somewhere,
    // move super call and everything before it to between default assignments and initializers
    if ((constructorFieldsDeclarations.length > 0 || classInstanceFields.length > 0) &&
        statement.body &&
        statement.body.statements.length > 0) {
        const superIndex = statement.body.statements.findIndex(s => ts.isExpressionStatement(s) &&
            ts.isCallExpression(s.expression) &&
            s.expression.expression.kind === ts.SyntaxKind.SuperKeyword);
        if (superIndex !== -1) {
            bodyWithFieldInitializers.push(...body.splice(0, superIndex + 1));
        }
    }
    // Add in instance field declarations
    for (const declaration of constructorFieldsDeclarations) {
        if (ts.isIdentifier(declaration.name)) {
            // self.declarationName = declarationName
            const assignment = lua.createAssignmentStatement(lua.createTableIndexExpression((0, lua_ast_1.createSelfIdentifier)(), lua.createStringLiteral(declaration.name.text)), (0, identifier_1.transformIdentifier)(context, declaration.name));
            bodyWithFieldInitializers.push(assignment);
        }
        // else { TypeScript error: A parameter property may not be declared using a binding pattern }
    }
    bodyWithFieldInitializers.push(...classInstanceFields);
    bodyWithFieldInitializers.push(...body);
    const block = lua.createBlock(bodyWithFieldInitializers);
    const constructorWasGenerated = statement.pos === -1;
    context.popScope();
    return lua.createAssignmentStatement(createConstructorName(className), lua.createFunctionExpression(block, params, dotsLiteral, lua.NodeFlags.Declaration), constructorWasGenerated ? classDeclaration : statement);
}
//# sourceMappingURL=constructor.js.map