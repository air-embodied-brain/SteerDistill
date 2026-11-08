/* Home and article are two addresses in one continuous reading surface. */
(() => {
  const surface = document.querySelector('[data-article-surface]');
  const root = surface.querySelector('#main-article');
  const homeURL = new URL(SiteLocale.url(SitePaths.url('')), location.href);
  const articleURL = new URL(SiteLocale.url(SitePaths.url('article/')), location.href);
  const homeTitle = 'SteerDistill: Quantizing LLM Agents via Closed-Loop Teacher Steering';
  const articleTitle = (surface.querySelector(`h1 [data-lang=${SiteLocale.lang}]`)?.dataset.title || surface.querySelector('h1').textContent) + ' · SteerDistill';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inArticle = document.body.dataset.page === 'article', navigating = true, pending = false, serial = 0, saveTimer;
  let articleReady;
  const mount = () => articleReady ||= ResearchArticle.mount(root);
  // Resolve static resources before history changes the base pathname.
  document.querySelectorAll('a[href]:not([href^="#"])').forEach(a => { a.href = a.href; });
  history.scrollRestoration = 'manual';
  const observer = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { mount(); observer.disconnect(); }
  }, {rootMargin:'900px 0px'});
  observer.observe(surface);
  function route(url) {
    if (url.origin !== location.origin) return null;
    const path = url.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    if (path === articleURL.pathname.replace(/\/$/, '')) return 'article';
    if (path === homeURL.pathname.replace(/\/$/, '')) return 'home';
    return null;
  }
  function targetFor(url) {
    let id; try { id = decodeURIComponent(url.hash.slice(1)); } catch { id = ''; }
    return document.getElementById(id) || (route(url) === 'article' ? surface : document.querySelector('.home-main'));
  }
  function address(article, hash = '') {
    const url = new URL(article ? articleURL : homeURL);
    // Keep a selected replay and language when crossing the reading boundary.
    url.search = location.search;
    url.hash = hash;
    return url;
  }
  function setCurrent(article) {
    inArticle = article;
    document.title = article ? articleTitle : homeTitle;
    SiteShell.current(article ? 'article' : 'home');
  }
  function savePosition(force = false) {
    if (!navigating || force) history.replaceState({...history.state, readingY:scrollY}, '', location.href);
  }
  function update() {
    pending = false;
    if (navigating) return;
    const next = surface.getBoundingClientRect().top <= document.querySelector('.site-header').offsetHeight + 36;
    if (next !== inArticle) {
      const hash = location.hash && surface.contains(targetFor(new URL(location.href))) ? location.hash : '';
      history.replaceState({...history.state, readingY:scrollY}, '', address(next, hash));
      setCurrent(next);
    }
    clearTimeout(saveTimer); saveTimer = setTimeout(savePosition, 150);
  }
  const bounded = promise => Promise.race([promise, new Promise(resolve => setTimeout(resolve, 2000))]);
  async function navigate(url, {initial = false, restore} = {}) {
    const turn = ++serial; navigating = true;
    // Static homepage anchors already exist; article chapters are mounted lazily.
    let staticTarget;
    try { staticTarget = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch {}
    const article = staticTarget ? surface.contains(staticTarget) : route(url) === 'article' || !!url.hash;
    if (article) await mount();
    // Prepare the gallery's geometry before positioning content below it. The
    // replay stays visibility-controlled; a slow network never blocks reading.
    if (article || url.hash || restore > 0) await bounded(DemoGallery.prepare());
    await bounded(document.fonts.ready);
    if (turn !== serial) return;
    const target = targetFor(url), isArticle = target === surface || surface.contains(target);
    if ((route(url) === 'article') !== isArticle) history.replaceState(history.state, '', address(isArticle, url.hash));
    setCurrent(isArticle);
    const top = restore ?? (target.closest('.home-main') && !url.hash ? 0 :
      Math.max(0, scrollY + target.getBoundingClientRect().top - document.querySelector('.site-header').offsetHeight - 20));
    const smooth = !initial && restore === undefined && !reduced.matches;
    if (smooth) {
      // Native scrolling stays interruptible by wheel, touch and keyboard.
      await new Promise(resolve => {
        let timer;
        const finish = () => { clearTimeout(timer); removeEventListener('scrollend', finish); resolve(); };
        addEventListener('scrollend', finish, {once:true});
        timer = setTimeout(finish, 1600);
        scrollTo({top, behavior:'smooth'});
      });
    } else scrollTo({top, behavior:'instant'});
    if (turn !== serial) return;
    if (!initial && restore === undefined && Math.abs(scrollY-top)<4) {
      const focus = url.hash || isArticle ? (target.querySelector('h1,h2') || target) : document.querySelector('.paper-identity h1');
      focus.tabIndex = -1; focus.focus({preventScroll:true});
    }
    navigating = false;
    delete document.documentElement.dataset.readingEntry;
    update(); savePosition();
    document.documentElement.dataset.readingReady = 'true';
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (!route(url) || url.searchParams.get('lang') && url.searchParams.get('lang') !== SiteLocale.lang) return;
    event.preventDefault(); savePosition(true);
    const targetURL = new URL(url);
    if (!targetURL.searchParams.has('lang')) targetURL.searchParams.set('lang', SiteLocale.lang);
    const demo = new URL(location.href).searchParams.get('demo');
    if (demo && !targetURL.searchParams.has('demo')) targetURL.searchParams.set('demo', demo);
    if (targetURL.href !== location.href) history.pushState({}, '', targetURL);
    navigate(targetURL);
  });
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(update); } }, {passive:true});
  addEventListener('popstate', () => navigate(new URL(location.href), {restore:history.state?.readingY}));
  addEventListener('pageshow', event => { if (event.persisted) { navigating = false; update(); } });
  const reload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
  navigate(new URL(location.href), {initial:true, restore:reload ? history.state?.readingY : undefined});
})();
