/* Data-driven screen replay. The method rail is shared with article case embeds. */
window.DemoReplay = (() => {
  const make = EvidenceUI.make, timing = DemoTiming, t = HomeLocale.t;
  const seconds = n => n.toFixed(2) + ' s';
  const button = (label, cls, title = label) => {
    const b = make('button', cls, t(label)); b.type = 'button'; b.setAttribute('aria-label', t(title)); return b;
  };
  async function mount(root, {data, base}) {
    let playing = false, speed = 1, previousFrame = 0, raf = 0, dialog;
    const views = [], expanded = new Set();
    const map = run => timing.presentation(run, expanded.has(run.id));
    let duration = Math.max(...data.runs.map(r => map(r).total));
    const actualTime = run => playback.isLocal(run.id) ? playback.forRun(run.id) : map(run).actual(playback.time);
    const playback = timing.createClock(data.runs);
    root.classList.add('evidence-reader');
    const displayName = run => run.label + (run.precision === 'BF16' ? '' : ' ' + run.precision);
    // First screens unblock interaction; remaining snapshots warm in a bounded queue.
    const urls = [...new Set(data.runs.flatMap(r => [...r.steps.map(s => ({path:s.image,time:s.start})), {path:r.final,time:r.total}]).sort((a,b)=>a.time-b.time).map(x=>x.path))];
    async function fetchImage(path) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await new Promise((resolve, reject) => {
            const image = new Image(); image.onload = () => image.decode().then(resolve, reject);
            image.onerror = () => reject(Error('Could not load replay screenshot: ' + path));
            image.src = new URL(path, base).href;
          });
          return;
        } catch (error) {
          if (attempt === 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }
    }
    const pendingImages = new Map(), readyImages = new Set();
    function decode(path) {
      if (!pendingImages.has(path)) pendingImages.set(path, fetchImage(path).then(() => readyImages.add(path)).catch(error => {pendingImages.delete(path);throw error;}));
      return pendingImages.get(path);
    }
    await Promise.all(data.runs.map(run => decode(run.steps[0].image)));
    let nextImage = 0;
    Promise.all(Array.from({length:2}, async () => {
      while (nextImage < urls.length) { try { await decode(urls[nextImage++]); } catch {} }
    }));
    root.replaceChildren();
    const railRoot = make('div'); root.append(railRoot);
    const controls = make('div', 'replay-controls'), play = button('Play', 'replay-play', 'Play synchronized replay');
    const clock = make('span', 'replay-clock'), clockValue = make('output', '', '0.00'); clockValue.setAttribute('aria-live', 'off'); const clockEnd = make('span'); clock.append(make('span', 'replay-progress-label', t('Presentation progress')), clockValue, clockEnd);
    const seek = make('input', 'replay-seek'); seek.type = 'range'; seek.min = 0; seek.max = duration; seek.step = 'any'; seek.value = 0; seek.setAttribute('aria-label', t('Presentation progress'));
    const rateLabel = make('label', 'replay-rate', t('Speed')), rate = make('select'); rate.setAttribute('aria-label', t('Playback speed'));
    for (const value of [.5, 1, 2]) { const option = make('option', '', value + '×'); option.value = value; option.selected = value === 1; rate.append(option); }
    rateLabel.append(rate); controls.append(play, clock, seek, rateLabel);
    const key = make('div', 'replay-key');
    for (const [phase, name] of [['infer', 'Model inference'], ['act', 'Environment execution'], ['observe', 'Observation & overhead']]) {
      const item = make('span', '', t(name)); item.dataset.phase = phase; item.prepend(make('i')); key.append(item);
    }
    function setPlaying(value) {
      playing = value; play.textContent = t(playing ? 'Pause' : playback.time >= duration ? 'Replay' : 'Play');
      play.setAttribute('aria-label', t(playing ? 'Pause synchronized replay' : 'Play synchronized replay'));
      views.forEach(v => { v.screen.dataset.active = String(playing && !playback.isLocal(v.run.id)); });
      cancelAnimationFrame(raf); previousFrame = 0;
      if (playing) raf = requestAnimationFrame(tick);
    }
    function tick(now) {
      if (!playing) return;
      if (previousFrame) playback.advance(Math.min((now - previousFrame) / 1000 * speed, Math.max(0, duration - playback.time)));
      previousFrame = now; render();
      if (playback.time >= duration) setPlaying(false); else raf = requestAnimationFrame(tick);
    }
    function jump(value) { playback.seekAll(value); setPlaying(false); render(); }
    function inspect(id, value) {
      const run = data.runs.find(r => r.id === id), m = map(run);
      if (m.folded && value >= m.start && value < run.total) { expanded.add(id); layoutTimelines(); }
      playback.seekRun(id, value); render();
    }
    function layoutTimelines() {
      duration = Math.max(...data.runs.map(r => map(r).total)); seek.max = duration;
      if (playback.time > duration) playback.seekAll(duration);
      for (const v of views) {
        const m = map(v.run);
        v.steps.forEach((b,i) => {
          const step = v.run.steps[i]; b.hidden = m.folded && i >= v.run.repetition.from;
          b.style.left = 100*m.position(step.start)/duration+'%';
          b.style.width = 100*(m.position(step.end)-m.position(step.start))/duration+'%';
        });
        v.end.style.left = 100*m.total/duration+'%';
        if (v.fold) {
          v.fold.hidden = !m.folded;
          v.fold.style.left = 100*m.start/duration+'%'; v.fold.style.width = 200/duration+'%';
          v.toggle.textContent = t(m.folded ? 'Expand repetitions' : 'Collapse repetitions');
          v.toggle.setAttribute('aria-expanded', String(!m.folded));
        }
        v.cache = '';
      }
    }
    function openScreen(view) {
      setPlaying(false);
      if (!dialog) {
        dialog = make('dialog', 'replay-dialog'); document.body.append(dialog);
        dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
      }
      const header = make('header'), title = make('h3', '', displayName(view.run)), close = button('Close', '');
      title.id = 'replay-dialog-title-' + data.id; close.onclick = () => dialog.close(); header.append(title, close);
      const screen = view.screen.cloneNode(true); screen.dataset.active = 'false';
      const state = timing.at(view.run, actualTime(view.run));
      dialog.replaceChildren(header, screen, make('p', '', t('Step {n}', {n:state.step.index + 1}) + ' · ' + t(state.step.title)));
      dialog.setAttribute('aria-labelledby', title.id); dialog.showModal(); close.focus();
    }
    function card(run) {
      const node = make('section', 'replay-card'); node.dataset.method = run.id;
      const heading = make('header', 'replay-heading');
      const stats = make('p'); stats.append(t('Inference') + ' ', make('strong', '', seconds(run.inference)), ' · ' + t('Total') + ' ', make('strong', '', seconds(run.total)));
      const methodTitle = make('h3', '', run.label);
      if (run.precision !== 'BF16') methodTitle.append(make('span', 'replay-precision', run.precision));
      heading.append(methodTitle, stats);
      const body = make('div', 'replay-body'), screenButton = button('', 'replay-screen-button', t('Enlarge {method} screen', {method:run.label})), screen = make('div', 'replay-screen');
      screenButton.dataset.enlargeLabel = t('Enlarge');
      const img = make('img'); img.width = data.width; img.height = data.height;
      const tap = make('span', 'replay-tap'), input = make('div', 'replay-input');
      const swipe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      swipe.classList.add('replay-swipe'); swipe.setAttribute('viewBox', `0 0 ${data.width} ${data.height}`); swipe.setAttribute('aria-hidden', 'true');
      const swipePath = document.createElementNS(swipe.namespaceURI, 'path'); swipe.append(swipePath); tap.hidden = input.hidden = true; tap.setAttribute('aria-hidden', 'true');
      screen.append(img, tap, swipe, input); screenButton.append(screen);
      const reading = make('div', 'replay-reading'), stateLine = make('p', 'replay-state'), stepLabel = make('span'), phaseLabel = make('span'), title = make('h4');
      stateLine.append(stepLabel, phaseLabel);
      const output = make('div', 'replay-output'); output.setAttribute('role', 'region'); output.setAttribute('aria-label', t('{method} current model output', {method:run.label}));
      const stepNav = make('div', 'replay-step-nav'), previous = button('Previous', '', t('{method}: previous decision', {method:run.label})), next = button('Next', '', t('{method}: next decision', {method:run.label})); stepNav.append(previous, next);
      reading.append(stateLine, title, output, stepNav); body.append(screenButton, reading);
      const timingBox = make('div', 'replay-timing'), timingLabel = make('div', 'replay-timing-label'), timeline = make('div', 'replay-timeline'), head = make('span', 'replay-playhead');
      timeline.setAttribute('aria-label', t('{method} decisions', {method:run.label}));
      const steps = run.steps.map(s => {
        const b = button('', 'replay-step', `${run.label}, ${t('Step {n}', {n:s.index + 1})}: ${t(s.title)}. ${t('Inference')} ${seconds(s.actStart - s.inferStart)}, ${t('Execution')} ${seconds(s.end - s.actStart)}`);
        b.style.left = 100 * s.start / duration + '%'; b.style.width = 100 * (s.end - s.start) / duration + '%'; b.title = t('Step {n}', {n:s.index + 1}) + ' · ' + t(s.title);
        for (const [phase, span] of [['observe', s.inferStart - s.start], ['infer', s.actStart - s.inferStart], ['act', s.end - s.actStart]]) { const piece = make('span'); piece.dataset.phase = phase; piece.style.width = 100 * span / (s.end - s.start) + '%'; b.append(piece); }
        b.onclick = () => inspect(run.id, timing.decisionTime(s)); timeline.append(b); return b;
      });
      const scale = make('div', 'replay-scale'), end = make('span', '', seconds(run.total));
      end.style.left = 100 * run.total / duration + '%'; scale.append(make('span', '', '0 s'), end);
      timeline.append(head); timingBox.append(timingLabel, timeline, scale); node.append(heading, body, timingBox);
      const view = {run, node, end, screen, img, tap, swipe, swipePath, input, stepLabel, phaseLabel, title, output, timingLabel, head, steps, previous, next, cache:''};
      previous.onclick = () => { const state = timing.at(run, actualTime(run)); inspect(run.id, timing.decisionTime(run.steps[Math.max(0, state.step.index - 1)])); };
      next.onclick = () => { const localTime = actualTime(run), state = timing.at(run, localTime); const i = Math.min(run.steps.length - 1, state.step.index + (localTime >= state.step.actStart ? 1 : 0)); inspect(run.id, timing.decisionTime(run.steps[i])); };
      if (run.repetition) {
        const count = run.steps.length-run.repetition.from, elapsed = run.total-run.steps[run.repetition.from].start;
        const summary = t('{label} × {count} · {time}', {label:t(run.repetition.label), count, time:seconds(elapsed)});
        view.repeatSummary = summary;
        view.fold = button('⋯', 'replay-fold', 'Expand repetitions'); view.fold.title = summary;
        view.toggle = button('Expand repetitions', 'replay-fold-toggle');
        const note = make('div','replay-repeat-note'); note.append(make('span','',summary),view.toggle);
        timingBox.append(note); timeline.append(view.fold);
        const toggle = () => {
          setPlaying(false); const time = actualTime(run);
          if (expanded.has(run.id)) expanded.delete(run.id); else expanded.add(run.id);
          layoutTimelines();
          // Expanding allows inspection at the exact recorded step; collapsing returns
          // to synchronized presentation, without advancing any other method.
          if (expanded.has(run.id)) playback.seekRun(run.id,time);
          else playback.seekRun(run.id,time >= map(run).start ? run.total : time);
          render();
        };
        view.toggle.onclick = toggle; view.fold.onclick = toggle;
      }
      screenButton.onclick = () => openScreen(view); views.push(view); return node;
    }
    const items = data.runs.map(run => ({id:run.id, title:run.label, detail:run.precision === 'BF16' ? '' : run.precision, node:card(run)}));
    const rail = ArticleCaseRail.mount(railRoot, {id:data.id + '-demo', label:t('Task replay'), language:SiteLocale.lang, items, initial:'bf16', stability:'content'});
    railRoot.querySelector('.rail-toolbar').after(controls);
    controls.append(key);
    function render() {
      clockValue.value = Math.round(100*playback.time/duration)+'%'; clockEnd.textContent = ''; seek.value = playback.time; seek.setAttribute('aria-valuetext', clockValue.value);
      for (const v of views) {
        const s = timing.at(v.run, actualTime(v.run)), step = s.step, available = s.phase === 'act' || s.finished;
        v.timingLabel.replaceChildren(make('span', '', `${t('Inference')} ${seconds(s.inference)} · ${t('Execution')} ${seconds(s.execution)}`), make('span', 'replay-local-time', `${playback.isLocal(v.run.id) ? t('Local') + ' · ' : ''}${seconds(s.time)}`));
        v.screen.dataset.active = String(playing && !playback.isLocal(v.run.id) && !s.finished);
        const m = map(v.run), holding = !playback.isLocal(v.run.id) && m.holding(playback.time);
        v.head.style.left = Math.min(100, (holding ? playback.time : m.position(s.time)) / duration * 100) + '%';
        // A new decision must not inherit an unlabeled output from the previous step.
        const outputStep = available ? step : null;
        const cache = `${step.index}:${s.phase}:${holding}`;
        if (cache === v.cache) continue; v.cache = cache;
        const imagePath = s.finished ? v.run.final : step.image, image = new URL(imagePath, base).href;
        v.imageTarget = image;
        const showImage = () => {if(v.imageTarget !== image)return;v.img.src=image;v.screen.removeAttribute('aria-busy');};
        if (readyImages.has(imagePath)) showImage();
        else {v.screen.setAttribute('aria-busy','true');decode(imagePath).then(showImage).catch(()=>{});}
        v.img.alt = `${v.run.label}, ${t('Step {n}', {n:step.index + 1})}: ${t(step.title)}${s.finished ? ', ' + t('final screen') : ''}`;
        v.stepLabel.textContent = t('Step {n} / {total}', {n:step.index + 1, total:v.run.steps.length});
        v.phaseLabel.textContent = t(s.finished ? (v.run.success ? 'Completed' : 'Not completed') : ({observe:'Observing', infer:'Thinking', act:'Executing'})[s.phase]);
        v.phaseLabel.classList.toggle('replay-outcome', s.finished);
        v.phaseLabel.dataset.failed = String(s.finished && !v.run.success);
        v.title.textContent = holding ? t(v.run.repetition.label) : t(step.title);
        if (holding) { v.phaseLabel.textContent = t('Repetitions condensed'); v.stepLabel.textContent = t('Steps {from}–{to}',{from:v.run.repetition.from+1,to:v.run.steps.length}); }
        v.previous.disabled = step.index === 0; v.next.disabled = step.index === v.run.steps.length - 1 && available;
        v.steps.forEach((b, i) => { if (i === step.index) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
        const action = step.executed, executing = s.phase === 'act';
        v.tap.hidden = !(executing && action.action === 'tap');
        if (!v.tap.hidden) { v.tap.style.left = 100 * action.x / data.width + '%'; v.tap.style.top = 100 * action.y / data.height + '%'; }
        v.swipe.style.display = executing && action.action === 'swipe' ? '' : 'none';
        if (executing && action.action === 'swipe') {
          const {x1,y1,x2,y2} = action, angle = Math.atan2(y2-y1,x2-x1), size = 20;
          const a = [x2-size*Math.cos(angle-.5),y2-size*Math.sin(angle-.5)], b = [x2-size*Math.cos(angle+.5),y2-size*Math.sin(angle+.5)];
          v.swipePath.setAttribute('d', `M${x1} ${y1}L${x2} ${y2}M${a[0]} ${a[1]}L${x2} ${y2}L${b[0]} ${b[1]}`);
        }
        v.input.hidden = !(executing && ['input_text', 'press_enter'].includes(action.action));
        if (!v.input.hidden) v.input.replaceChildren(make('small', '', t(action.action === 'input_text' ? 'Typing' : 'Key press')), document.createTextNode(action.text || 'Enter'));
        v.output.replaceChildren(); v.output.scrollTop = 0;
        if (holding || (m.folded && s.finished)) v.output.append(make('p','replay-repeat-summary',t('Condensed: {summary}',{summary:v.repeatSummary})));
        if (!outputStep) v.output.append(make('p', 'replay-waiting', t(s.phase === 'infer' ? 'Generating the next action…' : 'Reading the screen…')));
        else {
          const thought = make('p', 'ev-prose'); thought.lang = v.run.language;
          thought.append(EvidenceUI.highlightedText(outputStep.thought, outputStep.thoughtHighlights));
          const thoughtFrame = EvidenceUI.frame(t('Thinking'), thought);
          const thoughtBody = thoughtFrame.querySelector('.ev-body'); thoughtBody.tabIndex = 0; thoughtBody.setAttribute('role', 'region'); thoughtBody.setAttribute('aria-label', t('{method} thinking', {method:v.run.label}));
          v.output.append(thoughtFrame);
          const actionFrame = EvidenceUI.frame(t('Action'), EvidenceUI.action(outputStep.actionEvent), {tone:outputStep.actionEvent.tone === 'neutral' ? '' : outputStep.actionEvent.tone});
          const actionBody = actionFrame.querySelector('.ev-body'); actionBody.tabIndex = 0; actionBody.setAttribute('role', 'region'); actionBody.setAttribute('aria-label', t('{method} action', {method:v.run.label}));
          v.output.append(actionFrame);
        }
      }
    }
    play.onclick = () => {
      if (!playing) playback.seekAll(playback.time >= duration ? 0 : playback.time);
      setPlaying(!playing); render();
    };
    seek.addEventListener('input', () => jump(Number(seek.value)));
    rate.onchange = () => { speed = Number(rate.value); };
    const onVisibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', onVisibility);
    const visibility = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) setPlaying(false); });
    visibility.observe(root);
    layoutTimelines(); render(); root.dataset.ready = 'true';
    return {
      pause: () => setPlaying(false),
      activate: () => render(),
      destroy() { setPlaying(false); visibility.disconnect(); document.removeEventListener('visibilitychange', onVisibility); rail.destroy(); dialog?.remove(); }
    };
  }
  return {mount};
})();
