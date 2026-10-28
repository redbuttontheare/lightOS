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
exports.AnnotationKind = void 0;
exports.getSymbolAnnotations = getSymbolAnnotations;
exports.getTypeAnnotations = getTypeAnnotations;
exports.getNodeAnnotations = getNodeAnnotations;
exports.getFileAnnotations = getFileAnnotations;
const ts = __importStar(require("typescript"));
var AnnotationKind;
(function (AnnotationKind) {
    AnnotationKind["CustomConstructor"] = "customConstructor";
    AnnotationKind["CompileMembersOnly"] = "compileMembersOnly";
    AnnotationKind["NoResolution"] = "noResolution";
    AnnotationKind["NoSelf"] = "noSelf";
    AnnotationKind["CustomName"] = "customName";
    AnnotationKind["NoSelfInFile"] = "noSelfInFile";
})(AnnotationKind || (exports.AnnotationKind = AnnotationKind = {}));
const annotationValues = new Map(Object.values(AnnotationKind).map(k => [k.toLowerCase(), k]));
function collectAnnotations(source, annotationsMap) {
    var _a, _b;
    for (const tag of source.getJsDocTags()) {
        const tagName = annotationValues.get(tag.name.toLowerCase());
        if (!tagName)
            continue;
        const annotation = {
            kind: tag.name,
            args: (_b = (_a = tag.text) === null || _a === void 0 ? void 0 : _a.map(p => p.text)) !== null && _b !== void 0 ? _b : [],
        };
        annotationsMap.set(tagName, annotation);
    }
}
const symbolAnnotations = new WeakMap();
function getSymbolAnnotations(symbol) {
    const known = symbolAnnotations.get(symbol);
    if (known)
        return known;
    const annotationsMap = new Map();
    collectAnnotations(symbol, annotationsMap);
    symbolAnnotations.set(symbol, annotationsMap);
    return annotationsMap;
}
function getTypeAnnotations(type) {
    // types are not frequently repeatedly polled for annotations, so it's not worth caching them
    const annotationsMap = new Map();
    if (type.symbol) {
        getSymbolAnnotations(type.symbol).forEach((value, key) => {
            annotationsMap.set(key, value);
        });
    }
    if (type.aliasSymbol) {
        getSymbolAnnotations(type.aliasSymbol).forEach((value, key) => {
            annotationsMap.set(key, value);
        });
    }
    return annotationsMap;
}
const nodeAnnotations = new WeakMap();
function getNodeAnnotations(node) {
    const known = nodeAnnotations.get(node);
    if (known)
        return known;
    const annotationsMap = new Map();
    collectAnnotationsFromTags(annotationsMap, ts.getAllJSDocTags(node, ts.isJSDocUnknownTag));
    nodeAnnotations.set(node, annotationsMap);
    return annotationsMap;
}
function collectAnnotationsFromTags(annotationsMap, tags) {
    for (const tag of tags) {
        const tagName = annotationValues.get(tag.tagName.text.toLowerCase());
        if (!tagName)
            continue;
        annotationsMap.set(tagName, { kind: tagName, args: getTagArgsFromComment(tag) });
    }
}
const fileAnnotations = new WeakMap();
function getFileAnnotations(sourceFile) {
    const known = fileAnnotations.get(sourceFile);
    if (known)
        return known;
    const annotationsMap = new Map();
    if (sourceFile.statements.length > 0) {
        // Manually collect jsDoc because `getJSDocTags` includes tags only from closest comment
        const jsDoc = sourceFile.statements[0].jsDoc;
        if (jsDoc) {
            for (const jsDocElement of jsDoc) {
                if (jsDocElement.tags) {
                    collectAnnotationsFromTags(annotationsMap, jsDocElement.tags);
                }
            }
        }
    }
    fileAnnotations.set(sourceFile, annotationsMap);
    return annotationsMap;
}
function getTagArgsFromComment(tag) {
    if (tag.comment) {
        if (typeof tag.comment === "string") {
            const firstLine = tag.comment.split("\n")[0];
            return firstLine.trim().split(" ");
        }
        else {
            return tag.comment.map(part => part.text);
        }
    }
    return [];
}
//# sourceMappingURL=annotations.js.map