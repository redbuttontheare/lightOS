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
exports.transformTaggedTemplateExpression = exports.transformTemplateExpression = void 0;
const ts = __importStar(require("typescript"));
const lua = __importStar(require("../../LuaAST"));
const function_context_1 = require("../utils/function-context");
const lua_ast_1 = require("../utils/lua-ast");
const typescript_1 = require("../utils/typescript");
const call_1 = require("./call");
const expression_list_1 = require("./expression-list");
// TODO: Source positions
function getRawLiteral(node) {
    let text = node.getText();
    const isLast = node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || node.kind === ts.SyntaxKind.TemplateTail;
    text = text.substring(1, text.length - (isLast ? 1 : 2));
    text = text.replace(/\r\n?/g, "\n");
    return text;
}
const transformTemplateExpression = (node, context) => {
    const parts = [];
    const head = node.head.text;
    if (head.length > 0) {
        parts.push(lua.createStringLiteral(head, node.head));
    }
    const transformedExpressions = (0, expression_list_1.transformOrderedExpressions)(context, node.templateSpans.map(s => s.expression));
    for (let i = 0; i < node.templateSpans.length; ++i) {
        const span = node.templateSpans[i];
        const expression = transformedExpressions[i];
        const spanType = context.checker.getTypeAtLocation(span.expression);
        if ((0, typescript_1.isStringType)(context, spanType)) {
            parts.push(expression);
        }
        else {
            parts.push((0, lua_ast_1.wrapInToStringForConcat)(expression));
        }
        const text = span.literal.text;
        if (text.length > 0) {
            parts.push(lua.createStringLiteral(text, span.literal));
        }
    }
    return parts.reduce((prev, current) => lua.createBinaryExpression(prev, current, lua.SyntaxKind.ConcatOperator));
};
exports.transformTemplateExpression = transformTemplateExpression;
const transformTaggedTemplateExpression = (expression, context) => {
    const strings = [];
    const rawStrings = [];
    const expressions = [];
    if (ts.isTemplateExpression(expression.template)) {
        // Expressions are in the string.
        strings.push(expression.template.head.text);
        rawStrings.push(getRawLiteral(expression.template.head));
        strings.push(...expression.template.templateSpans.map(span => span.literal.text));
        rawStrings.push(...expression.template.templateSpans.map(span => getRawLiteral(span.literal)));
        expressions.push(...expression.template.templateSpans.map(span => span.expression));
    }
    else {
        // No expressions are in the string.
        strings.push(expression.template.text);
        rawStrings.push(getRawLiteral(expression.template));
    }
    // Construct table with strings and literal strings
    const rawStringsArray = ts.factory.createArrayLiteralExpression(rawStrings.map(text => ts.factory.createStringLiteral(text)));
    const stringObject = ts.factory.createObjectLiteralExpression([
        ...strings.map((partialString, i) => ts.factory.createPropertyAssignment(ts.factory.createNumericLiteral(i + 1), ts.factory.createStringLiteral(partialString))),
        ts.factory.createPropertyAssignment("raw", rawStringsArray),
    ]);
    expressions.unshift(stringObject);
    // Evaluate if there is a self parameter to be used.
    const useSelfParameter = (0, function_context_1.getCallContextType)(context, expression) !== function_context_1.ContextType.Void;
    if (useSelfParameter) {
        return (0, call_1.transformContextualCallExpression)(context, expression, expressions);
    }
    // Argument evaluation.
    const callArguments = (0, call_1.transformArguments)(context, expressions);
    const leftHandSideExpression = context.transformExpression(expression.tag);
    return lua.createCallExpression(leftHandSideExpression, callArguments);
};
exports.transformTaggedTemplateExpression = transformTaggedTemplateExpression;
//# sourceMappingURL=template.js.map