/* Task navigation owns the panels; each panel owns an independent replay and method rail. */
(() => {
  const root = document.querySelector('[data-demo-gallery]');
  if (!root) return;
  const make = EvidenceUI.make, t = HomeLocale.t;
  const catalogURL = new URL(root.dataset.demoGallery, SitePaths.root);
  async function start() {
    const response = await fetch(catalogURL);
    if (!response.ok) throw Error('Demo catalogue unavailable');
    const catalog = await response.json();
    const nav = make('div', 'demo-task-tabs'), description = make('p', 'demo-task-description'), panels = make('div', 'demo-task-panels');
    nav.style.setProperty('--demo-task-count', catalog.tasks.length);
    nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', t('Demo tasks'));
    description.id = 'demo-task-description';
    const entries = new Map(); let active;
    for (const task of catalog.tasks) {
      const tab = make('button', 'demo-task-tab'); tab.type = 'button'; tab.id = 'demo-task-tab-' + task.id;
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-label', `${task.app}: ${t(task.label)}`);
      tab.append(make('span', 'demo-task-app', task.app), make('span', 'demo-task-label', t(task.label)));
      const panel = make('div', 'demo-replay'); panel.dataset.demoTask = task.id;
      panel.id = 'demo-task-panel-' + task.id; panel.hidden = true; panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id); panel.setAttribute('aria-describedby', description.id);
      tab.setAttribute('aria-controls', panel.id);
      const entry = {task, tab, panel, controller:null, pending:null}; entries.set(task.id, entry);
      tab.onclick = () => activate(task.id);
      nav.append(tab); panels.append(panel);
    }
    const summary = make('div', 'demo-summary');
    for (const sentence of catalog.summary) {
      const paragraph = make('p');
      for (const part of sentence) {
        if (part.href) { const link = make('a', '', t(part.text)); link.href = part.href; paragraph.append(link); }
        else paragraph.append(t(part.text));
      }
      summary.append(paragraph);
    }
    root.replaceChildren(nav, description, panels, summary);
    async function load(entry) {
      if (entry.controller) return entry.controller;
      if (entry.pending) return entry.pending;
      entry.panel.replaceChildren(make('p', 'demo-loading', t('Loading {app} replay…', {app:entry.task.app})));
      entry.panel.setAttribute('aria-busy', 'true');
      entry.pending = (async () => {
        const base = new URL(entry.task.path, catalogURL);
        const response = await fetch(new URL('replay.json', base));
        if (!response.ok) throw Error('Task replay unavailable');
        const data = await response.json();
        const controller = await DemoReplay.mount(entry.panel, {data, base});
        entry.controller = controller;
        if (active !== entry.task.id) controller.pause();
        entry.panel.removeAttribute('aria-busy');
        return controller;
      })().catch(error => {
        entry.pending = null; entry.panel.removeAttribute('aria-busy');
        const retry = make('button', 'replay-play', t('Try again')); retry.type = 'button';
        retry.onclick = () => load(entry).catch(() => {});
        entry.panel.replaceChildren(make('p', 'demo-loading', t('This replay could not be loaded.')), retry);
        console.error(error); throw error;
      });
      return entry.pending;
    }
    async function activate(id, updateURL = true) {
      entries.get(active)?.controller?.pause(); active = id; root.dataset.activeTask = id;
      for (const [key, entry] of entries) {
        const selected = id === key; entry.panel.hidden = !selected;
        entry.tab.setAttribute('aria-selected', String(selected)); entry.tab.tabIndex = selected ? 0 : -1;
      }
      const entry = entries.get(id); description.textContent = t(entry.task.task);
      if (updateURL) {
        const url = new URL(location.href); url.searchParams.set('demo', id);
        history.replaceState(history.state, '', url.pathname + url.search + url.hash);
      }
      try { const controller = await load(entry); if (active === id) controller.activate(); } catch {}
    }
    nav.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']; if (!keys.includes(event.key)) return;
      event.preventDefault(); const ids = [...entries.keys()], index = ids.indexOf(active);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
      entries.get(ids[next]).tab.focus({preventScroll:true}); activate(ids[next]);
    });
    const requested = new URL(location.href).searchParams.get('demo');
    await activate(entries.has(requested) ? requested : catalog.default, Boolean(requested && !entries.has(requested)));
    if (location.hash === '#demo') {
      await document.fonts.ready;
      requestAnimationFrame(() => document.getElementById('demo').scrollIntoView({block:'start'}));
    }
  }
  let pending;
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) boot();
  }, {rootMargin:'700px'});
  function boot() {
    if (pending) return pending; observer.disconnect();
    pending = start().catch(error => {
      root.replaceChildren(make('p', 'demo-loading', t('The demo catalogue could not be loaded.')));
      const retry = make('button', 'replay-play', t('Try again')); retry.type = 'button'; retry.onclick = () => location.reload(); root.append(retry); console.error(error);
    });
    return pending;
  }
  window.DemoGallery = {prepare:boot};
  if (location.hash === '#demo') boot(); else observer.observe(root);
})();
