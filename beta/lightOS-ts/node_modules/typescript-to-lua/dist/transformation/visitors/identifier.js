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
exports.transformIdentifierExpression = void 0;
exports.transformIdentifier = transformIdentifier;
exports.getCustomNameFromSymbol = getCustomNameFromSymbol;
exports.transformIdentifierWithSymbol = transformIdentifierWithSymbol;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const builtins_1 = require("../builtins");
const promise_1 = require("../builtins/promise");
const context_1 = require("../context");
const diagnostics_1 = require("../utils/diagnostics");
const export_1 = require("../utils/export");
const safe_names_1 = require("../utils/safe-names");
const symbols_1 = require("../utils/symbols");
const optional_chaining_1 = require("./optional-chaining");
const typescript_1 = require("../utils/typescript");
const language_extensions_1 = require("../utils/language-extensions");
const call_extension_1 = require("./language-extensions/call-extension");
const identifier_1 = require("./language-extensions/identifier");
const annotations_1 = require("../utils/annotations");
function transformIdentifier(context, identifier) {
    return transformNonValueIdentifier(context, identifier, context.checker.getSymbolAtLocation(identifier));
}
function getCustomNameFromSymbol(context, symbol) {
    let retVal;
    if (symbol) {
        const declarations = symbol.getDeclarations();
        if (declarations) {
            let customNameAnnotation = undefined;
            for (const declaration of declarations) {
                const nodeAnnotations = (0, annotations_1.getNodeAnnotations)(declaration);
                const foundAnnotation = nodeAnnotations.get(annotations_1.AnnotationKind.CustomName);
                if (foundAnnotation) {
                    customNameAnnotation = foundAnnotation;
                    break;
                }
                // If the symbol is an imported value, check the original declaration
                // beware of declaration.propertyName, this is the import name alias and should not be renamed!
                if (ts.isImportSpecifier(declaration) && !declaration.propertyName) {
                    const importedType = context.checker.getTypeAtLocation(declaration);
                    if (importedType.symbol) {
                        const importedCustomName = getCustomNameFromSymbol(context, importedType.symbol);
                        if (importedCustomName) {
                            return importedCustomName;
                        }
                    }
                }
            }
            if (customNameAnnotation) {
                retVal = customNameAnnotation.args[0];
            }
        }
    }
    return retVal;
}
function transformNonValueIdentifier(context, identifier, symbol) {
    if ((0, optional_chaining_1.isOptionalContinuation)(identifier)) {
        const result = lua.createIdentifier(identifier.text, undefined, context_1.tempSymbolId);
        (0, optional_chaining_1.getOptionalContinuationData)(identifier).usedIdentifiers.push(result);
        return result;
    }
    const extensionKind = symbol
        ? (0, language_extensions_1.getExtensionKindForSymbol)(context, symbol)
        : (0, language_extensions_1.getExtensionKindForNode)(context, identifier);
    if (extensionKind) {
        if (call_extension_1.callExtensions.has(extensionKind)) {
            // Avoid putting duplicate diagnostic on the name of a variable declaration, due to the inferred type
            if (!(ts.isVariableDeclaration(identifier.parent) && identifier.parent.name === identifier)) {
                context.diagnostics.push((0, diagnostics_1.invalidCallExtensionUse)(identifier));
            }
            // fall through
        }
        else if ((0, identifier_1.isIdentifierExtensionValue)(symbol, extensionKind)) {
            (0, identifier_1.reportInvalidExtensionValue)(context, identifier, extensionKind);
            return lua.createAnonymousIdentifier(identifier);
        }
    }
    const type = context.checker.getTypeAtLocation(identifier);
    if ((0, typescript_1.isStandardLibraryType)(context, type, undefined)) {
        (0, builtins_1.checkForLuaLibType)(context, type);
        if ((0, promise_1.isPromiseClass)(context, identifier)) {
            return (0, promise_1.createPromiseIdentifier)(identifier);
        }
    }
    let text = (0, safe_names_1.hasUnsafeIdentifierName)(context, identifier, symbol) ? (0, safe_names_1.createSafeName)(identifier.text) : identifier.text;
    const customName = getCustomNameFromSymbol(context, symbol);
    if (customName)
        text = customName;
    const symbolId = (0, symbols_1.getIdentifierSymbolId)(context, identifier, symbol);
    return lua.createIdentifier(text, identifier, symbolId, identifier.text);
}
function transformIdentifierWithSymbol(context, node, symbol) {
    if (symbol) {
        const exportScope = (0, export_1.getSymbolExportScope)(context, symbol);
        if (exportScope) {
            const name = symbol.name;
            const text = (0, safe_names_1.hasUnsafeIdentifierName)(context, node, symbol) ? (0, safe_names_1.createSafeName)(name) : name;
            const symbolId = (0, symbols_1.getIdentifierSymbolId)(context, node, symbol);
            const identifier = lua.createIdentifier(text, node, symbolId, name);
            return (0, export_1.createExportedIdentifier)(context, identifier, exportScope);
        }
    }
    const builtinResult = (0, builtins_1.transformBuiltinIdentifierExpression)(context, node, symbol);
    if (builtinResult) {
        return builtinResult;
    }
    return transformNonValueIdentifier(context, node, symbol);
}
const transformIdentifierExpression = (node, context) => {
    if (ts.identifierToKeywordKind(node) === ts.SyntaxKind.UndefinedKeyword) {
        return lua.createNilLiteral(node);
    }
    const symbol = context.checker.getSymbolAtLocation(node);
    return transformIdentifierWithSymbol(context, node, symbol);
};
exports.transformIdentifierExpression = transformIdentifierExpression;
//# sourceMappingURL=identifier.js.map