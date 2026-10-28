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
exports.getPlugins = getPlugins;
const utils_1 = require("./utils");
const performance = __importStar(require("../measure-performance"));
function getPlugins(program) {
    var _a;
    performance.startSection("getPlugins");
    const diagnostics = [];
    const pluginsFromOptions = [];
    const options = program.getCompilerOptions();
    for (const [index, pluginOption] of ((_a = options.luaPlugins) !== null && _a !== void 0 ? _a : []).entries()) {
        const optionName = `tstl.luaPlugins[${index}]`;
        const factory = (() => {
            if ("plugin" in pluginOption) {
                return pluginOption.plugin;
            }
            else {
                const { error: resolveError, result: factory } = (0, utils_1.resolvePlugin)("plugin", `${optionName}.name`, (0, utils_1.getConfigDirectory)(options), pluginOption.name, pluginOption.import);
                if (resolveError)
                    diagnostics.push(resolveError);
                return factory;
            }
        })();
        if (factory === undefined)
            continue;
        const plugin = typeof factory === "function" ? factory(pluginOption) : factory;
        pluginsFromOptions.push(plugin);
    }
    if (options.tstlVerbose) {
        console.log(`Loaded ${pluginsFromOptions.length} plugins`);
    }
    performance.endSection("getPlugins");
    return { diagnostics, plugins: pluginsFromOptions };
}
//# sourceMappingURL=plugins.js.map