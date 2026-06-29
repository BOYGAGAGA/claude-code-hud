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
exports.getModelPricing = getModelPricing;
exports.modelContextLimit = modelContextLimit;
exports.parseSessionFile = parseSessionFile;
exports.listSessions = listSessions;
exports.calcDailySpend = calcDailySpend;
exports.findActiveSession = findActiveSession;
exports.getProjectDir = getProjectDir;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const MODEL_PRICING = {
    // ============================================
    // Anthropic Claude Models (anthropic.com/pricing)
    // ============================================
    // Claude Opus 4 - 200K context (most capable)
    'claude-opus-4-8': {
        contextLimit: 200000,
        inputCostPer1M: 15.0,
        outputCostPer1M: 75.0,
        cacheWriteCostPer1M: 18.75,
        cacheReadCostPer1M: 1.50,
    },
    'claude-opus-4-6': {
        contextLimit: 200000,
        inputCostPer1M: 15.0,
        outputCostPer1M: 75.0,
        cacheWriteCostPer1M: 18.75,
        cacheReadCostPer1M: 1.50,
    },
    'claude-opus-4': {
        contextLimit: 200000,
        inputCostPer1M: 15.0,
        outputCostPer1M: 75.0,
        cacheWriteCostPer1M: 18.75,
        cacheReadCostPer1M: 1.50,
    },
    // Claude Sonnet 4 - 200K context (balanced)
    'claude-sonnet-4-6': {
        contextLimit: 200000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWriteCostPer1M: 3.75,
        cacheReadCostPer1M: 0.30,
    },
    'claude-sonnet-4-5': {
        contextLimit: 200000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWriteCostPer1M: 3.75,
        cacheReadCostPer1M: 0.30,
    },
    'claude-sonnet-4': {
        contextLimit: 200000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWriteCostPer1M: 3.75,
        cacheReadCostPer1M: 0.30,
    },
    // Claude Haiku 3.5 - 200K context (fast & cheap)
    'claude-haiku-4-5': {
        contextLimit: 200000,
        inputCostPer1M: 0.80,
        outputCostPer1M: 4.0,
        cacheWriteCostPer1M: 1.0,
        cacheReadCostPer1M: 0.08,
    },
    'claude-haiku-4': {
        contextLimit: 200000,
        inputCostPer1M: 0.80,
        outputCostPer1M: 4.0,
        cacheWriteCostPer1M: 1.0,
        cacheReadCostPer1M: 0.08,
    },
    // Claude 3.x models
    'claude-opus-3': {
        contextLimit: 200000,
        inputCostPer1M: 15.0,
        outputCostPer1M: 75.0,
        cacheWriteCostPer1M: 18.75,
        cacheReadCostPer1M: 1.50,
    },
    'claude-sonnet-3-7': {
        contextLimit: 200000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWriteCostPer1M: 3.75,
        cacheReadCostPer1M: 0.30,
    },
    'claude-sonnet-3-5': {
        contextLimit: 200000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWriteCostPer1M: 3.75,
        cacheReadCostPer1M: 0.30,
    },
    'claude-haiku-3-5': {
        contextLimit: 200000,
        inputCostPer1M: 0.80,
        outputCostPer1M: 4.0,
        cacheWriteCostPer1M: 1.0,
        cacheReadCostPer1M: 0.08,
    },
    // Claude Fable 5 - model info not confirmed in official docs
    'claude-fable-5': {
        contextLimit: 200000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 15.0,
        cacheWriteCostPer1M: 3.75,
        cacheReadCostPer1M: 0.30,
    },
    // ============================================
    // DeepSeek Models (api-docs.deepseek.com)
    // Latest pricing as of 2026-06-27
    // ============================================
    'deepseek-v4-flash': {
        contextLimit: 1000000, // 1M context
        inputCostPer1M: 0.139, // ¥1/M
        outputCostPer1M: 0.278, // ¥2/M
        cacheWriteCostPer1M: 0.139, // ¥1/M (same as input)
        cacheReadCostPer1M: 0.0028, // ¥0.02/M (cache hit)
    },
    'deepseek-v4-pro': {
        contextLimit: 1000000, // 1M context
        inputCostPer1M: 0.417, // ¥3/M
        outputCostPer1M: 0.833, // ¥6/M
        cacheWriteCostPer1M: 0.417, // ¥3/M (same as input)
        cacheReadCostPer1M: 0.0035, // ¥0.025/M (cache hit)
    },
    'deepseek-chat': {
        contextLimit: 1000000, // Legacy alias for deepseek-v4-flash
        inputCostPer1M: 0.139,
        outputCostPer1M: 0.278,
        cacheWriteCostPer1M: 0.139,
        cacheReadCostPer1M: 0.0028,
    },
    'deepseek-reasoner': {
        contextLimit: 1000000, // Legacy alias for deepseek-v4-pro
        inputCostPer1M: 0.417,
        outputCostPer1M: 0.833,
        cacheWriteCostPer1M: 0.417,
        cacheReadCostPer1M: 0.0035,
    },
    'deepseek-v3': {
        contextLimit: 128000,
        inputCostPer1M: 0.27,
        outputCostPer1M: 1.10,
        cacheWriteCostPer1M: 0.27,
        cacheReadCostPer1M: 0.07,
    },
    'deepseek-r1': {
        contextLimit: 128000,
        inputCostPer1M: 0.55,
        outputCostPer1M: 2.19,
        cacheWriteCostPer1M: 0.55,
        cacheReadCostPer1M: 0.14,
    },
    'deepseek-coder': {
        contextLimit: 128000,
        inputCostPer1M: 0.14, // ¥1/M
        outputCostPer1M: 0.14,
        cacheWriteCostPer1M: 0.14,
        cacheReadCostPer1M: 0.014,
    },
    // ============================================
    // Alibaba Qwen Models (dashscope.aliyun.com)
    // ============================================
    'qwen-max': {
        contextLimit: 128000,
        inputCostPer1M: 0.56,
        outputCostPer1M: 2.22,
        cacheWriteCostPer1M: 0.56,
        cacheReadCostPer1M: 0.28,
    },
    'qwen-plus': {
        contextLimit: 128000,
        inputCostPer1M: 0.11,
        outputCostPer1M: 0.28,
        cacheWriteCostPer1M: 0.11,
        cacheReadCostPer1M: 0.03,
    },
    'qwen-turbo': {
        contextLimit: 128000,
        inputCostPer1M: 0.04,
        outputCostPer1M: 0.08,
        cacheWriteCostPer1M: 0.04,
        cacheReadCostPer1M: 0.00,
    },
    'qwen-long': {
        contextLimit: 1000000,
        inputCostPer1M: 0.07,
        outputCostPer1M: 0.28,
        cacheWriteCostPer1M: 0.07,
        cacheReadCostPer1M: 0.02,
    },
    // ============================================
    // Zhipu GLM Models (open.bigmodel.cn)
    // ============================================
    'glm-4': {
        contextLimit: 128000,
        inputCostPer1M: 13.89,
        outputCostPer1M: 13.89,
        cacheWriteCostPer1M: 13.89,
        cacheReadCostPer1M: 13.89,
    },
    'glm-4-plus': {
        contextLimit: 128000,
        inputCostPer1M: 6.94,
        outputCostPer1M: 6.94,
        cacheWriteCostPer1M: 6.94,
        cacheReadCostPer1M: 6.94,
    },
    'glm-4-air': {
        contextLimit: 128000,
        inputCostPer1M: 0.14,
        outputCostPer1M: 0.14,
        cacheWriteCostPer1M: 0.14,
        cacheReadCostPer1M: 0.14,
    },
    'glm-4-flash': {
        contextLimit: 128000,
        inputCostPer1M: 0.0,
        outputCostPer1M: 0.0,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0,
    },
    'glm-4v': {
        contextLimit: 128000,
        inputCostPer1M: 6.94,
        outputCostPer1M: 6.94,
        cacheWriteCostPer1M: 6.94,
        cacheReadCostPer1M: 6.94,
    },
    // ============================================
    // ByteDance Doubao Models (volcengine.com)
    // ============================================
    'doubao-pro-256k': {
        contextLimit: 256000,
        inputCostPer1M: 0.69,
        outputCostPer1M: 1.25,
        cacheWriteCostPer1M: 0.69,
        cacheReadCostPer1M: 0.69,
    },
    'doubao-pro-128k': {
        contextLimit: 128000,
        inputCostPer1M: 0.56,
        outputCostPer1M: 1.11,
        cacheWriteCostPer1M: 0.56,
        cacheReadCostPer1M: 0.56,
    },
    'doubao-pro-32k': {
        contextLimit: 32000,
        inputCostPer1M: 0.11,
        outputCostPer1M: 0.28,
        cacheWriteCostPer1M: 0.11,
        cacheReadCostPer1M: 0.11,
    },
    'doubao-lite-128k': {
        contextLimit: 128000,
        inputCostPer1M: 0.04,
        outputCostPer1M: 0.08,
        cacheWriteCostPer1M: 0.04,
        cacheReadCostPer1M: 0.04,
    },
    'doubao-lite-32k': {
        contextLimit: 32000,
        inputCostPer1M: 0.04,
        outputCostPer1M: 0.08,
        cacheWriteCostPer1M: 0.04,
        cacheReadCostPer1M: 0.04,
    },
    // ============================================
    // Xiaomi MiMo Models (mimo.mi.com)
    // Latest pricing as of 2026-06-24
    // ============================================
    'mimo-v2.5-pro': {
        contextLimit: 1000000, // 1M context
        inputCostPer1M: 0.435, // $0.435/M (¥3.00/M)
        outputCostPer1M: 0.87, // $0.87/M (¥6.00/M)
        cacheWriteCostPer1M: 0.0, // 缓存写入限时免费
        cacheReadCostPer1M: 0.0036, // $0.0036/M (¥0.025/M 缓存命中)
    },
    'mimo-v2.5': {
        contextLimit: 1000000, // 1M context
        inputCostPer1M: 0.14, // $0.14/M (¥1.00/M)
        outputCostPer1M: 0.28, // $0.28/M (¥2.00/M)
        cacheWriteCostPer1M: 0.0, // 缓存写入限时免费
        cacheReadCostPer1M: 0.0028, // $0.0028/M (¥0.02/M 缓存命中)
    },
    // V2 series (legacy, redirects to V2.5)
    'mimo-v2-pro': {
        contextLimit: 1000000, // 1M context
        inputCostPer1M: 0.435,
        outputCostPer1M: 0.87,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0036,
    },
    'mimo-v2-omni': {
        contextLimit: 1000000, // 1M context
        inputCostPer1M: 0.14,
        outputCostPer1M: 0.28,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0028,
    },
    'mimo-v2-flash': {
        contextLimit: 1000000, // 1M context
        inputCostPer1M: 0.14,
        outputCostPer1M: 0.28,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0028,
    },
    // ============================================
    // OpenAI Models (for reference)
    // ============================================
    'gpt-4o': {
        contextLimit: 128000,
        inputCostPer1M: 2.50,
        outputCostPer1M: 10.0,
        cacheWriteCostPer1M: 2.50,
        cacheReadCostPer1M: 1.25,
    },
    'gpt-4o-mini': {
        contextLimit: 128000,
        inputCostPer1M: 0.15,
        outputCostPer1M: 0.60,
        cacheWriteCostPer1M: 0.15,
        cacheReadCostPer1M: 0.075,
    },
    'gpt-4-turbo': {
        contextLimit: 128000,
        inputCostPer1M: 10.0,
        outputCostPer1M: 30.0,
        cacheWriteCostPer1M: 10.0,
        cacheReadCostPer1M: 5.0,
    },
    'o1': {
        contextLimit: 200000,
        inputCostPer1M: 15.0,
        outputCostPer1M: 60.0,
        cacheWriteCostPer1M: 15.0,
        cacheReadCostPer1M: 7.50,
    },
    'o1-mini': {
        contextLimit: 128000,
        inputCostPer1M: 3.0,
        outputCostPer1M: 12.0,
        cacheWriteCostPer1M: 3.0,
        cacheReadCostPer1M: 1.50,
    },
    'o3-mini': {
        contextLimit: 200000,
        inputCostPer1M: 1.10,
        outputCostPer1M: 4.40,
        cacheWriteCostPer1M: 1.10,
        cacheReadCostPer1M: 0.55,
    },
    // ============================================
    // Minimax Models (platform.minimaxi.com)
    // ============================================
    'abab6.5': {
        contextLimit: 200000,
        inputCostPer1M: 1.39, // ¥10/M
        outputCostPer1M: 1.39,
        cacheWriteCostPer1M: 1.39,
        cacheReadCostPer1M: 0.14,
    },
    'abab6.5s': {
        contextLimit: 200000,
        inputCostPer1M: 0.14, // ¥1/M
        outputCostPer1M: 0.14,
        cacheWriteCostPer1M: 0.14,
        cacheReadCostPer1M: 0.014,
    },
    'abab6.5t': {
        contextLimit: 200000,
        inputCostPer1M: 0.07, // ¥0.5/M
        outputCostPer1M: 0.07,
        cacheWriteCostPer1M: 0.07,
        cacheReadCostPer1M: 0.007,
    },
    'abab5.5': {
        contextLimit: 128000,
        inputCostPer1M: 0.014, // ¥0.1/M
        outputCostPer1M: 0.014,
        cacheWriteCostPer1M: 0.014,
        cacheReadCostPer1M: 0.001,
    },
    // ============================================
    // Baidu ERNIE Models (cloud.baidu.com)
    // ============================================
    'ernie-4.0': {
        contextLimit: 128000,
        inputCostPer1M: 16.67, // ¥120/M (¥0.12/千tokens)
        outputCostPer1M: 16.67,
        cacheWriteCostPer1M: 16.67,
        cacheReadCostPer1M: 1.67,
    },
    'ernie-4.0-turbo': {
        contextLimit: 128000,
        inputCostPer1M: 2.78, // ¥20/M
        outputCostPer1M: 2.78,
        cacheWriteCostPer1M: 2.78,
        cacheReadCostPer1M: 0.28,
    },
    'ernie-3.5': {
        contextLimit: 128000,
        inputCostPer1M: 0.28, // ¥2/M
        outputCostPer1M: 0.28,
        cacheWriteCostPer1M: 0.28,
        cacheReadCostPer1M: 0.028,
    },
    'ernie-speed': {
        contextLimit: 128000,
        inputCostPer1M: 0.0, // Free
        outputCostPer1M: 0.0,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0,
    },
    'ernie-lite': {
        contextLimit: 128000,
        inputCostPer1M: 0.0, // Free
        outputCostPer1M: 0.0,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0,
    },
    // ============================================
    // Moonshot/Kimi Models (platform.moonshot.cn)
    // ============================================
    'moonshot-v1-128k': {
        contextLimit: 128000,
        inputCostPer1M: 1.74, // ¥12.5/M
        outputCostPer1M: 1.74,
        cacheWriteCostPer1M: 1.74,
        cacheReadCostPer1M: 0.17,
    },
    'moonshot-v1-32k': {
        contextLimit: 32000,
        inputCostPer1M: 1.74,
        outputCostPer1M: 1.74,
        cacheWriteCostPer1M: 1.74,
        cacheReadCostPer1M: 0.17,
    },
    'moonshot-v1-8k': {
        contextLimit: 8000,
        inputCostPer1M: 1.74,
        outputCostPer1M: 1.74,
        cacheWriteCostPer1M: 1.74,
        cacheReadCostPer1M: 0.17,
    },
    // ============================================
    // StepFun/阶跃星辰 Models (platform.stepfun.com)
    // ============================================
    'step-2-16k': {
        contextLimit: 16000,
        inputCostPer1M: 0.69, // ¥5/M
        outputCostPer1M: 0.69,
        cacheWriteCostPer1M: 0.69,
        cacheReadCostPer1M: 0.07,
    },
    'step-1-flash': {
        contextLimit: 128000,
        inputCostPer1M: 0.0, // Free
        outputCostPer1M: 0.0,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0,
    },
    'step-1-32k': {
        contextLimit: 32000,
        inputCostPer1M: 2.78, // ¥20/M
        outputCostPer1M: 2.78,
        cacheWriteCostPer1M: 2.78,
        cacheReadCostPer1M: 0.28,
    },
    // ============================================
    // SenseTime 商汤 Models (platform.sensenova.cn)
    // ============================================
    'sensechat-5': {
        contextLimit: 128000,
        inputCostPer1M: 0.125, // ¥0.9/M
        outputCostPer1M: 0.125,
        cacheWriteCostPer1M: 0.125,
        cacheReadCostPer1M: 0.012,
    },
    'sensechat-turbo': {
        contextLimit: 128000,
        inputCostPer1M: 0.014, // ¥0.1/M
        outputCostPer1M: 0.014,
        cacheWriteCostPer1M: 0.014,
        cacheReadCostPer1M: 0.001,
    },
    // ============================================
    // Baichuan 百川 Models (platform.baichuan-ai.com)
    // ============================================
    'baichuan4': {
        contextLimit: 128000,
        inputCostPer1M: 1.39, // ¥10/M
        outputCostPer1M: 1.39,
        cacheWriteCostPer1M: 1.39,
        cacheReadCostPer1M: 0.14,
    },
    'baichuan3-turbo': {
        contextLimit: 128000,
        inputCostPer1M: 0.14, // ¥1/M
        outputCostPer1M: 0.14,
        cacheWriteCostPer1M: 0.14,
        cacheReadCostPer1M: 0.014,
    },
    // ============================================
    // Yi/零一万物 Models (platform.lingyiwanwu.com)
    // ============================================
    'yi-lightning': {
        contextLimit: 128000,
        inputCostPer1M: 0.14, // ¥1/M
        outputCostPer1M: 0.14,
        cacheWriteCostPer1M: 0.14,
        cacheReadCostPer1M: 0.014,
    },
    'yi-large': {
        contextLimit: 128000,
        inputCostPer1M: 2.78, // ¥20/M
        outputCostPer1M: 2.78,
        cacheWriteCostPer1M: 2.78,
        cacheReadCostPer1M: 0.28,
    },
    'yi-medium': {
        contextLimit: 128000,
        inputCostPer1M: 0.28, // ¥2/M
        outputCostPer1M: 0.28,
        cacheWriteCostPer1M: 0.28,
        cacheReadCostPer1M: 0.028,
    },
    // ============================================
    // Spark 讯飞星火 Models (xinghuo.xfyun.cn)
    // ============================================
    'spark-max': {
        contextLimit: 128000,
        inputCostPer1M: 0.69, // ¥5/M
        outputCostPer1M: 0.69,
        cacheWriteCostPer1M: 0.69,
        cacheReadCostPer1M: 0.07,
    },
    'spark-pro': {
        contextLimit: 128000,
        inputCostPer1M: 0.14, // ¥1/M
        outputCostPer1M: 0.14,
        cacheWriteCostPer1M: 0.14,
        cacheReadCostPer1M: 0.014,
    },
    'spark-lite': {
        contextLimit: 128000,
        inputCostPer1M: 0.0, // Free
        outputCostPer1M: 0.0,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0,
    },
    // ============================================
    // Hunyuan 腾讯混元 Models (cloud.tencent.com)
    // ============================================
    'hunyuan-pro': {
        contextLimit: 128000,
        inputCostPer1M: 0.42, // ¥3/M
        outputCostPer1M: 0.42,
        cacheWriteCostPer1M: 0.42,
        cacheReadCostPer1M: 0.04,
    },
    'hunyuan-standard': {
        contextLimit: 128000,
        inputCostPer1M: 0.014, // ¥0.1/M
        outputCostPer1M: 0.014,
        cacheWriteCostPer1M: 0.014,
        cacheReadCostPer1M: 0.001,
    },
    'hunyuan-lite': {
        contextLimit: 128000,
        inputCostPer1M: 0.0, // Free
        outputCostPer1M: 0.0,
        cacheWriteCostPer1M: 0.0,
        cacheReadCostPer1M: 0.0,
    },
    // ============================================
    // SiliconFlow 硅基流动 Models (siliconflow.cn)
    // ============================================
    'deepseek-v4-flash-siliconflow': {
        contextLimit: 1000000,
        inputCostPer1M: 0.139,
        outputCostPer1M: 0.278,
        cacheWriteCostPer1M: 0.139,
        cacheReadCostPer1M: 0.0028,
    },
    'deepseek-v4-pro-siliconflow': {
        contextLimit: 1000000,
        inputCostPer1M: 0.417,
        outputCostPer1M: 0.833,
        cacheWriteCostPer1M: 0.417,
        cacheReadCostPer1M: 0.0035,
    },
    'deepseek-v3-siliconflow': {
        contextLimit: 128000,
        inputCostPer1M: 0.27,
        outputCostPer1M: 1.10,
        cacheWriteCostPer1M: 0.27,
        cacheReadCostPer1M: 0.07,
    },
    'deepseek-r1-siliconflow': {
        contextLimit: 128000,
        inputCostPer1M: 0.55,
        outputCostPer1M: 2.19,
        cacheWriteCostPer1M: 0.55,
        cacheReadCostPer1M: 0.14,
    },
    'qwen2.5-72b-siliconflow': {
        contextLimit: 128000,
        inputCostPer1M: 0.14,
        outputCostPer1M: 0.14,
        cacheWriteCostPer1M: 0.14,
        cacheReadCostPer1M: 0.014,
    },
    // ============================================
    // Groq Models (groq.com) - for reference
    // ============================================
    'llama-3.1-70b-groq': {
        contextLimit: 128000,
        inputCostPer1M: 0.59,
        outputCostPer1M: 0.79,
        cacheWriteCostPer1M: 0.59,
        cacheReadCostPer1M: 0.059,
    },
    'llama-3.1-8b-groq': {
        contextLimit: 128000,
        inputCostPer1M: 0.05,
        outputCostPer1M: 0.08,
        cacheWriteCostPer1M: 0.05,
        cacheReadCostPer1M: 0.005,
    },
    'mixtral-8x7b-groq': {
        contextLimit: 32000,
        inputCostPer1M: 0.24,
        outputCostPer1M: 0.24,
        cacheWriteCostPer1M: 0.24,
        cacheReadCostPer1M: 0.024,
    },
};
// Default pricing (Claude Sonnet 4.x)
const DEFAULT_PRICING = {
    contextLimit: 200000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    cacheWriteCostPer1M: 3.75,
    cacheReadCostPer1M: 0.30,
};
function getModelPricing(model) {
    // Clean model name: remove date suffixes, region prefixes, provider prefixes
    let clean = model
        .replace(/^[a-z]{2}\.anthropic\./, '') // us.anthropic.claude-xxx -> claude-xxx
        .replace(/-\d{8}$/, '') // claude-sonnet-4-6-20250522 -> claude-sonnet-4-6
        .replace(/^(openai|deepseek|qwen|glm|doubao|mimo|minimax|ernie|moonshot|step|sense|baichuan|yi|spark|hunyuan|siliconflow|groq)\//, '')
        .replace(/^(volcengine|ark)\//, '') // volcengine/doubao -> doubao
        .replace(/^(baidu)\//, '') // baidu/ernie -> ernie
        .replace(/^(zhipu|bigmodel)\//, '') // zhipu/glm -> glm
        .replace(/^(moonshot)\//, '') // moonshot/moonshot-v1 -> moonshot-v1
        .replace(/^(stepfun)\//, '') // stepfun/step -> step
        .replace(/^(sensenova)\//, '') // sensenova/sensechat -> sensechat
        .replace(/^(baichuan)\//, '') // baichuan/baichuan4 -> baichuan4
        .replace(/^(lingyiwanwu)\//, '') // lingyiwanwu/yi -> yi
        .replace(/^(xfyun)\//, '') // xfyun/spark -> spark
        .replace(/^(tencent)\//, '') // tencent/hunyuan -> hunyuan
        .toLowerCase();
    // Direct match
    if (MODEL_PRICING[clean]) {
        return MODEL_PRICING[clean];
    }
    // Fuzzy match: find the longest matching prefix
    const candidates = Object.keys(MODEL_PRICING)
        .filter(key => clean.startsWith(key) || key.startsWith(clean))
        .sort((a, b) => b.length - a.length);
    if (candidates.length > 0) {
        return MODEL_PRICING[candidates[0]];
    }
    // Try matching by family (e.g., "claude-3-5-sonnet" matches "claude-sonnet-3-5")
    const familyMatch = Object.keys(MODEL_PRICING).find(key => {
        const keyParts = key.split('-').sort();
        const cleanParts = clean.split('-').sort();
        return keyParts.join('-') === cleanParts.join('-');
    });
    if (familyMatch) {
        return MODEL_PRICING[familyMatch];
    }
    return DEFAULT_PRICING;
}
function modelContextLimit(model) {
    return getModelPricing(model).contextLimit;
}
function calcCost(tokens, ratePerMillion) {
    return (tokens / 1000000) * ratePerMillion;
}
function parseSessionFile(filePath, config) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    }
    catch {
        return null;
    }
    const lines = content.trim().split('\n');
    const usage = {
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
    };
    let model = 'unknown';
    let sessionId = '';
    let sessionTitle = '';
    const todos = [];
    let todoMap = new Map();
    let agentTaskMap = new Map();
    const toolCounts = {};
    let webSearches = 0;
    let webFetches = 0;
    let rounds = 0;
    let lastTodoWriteIndex = -1; // Track the last TodoWrite call index
    // Try to get title from Claude Code history first
    const historyTitles = readHistoryTitles();
    for (const line of lines) {
        if (!line.trim())
            continue;
        let entry;
        try {
            entry = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (!sessionId && entry.sessionId) {
            sessionId = entry.sessionId;
        }
        // Claude Code stores AI-generated title as type="ai-title" with aiTitle field
        if (!sessionTitle && entry.type === 'ai-title' && entry.aiTitle) {
            sessionTitle = entry.aiTitle;
        }
        // Fallback: try first user message (only if ai-title not found yet)
        if (!sessionTitle && entry.type === 'user') {
            const msg = entry.message;
            const content = msg?.content;
            if (typeof content === 'string') {
                sessionTitle = content;
            }
            else if (Array.isArray(content)) {
                for (const c of content) {
                    if (c && typeof c === 'object' && c.type === 'text') {
                        sessionTitle = c.text || '';
                        break;
                    }
                }
            }
        }
        if (entry.type !== 'assistant')
            continue;
        const msg = entry.message;
        if (!msg)
            continue;
        if (msg.model && msg.model !== '<synthetic>') {
            model = msg.model;
        }
        const u = msg.usage;
        if (u) {
            const msgInputTokens = (u.input_tokens || 0);
            const msgOutputTokens = (u.output_tokens || 0);
            const msgCacheCreate = (u.cache_creation_input_tokens || 0);
            const msgCacheRead = (u.cache_read_input_tokens || 0);
            usage.inputTokens += msgInputTokens;
            usage.outputTokens += msgOutputTokens;
            usage.cacheCreationTokens += msgCacheCreate;
            usage.cacheReadTokens += msgCacheRead;
            const stu = u.server_tool_use;
            if (stu) {
                webSearches += stu.web_search_requests || 0;
                webFetches += stu.web_fetch_requests || 0;
            }
            if (msgInputTokens > 0 || msgOutputTokens > 0) {
                rounds++;
            }
        }
        const content = msg.content;
        if (Array.isArray(content)) {
            for (const item of content) {
                if (item.type === 'tool_use' && typeof item.name === 'string') {
                    const name = item.name;
                    toolCounts[name] = (toolCounts[name] || 0) + 1;
                    if (name === 'TodoWrite') {
                        const input = item.input;
                        const todosArr = input?.todos;
                        if (Array.isArray(todosArr)) {
                            // Detect new round: if this TodoWrite has different tasks than before
                            // Clear old tasks to show only current round
                            const currentKeys = new Set(todosArr.map((t) => t.content || t.activeForm || ''));
                            const existingKeys = new Set(todoMap.keys());
                            // If more than half the tasks are new, treat as new round
                            let newCount = 0;
                            for (const key of currentKeys) {
                                if (!existingKeys.has(key))
                                    newCount++;
                            }
                            if (newCount > currentKeys.size / 2 && currentKeys.size > 0) {
                                // New round detected - clear old tasks
                                todoMap.clear();
                                agentTaskMap.clear();
                            }
                            for (const t of todosArr) {
                                const key = t.content || t.activeForm || '';
                                const todoItem = {
                                    content: key,
                                    status: t.status || 'pending',
                                    model: msg.model || model,
                                };
                                // Detect agent-prefixed tasks: "Agent-X: task description", "[Agent-X] task", "Agent X: task", etc.
                                const agentMatch = key.match(/^(?:\[)?(?:Agent[-_\s]?([A-Za-z0-9]+))[\]]?:?\s*/i);
                                if (agentMatch) {
                                    const agentName = `Agent-${agentMatch[1]}`;
                                    const taskContent = key.slice(agentMatch[0].length);
                                    if (!agentTaskMap.has(agentName)) {
                                        agentTaskMap.set(agentName, new Map());
                                    }
                                    const agentMap = agentTaskMap.get(agentName);
                                    const agentKey = taskContent;
                                    const existingAgent = agentMap.get(agentKey);
                                    if (!existingAgent || existingAgent.status !== 'completed') {
                                        agentMap.set(agentKey, { ...todoItem, content: taskContent });
                                    }
                                }
                                else {
                                    // Regular task (not agent-prefixed)
                                    const existing = todoMap.get(key);
                                    if (!existing || existing.status !== 'completed') {
                                        todoMap.set(key, todoItem);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    for (const [, todo] of todoMap) {
        todos.push(todo);
    }
    // Build agent groups
    const agents = [];
    for (const [agentName, agentMap] of agentTaskMap) {
        const tasks = [];
        for (const [, task] of agentMap) {
            tasks.push(task);
        }
        const doneCount = tasks.filter(t => t.status === 'completed').length;
        const totalCount = tasks.length;
        agents.push({
            name: agentName,
            tasks,
            doneCount,
            totalCount,
            pct: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
        });
    }
    // Sort agents by name
    agents.sort((a, b) => a.name.localeCompare(b.name));
    // Get model-specific pricing (auto-detect from model name)
    const modelPricing = getModelPricing(model);
    const pricing = {
        inputPer1M: config.inputCostPer1M,
        outputPer1M: config.outputCostPer1M,
        cacheWritePer1M: config.cacheWriteCostPer1M,
        cacheReadPer1M: config.cacheReadCostPer1M,
    };
    // Use model pricing if config is default (not manually set)
    const effectivePricing = {
        inputPer1M: pricing.inputPer1M,
        outputPer1M: pricing.outputPer1M,
        cacheWritePer1M: pricing.cacheWritePer1M,
        cacheReadPer1M: pricing.cacheReadPer1M,
    };
    const inputCost = calcCost(usage.inputTokens, effectivePricing.inputPer1M);
    const outputCost = calcCost(usage.outputTokens, effectivePricing.outputPer1M);
    const cacheWriteCost = calcCost(usage.cacheCreationTokens, effectivePricing.cacheWritePer1M);
    const cacheReadCost = calcCost(usage.cacheReadTokens, effectivePricing.cacheReadPer1M);
    const savedByCacheUSD = calcCost(usage.cacheReadTokens, effectivePricing.inputPer1M - effectivePricing.cacheReadPer1M);
    const totalInputForCache = usage.inputTokens + usage.cacheReadTokens;
    const hitRate = totalInputForCache > 0 ? usage.cacheReadTokens / totalInputForCache : 0;
    const cachedTokens = usage.cacheCreationTokens + usage.cacheReadTokens;
    const minCostPerRound = calcCost(cachedTokens, effectivePricing.cacheReadPer1M);
    return {
        sessionId,
        sessionFile: filePath,
        // Title priority: ai-title from jsonl > history.jsonl display > first user message
        sessionTitle: (sessionTitle.trim() || (sessionId && historyTitles.has(sessionId) ? historyTitles.get(sessionId) : '') || 'Untitled Session'),
        usage,
        cost: {
            inputCost,
            outputCost,
            cacheWriteCost,
            cacheReadCost,
            totalCost: inputCost + outputCost + cacheWriteCost + cacheReadCost,
            savedByCacheUSD,
        },
        cache: {
            totalInputTokens: totalInputForCache,
            cacheReadTokens: usage.cacheReadTokens,
            cacheCreationTokens: usage.cacheCreationTokens,
            hitRate,
        },
        tools: {
            counts: toolCounts,
            webSearches,
            webFetches,
        },
        bloat: {
            rounds,
            minCostPerRound,
        },
        todos,
        agents,
        model,
        pricing: {
            inputPer1M: effectivePricing.inputPer1M,
            outputPer1M: effectivePricing.outputPer1M,
            cacheWritePer1M: effectivePricing.cacheWritePer1M,
            cacheReadPer1M: effectivePricing.cacheReadPer1M,
        },
        lastUpdated: new Date(),
        contextLimit: config.contextLimit ?? modelPricing.contextLimit,
        contextLimitSource: config.contextLimit != null ? 'config' : 'auto',
    };
}
// Get active session IDs from ~/.claude/sessions/
function getActiveSessionIds() {
    const sessionsDir = path.join(os.homedir(), '.claude', 'sessions');
    const activeIds = new Set();
    try {
        if (fs.existsSync(sessionsDir)) {
            for (const f of fs.readdirSync(sessionsDir)) {
                if (!f.endsWith('.json'))
                    continue;
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(sessionsDir, f), 'utf8'));
                    if (data.sessionId) {
                        activeIds.add(data.sessionId);
                    }
                }
                catch { /* skip */ }
            }
        }
    }
    catch { /* skip */ }
    return activeIds;
}
// Read session titles from Claude Code history file
function readHistoryTitles() {
    const historyFile = path.join(os.homedir(), '.claude', 'history.jsonl');
    const titles = new Map();
    try {
        if (fs.existsSync(historyFile)) {
            const content = fs.readFileSync(historyFile, 'utf8');
            for (const line of content.split('\n')) {
                if (!line.trim())
                    continue;
                try {
                    const entry = JSON.parse(line);
                    if (entry.sessionId && entry.display) {
                        titles.set(entry.sessionId, entry.display);
                    }
                }
                catch { /* skip */ }
            }
        }
    }
    catch { /* skip */ }
    return titles;
}
function listSessions(workspacePath, limit = 8) {
    const projectDir = resolveProjectDir(workspacePath);
    if (!projectDir)
        return [];
    const activeSessionIds = getActiveSessionIds();
    const historyTitles = readHistoryTitles();
    const allSessions = fs.readdirSync(projectDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => {
        const fp = path.join(projectDir, f);
        const mtime = fs.statSync(fp).mtime.getTime();
        const sessionId = path.basename(fp, '.jsonl');
        return { filePath: fp, sessionId, mtime };
    })
        .sort((a, b) => b.mtime - a.mtime);
    // Filter: ONLY show active sessions. Fall back to recent (24h) only when none active.
    const activeSessions = allSessions.filter(s => activeSessionIds.has(s.sessionId));
    let selected;
    if (activeSessions.length > 0) {
        // Has active sessions — show only those, sorted by most recent first
        selected = activeSessions.slice(0, limit);
    }
    else {
        // No active sessions — fall back to recently modified (24h)
        const recentSessions = allSessions.filter(s => (Date.now() - s.mtime) < 24 * 60 * 60 * 1000);
        selected = recentSessions.slice(0, limit);
    }
    return selected.map(({ filePath, mtime, sessionId }) => {
        // Use Claude Code's own AI-generated title, fall back to history, then first user message
        const title = historyTitles.get(sessionId)
            ?? readAiTitle(filePath)
            ?? readFirstUserMessage(filePath);
        return { filePath, sessionId, title, mtime };
    });
}
function cleanTitle(raw, maxLen = 60) {
    let title = raw
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/<[^>]+>/g, '') // Remove HTML/XML tags
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/^[\s.,;:!?，。；：！？]+/, '') // Trim leading punctuation
        .trim();
    // If title is too long, find a good cut point
    if (title.length > maxLen) {
        const cutPoints = title.slice(0, maxLen).match(/[.,;:!?，。；：！？\s]/g);
        if (cutPoints) {
            const lastCut = title.lastIndexOf(cutPoints[cutPoints.length - 1], maxLen);
            if (lastCut > maxLen / 2) {
                title = title.slice(0, lastCut).trim() + '…';
            }
            else {
                title = title.slice(0, maxLen) + '…';
            }
        }
        else {
            title = title.slice(0, maxLen) + '…';
        }
    }
    return title || 'Untitled Session';
}
function readAiTitle(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // ai-title entries appear early in the file (right after first user message)
        for (const line of content.split('\n')) {
            if (!line.trim())
                continue;
            try {
                const d = JSON.parse(line);
                if (d.type === 'ai-title' && d.aiTitle) {
                    return d.aiTitle.trim();
                }
            }
            catch { /* skip */ }
        }
    }
    catch { /* skip */ }
    return null;
}
function readFirstUserMessage(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        for (const line of content.split('\n')) {
            if (!line.trim())
                continue;
            try {
                const d = JSON.parse(line);
                if (d.type !== 'user')
                    continue;
                const msg = d.message;
                const c = msg?.content;
                let candidate = null;
                if (typeof c === 'string' && c.trim())
                    candidate = c.trim();
                if (Array.isArray(c)) {
                    for (const item of c) {
                        if (item?.type === 'text' && typeof item.text === 'string' && item.text.trim()) {
                            candidate = item.text.trim();
                            break;
                        }
                    }
                }
                if (candidate) {
                    // Skip system messages: IDE notifications, system reminders, user-info
                    if (candidate.startsWith('<ide_') ||
                        candidate.startsWith('<system-') ||
                        candidate.startsWith('<user-info') ||
                        candidate.startsWith('<gitStatus') ||
                        candidate.startsWith('Continue from where') ||
                        candidate.length < 3) {
                        continue;
                    }
                    return cleanTitle(candidate);
                }
            }
            catch { /* skip */ }
        }
    }
    catch { /* skip */ }
    return 'Untitled Session';
}
// FIXED: Handle Windows paths properly
function encodePath(workspacePath) {
    return workspacePath
        .replace(/[:\\\/_\s]/g, '-') // Replace : \ / _ space with -
        .replace(/^-/, '') // Remove leading dash
        .replace(/-+/g, '-'); // Collapse multiple dashes
}
function resolveProjectDir(workspacePath) {
    const claudeDir = path.join(os.homedir(), '.claude', 'projects');
    if (!fs.existsSync(claudeDir))
        return null;
    const allProjects = fs.readdirSync(claudeDir);
    const encoded = encodePath(workspacePath);
    // Exact match
    const exactMatch = allProjects.find(p => encodePath(p) === encoded);
    if (exactMatch)
        return path.join(claudeDir, exactMatch);
    // Suffix match (for paths that might have different prefixes)
    const suffixMatch = allProjects
        .filter(p => {
        const pEncoded = encodePath(p);
        return encoded.endsWith(pEncoded) || pEncoded.endsWith(encoded);
    })
        .sort((a, b) => b.length - a.length)[0];
    return suffixMatch ? path.join(claudeDir, suffixMatch) : null;
}
function calcDailySpend(workspacePath, config, days = 7) {
    const dir = resolveProjectDir(workspacePath);
    if (!dir)
        return [];
    const cutoff = Date.now() - days * 86400000;
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(dir, f))
        .filter(fp => fs.statSync(fp).mtime.getTime() >= cutoff);
    const byDay = {};
    for (const fp of files) {
        let content;
        try {
            content = fs.readFileSync(fp, 'utf8');
        }
        catch {
            continue;
        }
        for (const line of content.split('\n')) {
            if (!line.trim())
                continue;
            try {
                const d = JSON.parse(line);
                if (d.type !== 'assistant')
                    continue;
                const msg = d.message;
                const u = msg?.usage;
                if (!u)
                    continue;
                const ts = d.timestamp;
                if (!ts)
                    continue;
                const day = ts.slice(0, 10);
                // Get model-specific pricing for this message
                const model = msg.model || 'unknown';
                const modelPricing = getModelPricing(model);
                const cost = calcCost(u.input_tokens || 0, modelPricing.inputCostPer1M) +
                    calcCost(u.output_tokens || 0, modelPricing.outputCostPer1M) +
                    calcCost(u.cache_creation_input_tokens || 0, modelPricing.cacheWriteCostPer1M) +
                    calcCost(u.cache_read_input_tokens || 0, modelPricing.cacheReadCostPer1M);
                byDay[day] = (byDay[day] || 0) + cost;
            }
            catch { /* skip */ }
        }
    }
    return Object.entries(byDay)
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
function findActiveSession(workspacePath) {
    const dir = resolveProjectDir(workspacePath);
    if (!dir)
        return null;
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => ({ fp: path.join(dir, f), mtime: fs.statSync(path.join(dir, f)).mtime.getTime() }))
        .sort((a, b) => b.mtime - a.mtime);
    return files.length > 0 ? files[0].fp : null;
}
function getProjectDir(workspacePath) {
    return resolveProjectDir(workspacePath);
}
//# sourceMappingURL=parser.js.map