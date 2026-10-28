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
exports.transformNewExpression = void 0;
const lua = __importStar(require("../../../LuaAST"));
const annotations_1 = require("../../utils/annotations");
const diagnostics_1 = require("../../utils/diagnostics");
const lualib_1 = require("../../utils/lualib");
const call_1 = require("../call");
const table_1 = require("../language-extensions/table");
const builtins_1 = require("../../builtins");
const transformNewExpression = (node, context) => {
    var _a, _b, _c;
    if ((0, table_1.isTableNewCall)(context, node)) {
        return lua.createTableExpression(undefined, node);
    }
    const constructorType = context.checker.getTypeAtLocation(node.expression);
    if (((_a = (0, builtins_1.tryGetStandardLibrarySymbolOfType)(context, constructorType)) === null || _a === void 0 ? void 0 : _a.name) === "ArrayConstructor") {
        if (node.arguments === undefined || node.arguments.length === 0) {
            // turn new Array<>() into a simple {}
            return lua.createTableExpression([], node);
        }
        else {
            // More than one argument, check if items constructor
            const signature = context.checker.getResolvedSignature(node);
            const signatureDeclaration = signature === null || signature === void 0 ? void 0 : signature.getDeclaration();
            if ((signatureDeclaration === null || signatureDeclaration === void 0 ? void 0 : signatureDeclaration.parameters.length) === 1 &&
                signatureDeclaration.parameters[0].dotDotDotToken === undefined) {
                context.diagnostics.push((0, diagnostics_1.unsupportedArrayWithLengthConstructor)(node));
                return lua.createTableExpression([], node);
            }
            else {
                const callArguments = (0, call_1.transformArguments)(context, node.arguments, signature);
                return lua.createTableExpression(callArguments.map(e => lua.createTableFieldExpression(e)), node);
            }
        }
    }
    const signature = context.checker.getResolvedSignature(node);
    const [name, params] = (0, call_1.transformCallAndArguments)(context, node.expression, (_b = node.arguments) !== null && _b !== void 0 ? _b : [], signature);
    const type = context.checker.getTypeAtLocation(node);
    const annotations = (0, annotations_1.getTypeAnnotations)(type);
    const customConstructorAnnotation = annotations.get(annotations_1.AnnotationKind.CustomConstructor);
    if (customConstructorAnnotation) {
        if (customConstructorAnnotation.args.length === 1) {
            return lua.createCallExpression(lua.createIdentifier(customConstructorAnnotation.args[0]), (0, call_1.transformArguments)(context, (_c = node.arguments) !== null && _c !== void 0 ? _c : []), node);
        }
        else {
            context.diagnostics.push((0, diagnostics_1.annotationInvalidArgumentCount)(node, annotations_1.AnnotationKind.CustomConstructor, customConstructorAnnotation.args.length, 1));
        }
    }
    return (0, lualib_1.transformLuaLibFunction)(context, lualib_1.LuaLibFeature.New, node, name, ...params);
};
exports.transformNewExpression = transformNewExpression;
//# sourceMappingURL=new.js.map