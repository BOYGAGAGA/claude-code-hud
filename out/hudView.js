"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HudViewProvider = void 0;
class HudViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this._stats = null;
        this._dailySpend = [];
        this._thresholds = {};
    }
    onMessage(handler) {
        this._messageHandler = handler;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.onDidReceiveMessage((msg) => {
            this._messageHandler?.(msg);
        });
        this._render();
    }
    update(stats, _sessions, _pinnedFile, dailySpend, thresholds) {
        this._stats = stats;
        this._dailySpend = dailySpend ?? [];
        this._thresholds = thresholds ?? {};
        this._render();
    }
    _render() {
        if (!this._view)
            return;
        this._view.webview.html = this._stats
            ? buildHtml(this._stats, this._dailySpend, this._thresholds)
            : buildEmptyHtml();
    }
}
exports.HudViewProvider = HudViewProvider;
HudViewProvider.viewType = 'claudeCodeHud.panel';
function fmt(n) {
    if (n >= 1000000)
        return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)
        return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}
function fmtCost(usd) {
    if (usd < 0.001)
        return '<$0.001';
    return '$' + usd.toFixed(4);
}
function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function truncate(s, max) {
    const oneline = s.replace(/\s+/g, ' ').trim();
    return oneline.length > max ? oneline.slice(0, max - 1) + '…' : oneline;
}
function shortModel(model) {
    return model
        .replace(/^us\.anthropic\./, '')
        .replace(/^claude-/, '')
        .replace(/-(\d+)-(\d+)$/, '-$1.$2')
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('-');
}
function todoStatusClass(status) {
    switch (status) {
        case 'completed': return 'todo-done';
        case 'in_progress': return 'todo-active';
        default: return 'todo-pending';
    }
}
function buildHtml(s, dailySpend, thresholds) {
    const contextPct = Math.min(100, (s.usage.inputTokens / s.contextLimit) * 100);
    const cachePct = Math.round(s.cache.hitRate * 100);
    const totalTodos = s.todos.length;
    const doneTodos = s.todos.filter((t) => t.status === 'completed').length;
    const activeTodos = s.todos.filter((t) => t.status === 'in_progress').length;
    const totalPct = totalTodos > 0 ? Math.round((doneTodos / totalTodos) * 100) : 0;
    // Agent groups
    const agentGroups = s.agents || [];
    const totalAgentTasks = agentGroups.reduce((a, g) => a + g.totalCount, 0);
    const doneAgentTasks = agentGroups.reduce((a, g) => a + g.doneCount, 0);
    const todoRows = s.todos.map((t, i) => {
        const pct = t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0;
        const barColor = t.status === 'completed' ? '#4ade80' : t.status === 'in_progress' ? '#60a5fa' : '#334155';
        const model = t.model ? shortModel(t.model) : shortModel(s.model);
        const label = t.content.length > 45 ? t.content.slice(0, 44) + '…' : t.content;
        return `
      <div class="todo-row ${todoStatusClass(t.status)}">
        <span class="todo-idx">${i + 1}.</span>
        <div class="bar-track" style="height:6px;width:50px;flex:none"><div class="bar-fill" style="width:${pct}%;background:${barColor}"></div></div>
        <span class="todo-pct">${pct}%</span>
        <span class="todo-label">${escHtml(label)}</span>
        <span class="todo-model">[${model}]</span>
      </div>`;
    }).join('');
    const contextColor = contextPct > 85 ? '#f87171' : contextPct > 60 ? '#fbbf24' : '#4ade80';
    const cacheColor = cachePct > 50 ? '#4ade80' : cachePct > 20 ? '#fbbf24' : '#94a3b8';
    // Session bloat section
    let bloatSection = '';
    if (s.bloat.rounds > 0) {
        const r = s.bloat.rounds;
        const hitPct = Math.round(s.cache.hitRate * 100);
        const cachePerfect = hitPct >= 95;
        const cacheDecaying = hitPct >= 50 && hitPct < 80;
        const cachePoor = hitPct < 50;
        const contextNearLimit = contextPct > 85;
        const contextHigh = contextPct > 65;
        let bloatLevel;
        if (contextNearLimit || cachePoor) {
            bloatLevel = 'red';
        }
        else if (cacheDecaying || contextHigh) {
            bloatLevel = 'yellow';
        }
        else {
            bloatLevel = 'green';
        }
        const roundColor = bloatLevel === 'red' ? '#f87171' : bloatLevel === 'yellow' ? '#fbbf24' : '#4ade80';
        const clearCode = '<code style="font-family:monospace;background:#1e293b;padding:1px 4px;border-radius:2px;color:#7dd3fc">/clear</code>';
        let statusLine = '';
        if (bloatLevel === 'green') {
            statusLine = `<span style="color:#4ade80">🟢 雪球效应：当前缓存完美命中（${hitPct}%），单轮最低消费极低，建议继续保持。</span>`;
        }
        else if (bloatLevel === 'yellow') {
            const reason = cacheDecaying
                ? `缓存命中率降至 ${hitPct}%，对话混入较多新内容`
                : `上下文已用 ${contextPct.toFixed(0)}%，剩余空间有限`;
            statusLine = `<span style="color:#fbbf24">🟡 ${reason}</span><span style="color:#888"> — 考虑 ${clearCode}</span>`;
        }
        else {
            const reason = contextNearLimit
                ? `上下文已用 ${contextPct.toFixed(0)}%，即将耗尽`
                : `缓存命中率仅 ${hitPct}%，每轮真实输入激增`;
            statusLine = `<span style="color:#f87171">🔴 ${reason}</span><span style="color:#888"> — 建议 ${clearCode} 新开对话</span>`;
        }
        const badge = bloatLevel === 'red'
            ? (contextNearLimit ? '<span class="bloat-badge bloat-red">上下文告急</span>' : '<span class="bloat-badge bloat-red">缓存崩塌</span>')
            : bloatLevel === 'yellow'
                ? '<span class="bloat-badge bloat-yellow">缓存劣化</span>'
                : (cachePerfect ? '<span class="bloat-badge" style="background:#14532d;color:#86efac">缓存健康</span>' : '');
        bloatSection = `
<div class="section">
  <div class="section-header">💬 会话臃肿度</div>
  <div class="section-body">
    <div class="stat-row">
      <span class="stat-label">当前第</span>
      <span class="val" style="color:${roundColor};font-size:18px;font-weight:bold">${r}</span>
      <span style="color:${roundColor};margin-left:2px">轮</span>
      ${badge}
    </div>
    <div class="snowball-row">${statusLine}</div>
  </div>
</div>`;
    }
    // Daily spend section
    let dailySection = '';
    if (dailySpend.length > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const todayCost = dailySpend.find((d) => d.date === today)?.cost ?? 0;
        const weekTotal = dailySpend.filter((d) => d.date !== today).reduce((a, b) => a + b.cost, 0);
        const maxCost = Math.max(...dailySpend.map((x) => x.cost), 0.001);
        const warn = thresholds.warning ?? null;
        const limit = thresholds.limit ?? null;
        const todayPct = limit != null ? (todayCost / limit) * 100 : null;
        const zone = todayPct == null ? 'normal'
            : todayPct >= 100 ? 'red'
                : todayPct >= 81 ? 'orange'
                    : 'normal';
        const zoneColor = zone === 'red' ? '#f87171' : zone === 'orange' ? '#fb923c' : '#4ade80';
        const barFillPct = todayPct != null ? Math.min(100, todayPct) : null;
        const budgetBar = todayPct != null ? `
    <div class="budget-bar-wrap">
      <div class="budget-bar-track">
        <div class="budget-bar-fill ${zone === 'red' ? 'budget-bar-pulse' : ''}"
          style="width:${barFillPct.toFixed(1)}%;background:${zoneColor}"></div>
        ${warn != null ? `<div class="budget-bar-marker" style="left:${Math.min(100, (warn / limit) * 100).toFixed(1)}%"></div>` : ''}
      </div>
      <span class="budget-bar-label" style="color:${zoneColor}">${todayPct.toFixed(0)}%</span>
    </div>
    <div class="budget-bar-hint">
      ${fmtCost(todayCost)} / ${fmtCost(limit)}
      ${zone === 'red' ? ' <span style="color:#f87171">💸 已超预算</span>' : zone === 'orange' ? ' <span style="color:#fb923c">⚠️ 建议收尾</span>' : ''}
    </div>` : '';
        const prevDays = dailySpend.filter((d) => d.date !== today).slice(-6).reverse();
        const prevMaxCost = Math.max(...prevDays.map((x) => x.cost), 0.001);
        const rows = prevDays.map((d) => {
            const barW = Math.round((d.cost / prevMaxCost) * 80);
            const overL = limit != null && d.cost >= limit;
            const overW = warn != null && d.cost >= warn;
            const barColor = overL ? '#f87171' : overW ? '#fb923c' : '#3b82f6';
            const costColor = overL ? '#f87171' : overW ? '#fb923c' : '#94a3b8';
            return `<div class="daily-row">
      <span class="daily-date">${d.date.slice(5)}</span>
      <span class="daily-bar" style="width:${barW}px;background:${barColor}"></span>
      <span class="daily-cost" style="color:${costColor}">${fmtCost(d.cost)}</span>
    </div>`;
        }).join('');
        dailySection = `
<div class="section">
  <div class="section-header">📅 近期费用统计</div>
  <div class="section-body">
    ${budgetBar ? '<div style="font-size:10px;color:#888;margin-bottom:3px">今日</div>' : ''}
    ${budgetBar}
    ${budgetBar ? '<div style="height:8px"></div>' : ''}
    ${rows}
    <div class="daily-total">
      <span>前六天合计</span>
      <span style="color:#fbbf24;font-weight:bold">${fmtCost(weekTotal)}</span>
    </div>
  </div>
</div>`;
    }
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    padding: 10px;
    line-height: 1.5;
  }
  .section {
    margin-bottom: 14px;
    border: 1px solid var(--vscode-widget-border, #333);
    border-radius: 4px;
    overflow: hidden;
  }
  .section-header {
    background: var(--vscode-sideBarSectionHeader-background, #252526);
    color: var(--vscode-sideBarSectionHeader-foreground, #bbb);
    padding: 4px 8px;
    font-weight: bold;
    font-size: 11px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--vscode-widget-border, #333);
  }
  .section-body { padding: 8px; }
  .stat-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;
    flex-wrap: wrap;
  }
  .stat-label { color: var(--vscode-descriptionForeground, #888); min-width: 70px; }
  .bar-track {
    flex: 1;
    height: 10px;
    background: #1e293b;
    border-radius: 3px;
    overflow: hidden;
    min-width: 0;
  }
  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  .pct { font-weight: bold; min-width: 38px; text-align: right; }
  .val { color: var(--vscode-textLink-foreground, #4ec9b0); }
  .cost-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px 12px;
  }
  .cost-item { display: flex; justify-content: space-between; }
  .cost-label { color: var(--vscode-descriptionForeground, #888); }
  .cost-val { font-weight: bold; }
  .cost-total {
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px solid var(--vscode-widget-border, #444);
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }
  .cost-total .cost-val { color: #fbbf24; }
  .saved { color: #4ade80; font-size: 11px; }
  .todo-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 3px;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
  }
  .todo-done { opacity: 0.55; }
  .todo-active { color: #4ade80; }
  .todo-pending { color: var(--vscode-foreground); }
  .todo-idx { color: #888; min-width: 18px; text-align: right; flex-shrink: 0; }
  .todo-pct { min-width: 34px; text-align: right; color: #888; flex-shrink: 0; }
  .todo-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
  .todo-model { color: #a78bfa; flex-shrink: 0; }
  .overall-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 11px;
    color: #94a3b8;
  }
  .pricing-table {
    margin-top: 6px;
    padding-top: 5px;
    border-top: 1px dashed var(--vscode-widget-border, #333);
  }
  .pricing-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: #666;
    margin-bottom: 1px;
  }
  .pricing-type { min-width: 68px; }
  .pricing-rate { min-width: 60px; color: #888; font-weight: bold; }
  .pricing-tokens { color: #555; }
  .daily-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 3px;
    font-size: 11px;
  }
  .daily-date { min-width: 36px; color: #888; }
  .daily-bar {
    height: 8px;
    background: #3b82f6;
    border-radius: 2px;
    min-width: 2px;
    flex-shrink: 0;
  }
  .daily-cost { color: #94a3b8; min-width: 55px; text-align: right; }
  .daily-total {
    margin-top: 5px;
    padding-top: 4px;
    border-top: 1px solid var(--vscode-widget-border, #333);
    font-size: 11px;
    color: #888;
    text-align: right;
  }
  .bloat-badge {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 3px;
    margin-left: 6px;
    font-weight: bold;
  }
  .bloat-red { background: #7f1d1d; color: #fca5a5; }
  .bloat-yellow { background: #78350f; color: #fcd34d; }
  .snowball-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #888;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .no-todos { color: #666; font-style: italic; padding: 4px 0; }
  .agent-group {
    margin-bottom: 8px;
    padding: 6px;
    background: var(--vscode-input-background, #1e1e2e);
    border-radius: 4px;
    border: 1px solid var(--vscode-widget-border, #333);
  }
  .agent-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: bold;
  }
  .agent-name {
    color: #a78bfa;
    min-width: 60px;
  }
  .agent-pct {
    min-width: 34px;
    text-align: right;
    color: #888;
    flex-shrink: 0;
  }
  .agent-done {
    color: #555;
    font-size: 10px;
    flex-shrink: 0;
  }
  .agent-task-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
    font-size: 10px;
    white-space: nowrap;
    overflow: hidden;
    padding-left: 8px;
  }
  .refresh-time { font-size: 10px; color: #555; text-align: right; margin-top: 4px; }
  .session-title-bar {
    background: var(--vscode-sideBarSectionHeader-background, #1e1e2e);
    border: 1px solid var(--vscode-widget-border, #333);
    border-radius: 4px;
    padding: 5px 8px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .session-title-icon { font-size: 13px; flex-shrink: 0; }
  .session-title-text {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--vscode-foreground);
    font-size: 11px;
  }
  .session-title-id {
    color: #555;
    font-size: 10px;
    flex-shrink: 0;
  }
  .gear-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #555;
    font-size: 14px;
    padding: 0 2px;
    line-height: 1;
    transition: color 0.15s;
  }
  .gear-btn:hover { color: var(--vscode-foreground); }
  .budget-bar-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }
  .budget-bar-track {
    flex: 1;
    height: 6px;
    background: #1e293b;
    border-radius: 3px;
    position: relative;
    overflow: visible;
  }
  .budget-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .budget-bar-pulse { animation: pulse 1.4s ease-in-out infinite; }
  .budget-bar-marker {
    position: absolute;
    top: -3px;
    width: 2px;
    height: 12px;
    background: #fbbf24;
    border-radius: 1px;
  }
  .budget-bar-label { font-size: 11px; font-weight: bold; min-width: 32px; text-align: right; }
  .budget-bar-hint { font-size: 10px; color: #888; margin-bottom: 6px; }
</style>
</head>
<body>
<script>
  const vscode = acquireVsCodeApi();
  function openSettings() { vscode.postMessage({ command: 'openSettings' }); }
</script>

<!-- Session Title -->
<div class="session-title-bar">
  <span class="session-title-icon">💬</span>
  <span class="session-title-text" title="${escHtml(s.sessionTitle)}">${escHtml(truncate(s.sessionTitle, 60))}</span>
  <span class="session-title-id">${s.sessionId.slice(0, 8)}</span>
  <button class="gear-btn" onclick="openSettings()" title="打开配置文件">⚙</button>
</div>

<!-- Context Usage -->
<div class="section">
  <div class="section-header">⬡ Context Window</div>
  <div class="section-body">
    <div class="stat-row">
      <span class="stat-label">Used</span>
      <div class="bar-track"><div class="bar-fill" style="width:${contextPct.toFixed(1)}%;background:${contextColor}"></div></div>
      <span class="pct" style="color:${contextColor}">${contextPct.toFixed(1)}%</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Tokens</span>
      <span class="val">${fmt(s.usage.inputTokens)}</span>
      <span style="color:#555"> / </span>
      <span>${fmt(s.contextLimit)}</span>
      <span style="color:#555;font-size:10px;margin-left:4px">${s.contextLimitSource === 'config' ? '(手动)' : '(自动)'}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Output</span>
      <span class="val">${fmt(s.usage.outputTokens)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Model</span>
      <span style="color:#a78bfa">${shortModel(s.model)}</span>
    </div>
  </div>
</div>

<!-- Cache Stats -->
<div class="section">
  <div class="section-header">⚡ Cache Hit Rate</div>
  <div class="section-body">
    <div class="stat-row">
      <span class="stat-label">Hit Rate</span>
      <div class="bar-track"><div class="bar-fill" style="width:${cachePct}%;background:${cacheColor}"></div></div>
      <span class="pct" style="color:${cacheColor}">${cachePct}%</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Cache Read</span>
      <span class="val">${fmt(s.cache.cacheReadTokens)}</span>
      <span style="color:#555"> tokens</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Cache Write</span>
      <span class="val">${fmt(s.cache.cacheCreationTokens)}</span>
      <span style="color:#555"> tokens</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Saved</span>
      <span class="saved">+${fmtCost(s.cost.savedByCacheUSD)}</span>
    </div>
  </div>
</div>

<!-- Cost Breakdown -->
<div class="section">
  <div class="section-header">💰 Cost This Session</div>
  <div class="section-body">
    <div class="cost-grid">
      <div class="cost-item">
        <span class="cost-label">Input</span>
        <span class="cost-val">${fmtCost(s.cost.inputCost)}</span>
      </div>
      <div class="cost-item">
        <span class="cost-label">Output</span>
        <span class="cost-val">${fmtCost(s.cost.outputCost)}</span>
      </div>
      <div class="cost-item">
        <span class="cost-label">Cache Write</span>
        <span class="cost-val">${fmtCost(s.cost.cacheWriteCost)}</span>
      </div>
      <div class="cost-item">
        <span class="cost-label">Cache Read</span>
        <span class="cost-val" style="color:#4ade80">${fmtCost(s.cost.cacheReadCost)}</span>
      </div>
    </div>
    <div class="cost-total">
      <span class="cost-label">Total</span>
      <span class="cost-val">${fmtCost(s.cost.totalCost)}</span>
    </div>
    ${s.cost.savedByCacheUSD > 0 ? `<div class="saved">⬇ Cache saved ${fmtCost(s.cost.savedByCacheUSD)} vs full price</div>` : ''}
    <div class="pricing-table">
      <div class="pricing-row">
        <span class="pricing-type">Input</span>
        <span class="pricing-rate">$${s.pricing.inputPer1M.toFixed(2)}/1M</span>
        <span class="pricing-tokens">${fmt(s.usage.inputTokens)} tokens</span>
      </div>
      <div class="pricing-row">
        <span class="pricing-type">Output</span>
        <span class="pricing-rate">$${s.pricing.outputPer1M.toFixed(2)}/1M</span>
        <span class="pricing-tokens">${fmt(s.usage.outputTokens)} tokens</span>
      </div>
      <div class="pricing-row">
        <span class="pricing-type">Cache Write</span>
        <span class="pricing-rate">$${s.pricing.cacheWritePer1M.toFixed(2)}/1M</span>
        <span class="pricing-tokens">${fmt(s.usage.cacheCreationTokens)} tokens</span>
      </div>
      <div class="pricing-row">
        <span class="pricing-type">Cache Read</span>
        <span class="pricing-rate" style="color:#4ade80">$${s.pricing.cacheReadPer1M.toFixed(2)}/1M</span>
        <span class="pricing-tokens">${fmt(s.usage.cacheReadTokens)} tokens</span>
      </div>
    </div>
  </div>
</div>

${bloatSection}

${dailySection}

<!-- Task List -->
<div class="section">
  <div class="section-header">📋 Tasks (${doneTodos}/${totalTodos})</div>
  <div class="section-body">
    ${totalTodos === 0
        ? '<div class="no-todos">No tasks tracked yet</div>'
        : todoRows}
    ${totalTodos > 0 ? `
    <div class="overall-row">
      <span>Overall</span>
      <div class="bar-track" style="height:6px"><div class="bar-fill" style="width:${totalPct}%;background:#60a5fa"></div></div>
      <span class="pct">${totalPct}%</span>
      <span style="color:#555">(${activeTodos} active)</span>
    </div>` : ''}
  </div>
</div>

${agentGroups.length > 0 ? `
<!-- Agent Groups -->
<div class="section">
  <div class="section-header">🤖 Agents (${doneAgentTasks}/${totalAgentTasks})</div>
  <div class="section-body">
    ${agentGroups.map((agent) => {
        const agentColor = agent.pct >= 100 ? '#4ade80' : agent.pct > 0 ? '#60a5fa' : '#334155';
        const agentTasksHtml = agent.tasks.map((t) => {
            const tPct = t.status === 'completed' ? 100 : t.status === 'in_progress' ? 50 : 0;
            const tColor = t.status === 'completed' ? '#4ade80' : t.status === 'in_progress' ? '#60a5fa' : '#334155';
            const tLabel = t.content.length > 40 ? t.content.slice(0, 39) + '…' : t.content;
            return `
          <div class="agent-task-row ${todoStatusClass(t.status)}">
            <div class="bar-track" style="height:4px;width:40px;flex:none"><div class="bar-fill" style="width:${tPct}%;background:${tColor}"></div></div>
            <span class="todo-pct" style="min-width:28px;font-size:10px">${tPct}%</span>
            <span class="todo-label" style="font-size:10px">${escHtml(tLabel)}</span>
          </div>`;
        }).join('');
        return `
      <div class="agent-group">
        <div class="agent-header">
          <span class="agent-name">${escHtml(agent.name)}</span>
          <div class="bar-track" style="height:6px"><div class="bar-fill" style="width:${agent.pct}%;background:${agentColor}"></div></div>
          <span class="agent-pct">${agent.pct}%</span>
          <span class="agent-done">(${agent.doneCount}/${agent.totalCount})</span>
        </div>
        ${agentTasksHtml}
      </div>`;
    }).join('')}
  </div>
</div>` : ''}

<div class="refresh-time">↺ ${s.lastUpdated.toLocaleTimeString()}</div>

</body>
</html>`;
}
function buildEmptyHtml() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: monospace;
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    background: var(--vscode-sideBar-background);
    padding: 20px;
    text-align: center;
  }
  .icon { font-size: 32px; margin-bottom: 12px; }
  p { line-height: 1.6; }
</style>
</head>
<body>
  <div class="icon">🤖</div>
  <p>No active Claude Code session found.</p>
  <p style="color:#555;font-size:11px;margin-top:8px;">Open a project and start Claude Code to see stats.</p>
</body>
</html>`;
}
//# sourceMappingURL=hudView.js.map