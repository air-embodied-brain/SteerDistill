/* Inlined at the end of the body. Temporary text masks follow OxyGen's loading
   treatment; bounded fallback keeps the reader usable when fonts fail. */
(() => {
  const root = document.documentElement;
  const excluded = 'script,style,noscript,svg,textarea,option,.font-placeholder';
  function mask(node) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const text = walker.currentNode;
      if (text.textContent.trim() && !text.parentElement?.closest(excluded)) nodes.push(text);
    }
    for (const text of nodes) {
      const span = document.createElement('span'); span.className = 'font-placeholder';
      text.replaceWith(span); span.append(text);
    }
  }
  mask(document.body);
  root.dataset.fonts = 'skeleton';
  const observer = new MutationObserver(() => { observer.disconnect(); mask(document.body); observe(); });
  function observe() { observer.observe(document.body, {subtree:true,childList:true,characterData:true}); }
  observe();
  let done = false;
  function reveal(state) {
    if (done) return; done = true; clearTimeout(timeout); observer.disconnect();
    document.querySelectorAll('.font-placeholder').forEach(span => span.replaceWith(...span.childNodes));
    root.dataset.fonts = state;
    performance.mark('site-text-ready');
  }
  const timeout = setTimeout(() => reveal('fallback'), 4000);
  const dom = new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, {once:true}));
  const faces = ['16px Libre','16px SourceSans','600 16px SourceSans','16px SourceSerif'];
  if (document.querySelector('.home-main')) faces.push('700 16px LibreDisplay');
  const fonts = document.fonts ? Promise.all(faces.map(face => document.fonts.load(face, 'SteerDistill'))) : Promise.reject();
  Promise.all([dom, fonts]).then(() => reveal('ready'), () => dom.then(() => reveal('fallback')));
})();
