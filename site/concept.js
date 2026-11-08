/* All marks share a single 17-second clock, including pause and visibility changes. */
(() => {
  'use strict';
  const root = document.querySelector('[data-concept-motion]');
  if (!root || !Element.prototype.animate) return;
  const t = text => window.HomeLocale?.t(text) || text;
  const duration = 17000, fadeAt = 15600, fadeEnd = 16400;
  const control = root.querySelector('[data-concept-play]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Each window: reveal begins, reveal ends, optional fade begins/ends.
  // A repeated window redraws the same route after feedback, from the same state.
  const tracks = [
    ['locate-context', [[400, 700]]],
    ['decision-1', [[400, 700]], 'bar'],
    ['decision-2', [[760, 1060]], 'bar'],
    ['decision-3', [[1120, 1420]], 'bar'],
    ['decision-4', [[1480, 1780]], 'bar'],
    ['failure', [[1820, 2070]]],
    ['guidance-label', [[2300, 2620]]],
    ['guidance', [[2300, 2620]]],
    ['guidance-initial', [[2530, 2810, 6300, 6600]]],
    ['to-agent', [[2900, 3250, 6300, 6600], [7100, 7450]], 'line'],
    ['to-agent-tip', [[3170, 3300, 6300, 6600], [7370, 7500]]],
    ['retry-label', [[3400, 3700, 6300, 6600], [7600, 7900]]],
    ['retry-failed', [[3400, 3700, 6300, 6600]], 'bar'],
    ['to-verify', [[4300, 4530, 6300, 6600], [8420, 8650]], 'line'],
    ['to-verify-tip', [[4460, 4590, 6300, 6600], [8580, 8710]]],
    ['verify-label', [[4700, 4960, 6300, 6600], [8840, 9200]]],
    ['verify-failed', [[4700, 4960, 6300, 6600]]],
    ['feedback-label', [[5100, 6100]]],
    ['feedback', [[5100, 6100]], 'line'],
    ['feedback-tip', [[6000, 6170]]],
    ['guidance-refined', [[6650, 7000]]],
    ['retry-corrected', [[7600, 7900]], 'bar'],
    ['verified', [[8840, 9200]], 'line'],
    ['distill-label', [[9400, 10400]]],
    ['retain', [[9400, 10400]], 'line'],
    ['retain-tip', [[10300, 10470]]],
    ['learn-context', [[10700, 11000]]],
    ...Array.from({length:6}, (_, i) => [`learn-${i+1}`, [[10700+i*320,11000+i*320]], 'bar'])
  ];
  const smooth = 'cubic-bezier(.22,.61,.36,1)';
  function frames(windows, kind) {
    const frame = (time, opacity, progress = opacity, easing = 'linear') => ({
      offset: time / duration, opacity, easing,
      ...(kind === 'bar' ? {transform:`scaleX(${progress})`} : {}),
      ...(kind === 'line' ? {strokeDashoffset:1-progress} : {})
    });
    const result = [frame(0,0)];
    for (const [start,end,hide=fadeAt,hidden=fadeEnd] of windows) {
      result.push(frame(start,0,0,smooth), frame(end,1),
        frame(hide,1,1,smooth), frame(hidden,0,1));
      // Reset geometry only after it has faded out; the next retry grows anew.
      if(hidden < fadeEnd) result.push(frame(hidden+1,0,0));
    }
    result.push(frame(duration,0,1));
    return result;
  }
  const animations = tracks.map(([name,windows,kind]) => {
    const element = root.querySelector(`[data-motion="${name}"]`);
    if(kind === 'line') element.style.strokeDasharray = '1';
    const animation = element.animate(frames(windows,kind), {duration,iterations:Infinity,fill:'both'});
    animation.id = name;
    animation.pause(); animation.currentTime = 0;
    return animation;
  });
  let playing = !reduced.matches, visible = false;
  function sync() {
    const time = animations[0].currentTime ?? 0;
    const running = playing && visible && !document.hidden;
    const start = document.timeline.currentTime - time;
    for(const animation of animations) {
      animation.pause(); animation.currentTime = time;
      if(running) { animation.play(); animation.startTime = start; }
    }
    root.dataset.motionRunning = String(running);
    control.textContent = t(playing ? 'Pause Ⅱ' : 'Play ▷');
    control.setAttribute('aria-pressed', String(playing));
    control.setAttribute('aria-label', t(playing ? 'Pause method animation' : 'Play method animation'));
  }
  function showStill() {
    playing = false;
    // Finished decisions and accepted verification, with the feedback loop visible.
    animations.forEach(a => { a.pause(); a.currentTime = 14000; });
    sync();
  }
  control.addEventListener('click', () => {
    if(!playing && reduced.matches) animations.forEach(a => {a.currentTime=0});
    playing = !playing; sync();
  });
  reduced.addEventListener('change', () => { if(reduced.matches) showStill(); });
  SiteVisibility.observe(root, next => {
    visible = next;
    if (visible && playing) animations.forEach(a => { a.pause(); a.currentTime = 0; });
    sync();
  });
  if(reduced.matches) showStill(); else sync();
})();
