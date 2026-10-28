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
exports.createClassSetup = createClassSetup;
exports.getReflectionClassName = getReflectionClassName;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../../LuaAST"));
const utils_1 = require("../../../utils");
const export_1 = require("../../utils/export");
const lua_ast_1 = require("../../utils/lua-ast");
const lualib_1 = require("../../utils/lualib");
const utils_2 = require("./utils");
function createClassSetup(context, statement, className, localClassName, extendsType) {
    const result = [];
    // __TS__Class()
    const classInitializer = (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.Class, statement);
    const defaultExportLeftHandSide = (0, export_1.hasDefaultExportModifier)(statement)
        ? lua.createTableIndexExpression((0, lua_ast_1.createExportsIdentifier)(), (0, export_1.createDefaultExportStringLiteral)(statement))
        : undefined;
    // [____exports.]className = __TS__Class()
    if (defaultExportLeftHandSide) {
        result.push(lua.createAssignmentStatement(defaultExportLeftHandSide, classInitializer, statement));
    }
    else {
        result.push(...(0, lua_ast_1.createLocalOrExportedOrGlobalDeclaration)(context, className, classInitializer, statement));
    }
    if (defaultExportLeftHandSide) {
        // local localClassName = ____exports.default
        result.push(lua.createVariableDeclarationStatement(localClassName, defaultExportLeftHandSide));
    }
    else {
        const exportScope = (0, export_1.getIdentifierExportScope)(context, className);
        if (exportScope) {
            // local localClassName = ____exports.className
            result.push(lua.createVariableDeclarationStatement(localClassName, (0, export_1.createExportedIdentifier)(context, lua.cloneIdentifier(className), exportScope)));
        }
    }
    // localClassName.name = className
    result.push(lua.createAssignmentStatement(lua.createTableIndexExpression(lua.cloneIdentifier(localClassName), lua.createStringLiteral("name")), getReflectionClassName(statement, className), statement));
    if (extendsType) {
        const extendedNode = (0, utils_2.getExtendedNode)(statement);
        (0, utils_1.assert)(extendedNode);
        result.push(lua.createExpressionStatement((0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.ClassExtends, (0, utils_2.getExtendsClause)(statement), lua.cloneIdentifier(localClassName), context.transformExpression(extendedNode.expression))));
    }
    return result;
}
function getReflectionClassName(declaration, className) {
    if (declaration.name) {
        return lua.createStringLiteral(declaration.name.text);
    }
    else if (ts.isVariableDeclaration(declaration.parent) && ts.isIdentifier(declaration.parent.name)) {
        return lua.createStringLiteral(declaration.parent.name.text);
    }
    else if ((0, export_1.hasDefaultExportModifier)(declaration)) {
        return lua.createStringLiteral("default");
    }
    if ((0, utils_2.getExtendedNode)(declaration)) {
        return lua.createTableIndexExpression(className, lua.createStringLiteral("name"));
    }
    return lua.createStringLiteral("");
}
//# sourceMappingURL=setup.js.map