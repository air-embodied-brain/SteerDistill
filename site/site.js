/* Global navigation/theme behavior; shared by landing, article, cases and records. */
window.SiteShell = (() => {
  const header = document.querySelector('.site-header');
  const button = header.querySelector('.site-theme');
  // Three modes cycle system → light → dark; the button shows the current mode.
  const modes = ['system', 'light', 'dark'], system = matchMedia('(prefers-color-scheme: dark)');
  const names = {zh: {system: '跟随系统', light: '浅色', dark: '深色'}, en: {system: 'system', light: 'light', dark: 'dark'}};
  function theme(mode, save = false) {
    const root = document.documentElement;
    root.dataset.themeMode = mode;
    root.dataset.theme = mode === 'system' ? (system.matches ? 'dark' : 'light') : mode;
    const n = names[window.SiteLocale?.lang === 'en' ? 'en' : 'zh'], next = modes[(modes.indexOf(mode) + 1) % 3];
    const label = window.SiteLocale?.lang === 'en' ? `Theme: ${n[mode]}. Switch to ${n[next]}` : `主题：${n[mode]}，点击切换为${n[next]}`;
    button.setAttribute('aria-label', label); button.title = label;
    if (save) try { if (mode === 'system') localStorage.removeItem('steerdistill-theme'); else localStorage.setItem('steerdistill-theme', mode); } catch {}
  }
  function current(page) {
    header.dataset.page = page;
    header.querySelectorAll('[data-nav]').forEach(a => {
      if (a.dataset.nav === page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  const mode = () => document.documentElement.dataset.themeMode || 'system';
  button.addEventListener('click', () => theme(modes[(modes.indexOf(mode()) + 1) % 3], true));
  addEventListener('storage', e => { if (e.key === 'steerdistill-theme' || e.key === null) theme(['light', 'dark'].includes(e.newValue) ? e.newValue : 'system'); });
  system.addEventListener('change', () => { if (mode() === 'system') theme('system'); });
  theme(mode());
  current(document.body.dataset.page);
  return { current };
})();
