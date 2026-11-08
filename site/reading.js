/* Reading UI uses semantic section/note IDs; no text-dependent selectors. */
(() => {
  const surface = document.querySelector('[data-article-surface]');
  if (!surface) return;
  const root = surface.querySelector('#main-article');
  const contents = surface.querySelector('.post-toc details');
  const narrow = matchMedia('(max-width:1159px)');
  const layoutContents = () => { contents.open = !narrow.matches; };
  layoutContents(); narrow.addEventListener('change', layoutContents);
  let pending = false;
  function update() {
    pending = false;
    const chapters = [...root.querySelectorAll('.main-chapter')];
    let active = chapters[0]?.id;
    for (const section of chapters) if (section.getBoundingClientRect().top < 150) active = section.id;
    surface.querySelectorAll('.post-toc a').forEach(a => {
      if (a.hash === '#' + active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(update); } }, {passive:true});
  surface.querySelector('.post-toc').addEventListener('click', e => { if (e.target.closest('a') && narrow.matches) contents.open = false; });
  document.addEventListener('article:ready', () => {
    update();
    // Desktop notes stay beside their paragraph, with a real endnote fallback for narrow screens.
    root.querySelectorAll('.note-ref').forEach(link => link.addEventListener('click', e => {
      if (!matchMedia('(min-width:1160px)').matches) return;
      e.preventDefault();const note=link.closest('.noted-paragraph').querySelector('.sidenote');
      note.tabIndex=-1;note.focus({preventScroll:true});
    }));
  });
  async function openHash() {
    await ResearchArticle.mount(root);
    await document.fonts.ready;
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({block:'start'});
  }
  if (document.body.dataset.page === 'article' && !document.querySelector('.home-main')) openHash();
})();
