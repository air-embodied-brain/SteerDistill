/* The citation is also readable and downloadable without JavaScript. */
(() => {
  const button = document.querySelector('[data-copy-citation]');
  const citation = document.querySelector('[data-citation]');
  if (!button || !citation) return;
  const en = SiteLocale.lang === 'en';
  const label = en ? 'Copy' : '复制';
  let timer;
  button.hidden = false;
  button.addEventListener('click', async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(citation.textContent + '\n');
      button.textContent = en ? 'Copied' : '已复制';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(citation);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      citation.parentElement.focus();
      button.textContent = en ? 'Selected — press Ctrl/Cmd+C' : '已选中，请按 Ctrl/Cmd+C';
    }
    timer = setTimeout(() => { button.textContent = label; }, 2500);
  });
})();
