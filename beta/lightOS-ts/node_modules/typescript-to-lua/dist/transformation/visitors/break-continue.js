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
exports.transformContinueStatement = exports.transformBreakStatement = void 0;
const CompilerOptions_1 = require("../../CompilerOptions");
const lua = __importStar(require("../../LuaAST"));
const scope_1 = require("../utils/scope");
const typescript_1 = require("../utils/typescript");
const transformBreakStatement = (breakStatement, context) => {
    const tryScope = (0, typescript_1.isInAsyncFunction)(breakStatement) ? (0, scope_1.findAsyncTryScopeBeforeLoop)(context) : undefined;
    if (tryScope) {
        tryScope.asyncTryHasBreak = true;
        return [
            lua.createAssignmentStatement(lua.createIdentifier("____hasBroken"), lua.createBooleanLiteral(true), breakStatement),
            lua.createReturnStatement([], breakStatement),
        ];
    }
    return lua.createBreakStatement(breakStatement);
};
exports.transformBreakStatement = transformBreakStatement;
const transformContinueStatement = (statement, context) => {
    var _a;
    const scope = (0, scope_1.findScope)(context, scope_1.ScopeType.Loop);
    const continuedWith = {
        [CompilerOptions_1.LuaTarget.Universal]: scope_1.LoopContinued.WithRepeatBreak,
        [CompilerOptions_1.LuaTarget.Lua50]: scope_1.LoopContinued.WithRepeatBreak,
        [CompilerOptions_1.LuaTarget.Lua51]: scope_1.LoopContinued.WithRepeatBreak,
        [CompilerOptions_1.LuaTarget.Lua52]: scope_1.LoopContinued.WithGoto,
        [CompilerOptions_1.LuaTarget.Lua53]: scope_1.LoopContinued.WithGoto,
        [CompilerOptions_1.LuaTarget.Lua54]: scope_1.LoopContinued.WithGoto,
        [CompilerOptions_1.LuaTarget.Lua55]: scope_1.LoopContinued.WithGoto,
        [CompilerOptions_1.LuaTarget.LuaJIT]: scope_1.LoopContinued.WithGoto,
        [CompilerOptions_1.LuaTarget.Luau]: scope_1.LoopContinued.WithContinue,
    }[context.luaTarget];
    if (scope) {
        scope.loopContinued = continuedWith;
    }
    const tryScope = (0, typescript_1.isInAsyncFunction)(statement) ? (0, scope_1.findAsyncTryScopeBeforeLoop)(context) : undefined;
    if (tryScope) {
        tryScope.asyncTryHasContinue = continuedWith;
        return [
            lua.createAssignmentStatement(lua.createIdentifier("____hasContinued"), lua.createBooleanLiteral(true), statement),
            lua.createReturnStatement([], statement),
        ];
    }
    const label = `__continue${(_a = scope === null || scope === void 0 ? void 0 : scope.id) !== null && _a !== void 0 ? _a : ""}`;
    switch (continuedWith) {
        case scope_1.LoopContinued.WithGoto:
            return lua.createGotoStatement(label, statement);
        case scope_1.LoopContinued.WithContinue:
            return lua.createContinueStatement(statement);
        case scope_1.LoopContinued.WithRepeatBreak:
            return [
                lua.createAssignmentStatement(lua.createIdentifier(label), lua.createBooleanLiteral(true), statement),
                lua.createBreakStatement(statement),
            ];
    }
};
exports.transformContinueStatement = transformContinueStatement;
//# sourceMappingURL=break-continue.js.map