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
exports.typeAlwaysHasSomeOfFlags = typeAlwaysHasSomeOfFlags;
exports.typeCanHaveSomeOfFlags = typeCanHaveSomeOfFlags;
exports.isStringType = isStringType;
exports.isNumberType = isNumberType;
exports.forTypeOrAnySupertype = forTypeOrAnySupertype;
exports.isArrayType = isArrayType;
exports.isAlwaysArrayType = isAlwaysArrayType;
exports.isFunctionType = isFunctionType;
exports.canBeFalsy = canBeFalsy;
exports.canBeFalsyWhenNotNull = canBeFalsyWhenNotNull;
const ts = __importStar(require("typescript"));
function typeAlwaysHasSomeOfFlags(context, type, flags) {
    const baseConstraint = context.checker.getBaseConstraintOfType(type);
    if (baseConstraint) {
        type = baseConstraint;
    }
    if (type.flags & flags) {
        return true;
    }
    if (type.isUnion()) {
        return type.types.every(t => typeAlwaysHasSomeOfFlags(context, t, flags));
    }
    if (type.isIntersection()) {
        return type.types.some(t => typeAlwaysHasSomeOfFlags(context, t, flags));
    }
    return false;
}
function typeCanHaveSomeOfFlags(context, type, flags) {
    const baseConstraint = context.checker.getBaseConstraintOfType(type);
    if (!baseConstraint) {
        // type parameter with no constraint can be anything, assume it might satisfy predicate
        if (type.isTypeParameter())
            return true;
    }
    else {
        type = baseConstraint;
    }
    if (type.flags & flags) {
        return true;
    }
    if (type.isUnion()) {
        return type.types.some(t => typeCanHaveSomeOfFlags(context, t, flags));
    }
    if (type.isIntersection()) {
        return type.types.some(t => typeCanHaveSomeOfFlags(context, t, flags));
    }
    return false;
}
function isStringType(context, type) {
    return typeAlwaysHasSomeOfFlags(context, type, ts.TypeFlags.StringLike);
}
function isNumberType(context, type) {
    return typeAlwaysHasSomeOfFlags(context, type, ts.TypeFlags.NumberLike);
}
function isExplicitArrayType(context, type) {
    if (context.checker.isArrayType(type) || context.checker.isTupleType(type))
        return true;
    if (type.isUnionOrIntersection()) {
        if (type.types.some(t => isExplicitArrayType(context, t))) {
            return true;
        }
    }
    const baseTypes = type.getBaseTypes();
    if (baseTypes) {
        if (baseTypes.some(t => isExplicitArrayType(context, t))) {
            return true;
        }
    }
    if (type.symbol) {
        const baseConstraint = context.checker.getBaseConstraintOfType(type);
        if (baseConstraint && baseConstraint !== type) {
            return isExplicitArrayType(context, baseConstraint);
        }
    }
    return false;
}
function isAlwaysExplicitArrayType(context, type) {
    if (context.checker.isArrayType(type) || context.checker.isTupleType(type))
        return true;
    if (type.symbol) {
        const baseConstraint = context.checker.getBaseConstraintOfType(type);
        if (baseConstraint && baseConstraint !== type) {
            return isAlwaysExplicitArrayType(context, baseConstraint);
        }
    }
    if (type.isUnionOrIntersection()) {
        return type.types.every(t => isAlwaysExplicitArrayType(context, t));
    }
    return false;
}
/**
 * Iterate over a type and its bases until the callback returns true.
 */
function forTypeOrAnySupertype(context, type, predicate) {
    if (predicate(type)) {
        return true;
    }
    if (!type.isClassOrInterface() && type.symbol) {
        type = context.checker.getDeclaredTypeOfSymbol(type.symbol);
    }
    const baseTypes = type.getBaseTypes();
    if (!baseTypes)
        return false;
    return baseTypes.some(superType => forTypeOrAnySupertype(context, superType, predicate));
}
function isArrayType(context, type) {
    return forTypeOrAnySupertype(context, type, t => isExplicitArrayType(context, t));
}
function isAlwaysArrayType(context, type) {
    return forTypeOrAnySupertype(context, type, t => isAlwaysExplicitArrayType(context, t));
}
function isFunctionType(type) {
    return type.getCallSignatures().length > 0;
}
function canBeFalsy(context, type) {
    const strictNullChecks = context.options.strict === true || context.options.strictNullChecks === true;
    if (!strictNullChecks && !type.isLiteral())
        return true;
    const falsyFlags = ts.TypeFlags.Boolean |
        ts.TypeFlags.BooleanLiteral |
        ts.TypeFlags.Never |
        ts.TypeFlags.Void |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.Any |
        ts.TypeFlags.Undefined |
        ts.TypeFlags.Null;
    return typeCanHaveSomeOfFlags(context, type, falsyFlags);
}
function canBeFalsyWhenNotNull(context, type) {
    const falsyFlags = ts.TypeFlags.Boolean |
        ts.TypeFlags.BooleanLiteral |
        ts.TypeFlags.Never |
        ts.TypeFlags.Void |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.Any;
    return typeCanHaveSomeOfFlags(context, type, falsyFlags);
}
//# sourceMappingURL=types.js.map