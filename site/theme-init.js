/* Runs before styles: all pages share one preference; absent or "system" follows the OS. */
(() => {
  const root = document.documentElement;
  let mode = 'system';
  try { const saved = localStorage.getItem('steerdistill-theme'); if (saved === 'light' || saved === 'dark') mode = saved; } catch {}
  root.dataset.themeMode = mode;
  root.dataset.theme = mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode;
})();
