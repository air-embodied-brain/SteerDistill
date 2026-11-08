/* One language preference for navigation and editorial content. Evidence keeps its source language. */
window.SiteLocale = (() => {
  const requested = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem('steerdistill-language') || localStorage.getItem('steerdistill-case-language'); } catch {}
  const lang = ['zh', 'en'].includes(requested) ? requested : ['zh', 'en'].includes(saved) ? saved : document.body.dataset.page === 'home' ? 'en' : 'zh';
  if (['zh', 'en'].includes(requested)) try { localStorage.setItem('steerdistill-language', lang); } catch {}
  const labels = {
    '跳到内容':'Skip to content', '站点导航':'Site navigation', '研究文章':'Research article', '案例分析':'Case studies',
    '案例目录':'Case directory', '目录':'Contents', '记录目录':'Record directory'
  };
  const t = text => lang === 'en' ? labels[text] ?? text : text;
  function url(href) {
    const value = new URL(href, location.href);
    if (value.origin !== location.origin) return value.href;
    value.searchParams.set('lang', lang);
    return value.pathname + value.search + value.hash;
  }
  function decorateLinks(root = document) {
    root.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.hasAttribute('download')) return;
      const target = new URL(a.href, location.href);
      if (target.origin === location.origin && /(?:\/index\.html|\/(?:article|cases|records)\/|\/)$/.test(target.pathname)) a.href = url(a.href);
    });
  }
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(node => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });
  document.querySelector('.site-nav')?.setAttribute('lang', document.documentElement.lang);
  decorateLinks();
  document.addEventListener('article:ready', () => decorateLinks());
  const toggle = document.querySelector('.site-language');
  if (toggle) {
    toggle.textContent = lang === 'en' ? '中文' : 'EN';
    toggle.setAttribute('aria-label', lang === 'en' ? '切换为中文' : 'Read in English');
    toggle.lang = lang === 'en' ? 'zh-CN' : 'en';
    toggle.onclick = () => { const next = new URL(location.href); next.searchParams.set('lang', lang === 'en' ? 'zh' : 'en'); location.assign(next.href); };
  }
  return {lang, t, url, decorateLinks};
})();
