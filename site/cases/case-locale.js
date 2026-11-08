/* Locale applies to editorial data and explicit UI labels, never arbitrary DOM text. */
window.CaseLocale = (() => {
  const {lang, url} = window.SiteLocale;
  const dictionary = {
  "调用与回复": "Calls and responses",
  "Agent 推理节选": "Agent reasoning excerpt",
  "指导生成推理节选": "Guidance reasoning excerpt",
  "指导原文": "Original guidance",
  "节选": "Excerpt",
  "Teacher 指导": "Teacher guidance",
  "动作对照": "Action comparison",
  "工具调用与返回": "Tool calls and results",
  "执行结果": "Execution results",
  "操作过程": "Action sequence",
  "查看 agent 推理": "View agent reasoning",
  "查看参照过程": "View reference trajectory",
  " · 推理节选": " · Reasoning excerpt",
  " 完整记录": " · Full records",
  "下载全部方法记录": "Download all method records",
  "右侧对比方法": "Right comparison method",
  "右侧方法": "Right method",
  "左侧对比方法": "Left comparison method",
  "左侧方法": "Left method",
  "这一轮记录中没有推理文本。": "No reasoning was recorded for this turn.",
  " · 完整指导": " · Full guidance",
  " · 指导生成分析节选": " · Guidance reasoning excerpt",
  " · 最终指导": " · Final guidance",
  "完整记录": "Full records",
  "指导原文节选": "Guidance excerpts",
  "未提供指导": "No guidance",
  "案例未能载入：": "Could not load this case: ",
  "案例配置不符合 schemaVersion 1": "Case configuration does not match schemaVersion 1",
  "此分类尚无可读案例": "No cases are available in this category",
  " · 完整记录": " · Full records",
  " · 记录": " · Record",
  "Agent 回复": "Agent response",
  "Agent 推理": "Agent reasoning",
  "Agent 调用": "Agent tool calls",
  "messagePath 未指向数组：": "messagePath does not point to an array: ",
  "下载原始记录": "Download original records",
  "全部来源与运行配置": "All sources and run settings",
  "完整来源": "Full source",
  "工具返回": "Tool result",
  "当前指导": "Current guidance",
  "打开来源": "Open source",
  "指导内容": "Guidance",
  "数据库下载": "Download database",
  "查看完整 agent 推理": "View full agent reasoning",
  "此来源为 SQLite 数据库，请下载查看。": "Download this SQLite database to inspect its contents.",
  "消息完整字段": "All message fields",
  "用户": "User",
  "用户任务": "User request",
  "系统": "System",
  "系统执行约束": "System instructions",
  "系统消息": "System message",
  "记录": "Record",
  "调用状态": "Call status",
  "返回案例": "Back to case",
  "选择原始来源": "Select a source",
  "原始任务描述": "Original task",
  "案例目录无法读取": "Could not load the case directory",
  "Agent 回复 · 节选": "Agent response · Excerpt",
  "修正规则": "Decision rule",
  "当前条件": "Precondition",
  "查看 agent 推理节选": "View agent reasoning excerpts",
  "核验方式": "Verification check",
  "预期变化": "Expected transition",
  "可读视图": "Readable view",
  "原始文本": "Raw text",
  "下载当前来源": "Download current source",
  "消息翻页": "Message navigation",
  "上一条": "Previous",
  "下一条": "Next",
  "用户 · 第 {n} 轮": "User · Turn {n}",
  "查看第 {n} 轮 agent 推理节选": "View agent reasoning for turn {n}",
  "来源读取失败：{label} ({status})": "Could not read source: {label} ({status})",
  "：": ": "
};
  function t(text, values = {}) {
    return (lang === 'en' ? dictionary[text] ?? window.SiteLocale.t(text) : text).replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  }
  function apply(original, overlay) {
    const copy = JSON.parse(JSON.stringify(original));
    if (!overlay) return copy;
    if (overlay.schemaVersion !== 1) throw Error('Unsupported case translation schema');
    for (const [pointer, value] of Object.entries(overlay.translations)) {
      if (!pointer.startsWith('/')) throw Error('Invalid translation pointer: ' + pointer);
      const keys = pointer.slice(1).split('/').map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'));
      if (keys.some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) throw Error('Invalid translation path');
      let target = copy;
      for (const key of keys.slice(0, -1)) { if (!Object.hasOwn(target, key)) throw Error('Missing translation target: ' + pointer); target = target[key]; }
      const key = keys.at(-1);
      if (!Object.hasOwn(target, key)) throw Error('Missing translation target: ' + pointer);
      target[key] = value;
    }
    return copy;
  }
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(node => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
  return {lang, t, url, apply};
})();
