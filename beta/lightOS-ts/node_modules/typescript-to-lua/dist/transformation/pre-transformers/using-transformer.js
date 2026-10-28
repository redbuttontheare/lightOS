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
exports.usingTransformer = usingTransformer;
const ts = __importStar(require("typescript"));
const lualib_1 = require("../utils/lualib");
function usingTransformer(context) {
    return ctx => sourceFile => {
        function visit(node) {
            if (ts.isBlock(node) || ts.isSourceFile(node)) {
                const [hasUsings, newStatements] = transformBlockWithUsing(context, node.statements, node);
                if (hasUsings) {
                    // Recurse visitor into updated block to find further usings
                    const updatedBlock = ts.isBlock(node)
                        ? ts.factory.updateBlock(node, newStatements)
                        : ts.factory.updateSourceFile(node, newStatements);
                    const result = ts.visitEachChild(updatedBlock, visit, ctx);
                    // Set all the synthetic node parents to something that makes sense
                    const parent = [updatedBlock];
                    function setParent(node2) {
                        ts.setParent(node2, parent[parent.length - 1]);
                        parent.push(node2);
                        ts.visitEachChild(node2, setParent, ctx);
                        parent.pop();
                        return node2;
                    }
                    ts.visitEachChild(updatedBlock, setParent, ctx);
                    ts.setParent(updatedBlock, node.parent);
                    return result;
                }
            }
            return ts.visitEachChild(node, visit, ctx);
        }
        const transformedSourceFile = ts.visitEachChild(sourceFile, visit, ctx);
        return visit(transformedSourceFile);
    };
}
function isUsingDeclarationList(node) {
    return ts.isVariableStatement(node) && (node.declarationList.flags & ts.NodeFlags.Using) !== 0;
}
function transformBlockWithUsing(context, statements, block) {
    const newStatements = [];
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (isUsingDeclarationList(statement)) {
            const isAwaitUsing = (statement.declarationList.flags & ts.NodeFlags.AwaitContext) !== 0;
            if (isAwaitUsing) {
                (0, lualib_1.importLuaLibFeature)(context, lualib_1.LuaLibFeature.UsingAsync);
            }
            else {
                (0, lualib_1.importLuaLibFeature)(context, lualib_1.LuaLibFeature.Using);
            }
            // Make declared using variables callback function parameters
            const variableNames = statement.declarationList.declarations.map(d => ts.factory.createParameterDeclaration(undefined, undefined, d.name));
            // Add this: void as first parameter
            variableNames.unshift(createThisVoidParameter(context.checker));
            // Put all following statements in the callback body
            const followingStatements = statements.slice(i + 1);
            const [followingHasUsings, replacedFollowingStatements] = transformBlockWithUsing(context, followingStatements, block);
            const callbackBody = ts.factory.createBlock(followingHasUsings ? replacedFollowingStatements : followingStatements);
            const callback = ts.factory.createFunctionExpression(
            // Put async keyword in front of callback when we are in an async using
            isAwaitUsing ? [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)] : undefined, undefined, undefined, undefined, variableNames, ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), // Required for TS to not freak out trying to infer the type of synthetic nodes
            callbackBody);
            // Replace using variable list with call to lualib function with callback and followed by all variable initializers
            const functionIdentifier = ts.factory.createIdentifier(isAwaitUsing ? "__TS__UsingAsync" : "__TS__Using");
            let call = ts.factory.createCallExpression(functionIdentifier, [], [
                callback,
                ...statement.declarationList.declarations.map(d => { var _a; return (_a = d.initializer) !== null && _a !== void 0 ? _a : ts.factory.createIdentifier("unidentified"); }),
            ]);
            // If this is an 'await using ...', add an await statement here
            if (isAwaitUsing) {
                call = ts.factory.createAwaitExpression(call);
            }
            if (ts.isSourceFile(block)) {
                // If block is a sourcefile, don't insert a return statement into root code
                newStatements.push(ts.factory.createExpressionStatement(call));
            }
            else if (block.parent &&
                ts.isBlock(block.parent) &&
                block.parent.statements[block.parent.statements.length - 1] !== block) {
                // If this is a free-standing block in a function (not the last statement), dont return the value
                newStatements.push(ts.factory.createExpressionStatement(call));
            }
            else {
                newStatements.push(ts.factory.createReturnStatement(call));
            }
            return [true, newStatements];
        }
        else {
            newStatements.push(statement);
        }
    }
    return [false];
}
function createThisVoidParameter(checker) {
    const voidType = checker.typeToTypeNode(checker.getVoidType(), undefined, undefined);
    return ts.factory.createParameterDeclaration(undefined, undefined, ts.factory.createIdentifier("this"), undefined, voidType);
}
//# sourceMappingURL=using-transformer.js.map