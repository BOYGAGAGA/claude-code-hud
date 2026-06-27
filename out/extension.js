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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const hudView_1 = require("./hudView");
const parser_1 = require("./parser");
let refreshTimer;
let fileWatcher;
let statusBarItem;
let pinnedSessionFile = null;
let previewMode = false;
const CONFIG_PATH = path.join(os.homedir(), '.claude', 'claude-code-hud.json');
const DEFAULT_CONFIG = {
    refreshInterval: 3000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    cacheWriteCostPer1M: 3.75,
    cacheReadCostPer1M: 0.30,
};
function ensureConfigFile() {
    if (!fs.existsSync(CONFIG_PATH)) {
        const template = `{
  "_说明": "Claude Code HUD 配置文件，修改后自动生效，无需重启。",
  "_contextLimit说明": "上下文 token 上限。留空（null）则根据模型名自动判断（Opus 4.x = 1M，其余 = 200K）。",
  "contextLimit": null,
  "_refreshInterval说明": "面板刷新间隔，单位毫秒，默认 3000（3秒）。",
  "refreshInterval": 3000,
  "_inputCostPer1M说明": "输入 token 单价，每 100 万 token 多少美元。Sonnet 4.x 默认 $3.00。",
  "inputCostPer1M": 3.0,
  "_outputCostPer1M说明": "输出 token 单价，每 100 万 token 多少美元。Sonnet 4.x 默认 $15.00。",
  "outputCostPer1M": 15.0,
  "_cacheWriteCostPer1M说明": "缓存写入单价，每 100 万 token 多少美元。默认 $3.75。",
  "cacheWriteCostPer1M": 3.75,
  "_cacheReadCostPer1M说明": "缓存读取单价，每 100 万 token 多少美元。默认 $0.30。",
  "cacheReadCostPer1M": 0.30,
  "_dailyCostWarning说明": "每日费用黄色预警阈值（美元）。留空则不预警。",
  "dailyCostWarning": null,
  "_dailyCostLimit说明": "每日费用红色上限（美元）。留空则不限制。",
  "dailyCostLimit": null
}
`;
        fs.writeFileSync(CONFIG_PATH, template, 'utf8');
    }
}
function readConfig() {
    try {
        ensureConfigFile();
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        const merged = { ...DEFAULT_CONFIG, ...parsed };
        if (merged.contextLimit === null) {
            merged.contextLimit = undefined;
        }
        return merged;
    }
    catch {
        return { ...DEFAULT_CONFIG };
    }
}
function getWorkspacePath() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0)
        return '';
    return folders[0].uri.fsPath;
}
function updateStatusBar(stats) {
    if (!stats) {
        statusBarItem.text = '$(robot) Claude: --';
        statusBarItem.tooltip = 'No active Claude Code session';
        return;
    }
    const pct = Math.min(100, (stats.usage.inputTokens / stats.contextLimit) * 100);
    const cachePct = Math.round(stats.cache.hitRate * 100);
    const cost = stats.cost.totalCost;
    statusBarItem.text = `$(robot) ${pct.toFixed(0)}% ctx | cache:${cachePct}% | $${cost.toFixed(4)}`;
    statusBarItem.tooltip = [
        `Claude Code HUD`,
        `Context: ${pct.toFixed(1)}% (${(stats.usage.inputTokens / 1000).toFixed(1)}K / ${(stats.contextLimit / 1000).toFixed(0)}K)`,
        `Cache Hit Rate: ${cachePct}%`,
        `Session Cost: $${cost.toFixed(4)}`,
        `Model: ${stats.model}`,
    ].join('\n');
}
function activate(context) {
    const provider = new hudView_1.HudViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(hudView_1.HudViewProvider.viewType, provider));
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'claudeCodeHud.show';
    statusBarItem.text = '$(robot) Claude HUD';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    function refresh() {
        if (previewMode)
            return;
        const workspacePath = getWorkspacePath();
        if (!workspacePath) {
            provider.update(null, [], null, [], {});
            updateStatusBar(null);
            return;
        }
        const cfg = readConfig();
        const sessionFile = pinnedSessionFile ?? (0, parser_1.findActiveSession)(workspacePath);
        if (!sessionFile) {
            provider.update(null, [], null, [], {});
            updateStatusBar(null);
            return;
        }
        const costCfg = {
            contextLimit: cfg.contextLimit,
            inputCostPer1M: cfg.inputCostPer1M,
            outputCostPer1M: cfg.outputCostPer1M,
            cacheWriteCostPer1M: cfg.cacheWriteCostPer1M,
            cacheReadCostPer1M: cfg.cacheReadCostPer1M,
        };
        const stats = (0, parser_1.parseSessionFile)(sessionFile, costCfg);
        const sessions = (0, parser_1.listSessions)(workspacePath);
        const dailySpend = (0, parser_1.calcDailySpend)(workspacePath, costCfg);
        provider.update(stats, sessions, pinnedSessionFile, dailySpend, {
            warning: cfg.dailyCostWarning,
            limit: cfg.dailyCostLimit,
        });
        updateStatusBar(stats);
        const projectDir = path.dirname(sessionFile);
        if (!fileWatcher) {
            try {
                fileWatcher = fs.watch(projectDir, (_evt, filename) => {
                    if (filename && filename.endsWith('.jsonl')) {
                        refresh();
                    }
                });
            }
            catch { /* ignore */ }
        }
    }
    context.subscriptions.push(vscode.commands.registerCommand('claudeCodeHud.show', () => {
        vscode.commands.executeCommand('claudeCodeHud.panel.focus');
    }), vscode.commands.registerCommand('claudeCodeHud.refresh', () => {
        refresh();
    }), vscode.commands.registerCommand('claudeCodeHud.openSettings', async () => {
        ensureConfigFile();
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(CONFIG_PATH));
        await vscode.window.showTextDocument(doc, { preview: false });
        const watcher = vscode.workspace.createFileSystemWatcher(CONFIG_PATH);
        watcher.onDidChange(() => refresh());
        context.subscriptions.push(watcher);
    }), vscode.commands.registerCommand('claudeCodeHud.switchSession', (filePath) => {
        pinnedSessionFile = filePath;
        refresh();
    }), vscode.commands.registerCommand('claudeCodeHud.exitPreview', () => {
        previewMode = false;
        refresh();
        vscode.window.showInformationMessage('Claude Code HUD: Preview Mode off');
    }), vscode.commands.registerCommand('claudeCodeHud.previewMode', () => {
        previewMode = true;
        const cfg = readConfig();
        const mockStats = buildMockStats(cfg);
        const mockDaily = [
            { date: '2026-06-21', cost: 0.82 },
            { date: '2026-06-22', cost: 1.45 },
            { date: '2026-06-23', cost: 0.37 },
            { date: '2026-06-24', cost: 2.11 },
            { date: '2026-06-25', cost: 0.96 },
            { date: '2026-06-26', cost: 1.73 },
            { date: '2026-06-27', cost: 0.54 },
        ];
        provider.update(mockStats, [], null, mockDaily, { warning: 1.5, limit: 3.0 });
        vscode.commands.executeCommand('claudeCodeHud.panel.focus');
        vscode.window.showInformationMessage('Claude Code HUD: Preview Mode (mock data)');
    }));
    provider.onMessage((msg) => {
        if (msg.command === 'ready') {
            // Webview is ready, send initial data
            refresh();
        }
        else if (msg.command === 'openSettings') {
            vscode.commands.executeCommand('claudeCodeHud.openSettings');
        }
        else if (msg.command === 'switchSession') {
            pinnedSessionFile = msg.filePath || null;
            refresh();
        }
        else if (msg.command === 'unpinSession') {
            pinnedSessionFile = null;
            refresh();
        }
    });
    function startTimer() {
        if (refreshTimer)
            clearInterval(refreshTimer);
        refreshTimer = setInterval(refresh, readConfig().refreshInterval);
    }
    context.subscriptions.push({
        dispose: () => {
            if (refreshTimer)
                clearInterval(refreshTimer);
            if (fileWatcher)
                fileWatcher.close();
        }
    });
    refresh();
    startTimer();
}
function buildMockStats(cfg) {
    return {
        sessionId: 'preview-mock-1234abcd',
        sessionFile: '/mock/preview.jsonl',
        sessionTitle: '帮我优化这个项目的性能，分析瓶颈并给出方案',
        usage: {
            inputTokens: 142000,
            outputTokens: 18400,
            cacheCreationTokens: 136000,
            cacheReadTokens: 505800,
        },
        cost: {
            inputCost: 0.426,
            outputCost: 0.276,
            cacheWriteCost: 0.510,
            cacheReadCost: 0.1517,
            totalCost: 1.3637,
            savedByCacheUSD: 1.3656,
        },
        cache: {
            totalInputTokens: 647800,
            cacheReadTokens: 505800,
            cacheCreationTokens: 136000,
            hitRate: 0.781,
        },
        tools: {
            counts: {
                Bash: 76,
                Edit: 75,
                Read: 37,
                Write: 11,
                mcp__ide__getDiagnostics: 8,
                mcp__ide__executeCode: 5,
                TodoWrite: 6,
                Agent: 3,
            },
            webSearches: 4,
            webFetches: 2,
        },
        bloat: {
            rounds: 24,
            minCostPerRound: 0.019,
        },
        todos: [
            { content: '分析项目性能瓶颈', status: 'completed', model: 'claude-sonnet-4-6' },
            { content: '优化数据库查询，添加索引', status: 'completed', model: 'claude-sonnet-4-6' },
            { content: '重构 API 响应缓存层', status: 'completed', model: 'claude-sonnet-4-6' },
            { content: '压测并对比优化前后数据', status: 'in_progress', model: 'claude-sonnet-4-6' },
            { content: '编写性能优化文档', status: 'pending', model: 'claude-sonnet-4-6' },
        ],
        agents: [
            {
                name: 'Agent-A',
                tasks: [
                    { content: '扫描文件结构', status: 'completed', model: 'mimo-v2.5-pro' },
                    { content: '分析目录层次', status: 'completed', model: 'mimo-v2.5-pro' },
                ],
                doneCount: 2,
                totalCount: 2,
                pct: 100,
            },
            {
                name: 'Agent-B',
                tasks: [
                    { content: '检查代码质量', status: 'completed', model: 'mimo-v2.5-pro' },
                    { content: '运行静态分析', status: 'in_progress', model: 'mimo-v2.5-pro' },
                ],
                doneCount: 1,
                totalCount: 2,
                pct: 50,
            },
            {
                name: 'Agent-C',
                tasks: [
                    { content: '收集项目信息', status: 'completed', model: 'mimo-v2.5-pro' },
                    { content: '生成报告', status: 'pending', model: 'mimo-v2.5-pro' },
                ],
                doneCount: 1,
                totalCount: 2,
                pct: 50,
            },
        ],
        model: 'claude-sonnet-4-6',
        lastUpdated: new Date(),
        contextLimit: cfg.contextLimit ?? 200000,
        contextLimitSource: 'auto',
        pricing: {
            inputPer1M: cfg.inputCostPer1M,
            outputPer1M: cfg.outputCostPer1M,
            cacheWritePer1M: cfg.cacheWriteCostPer1M,
            cacheReadPer1M: cfg.cacheReadCostPer1M,
        },
    };
}
function deactivate() {
    if (refreshTimer)
        clearInterval(refreshTimer);
    if (fileWatcher)
        fileWatcher.close();
}
//# sourceMappingURL=extension.js.map