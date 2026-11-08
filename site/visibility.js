/* Enter once enough of a figure is readable; re-arm only after it has left.
   Pixel thresholds also work for figures taller than a mobile viewport. */
window.SiteVisibility = (() => {
  function observe(root, update) {
    let active = false, frame = 0, suspended = false;
    function check() {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const pixels = Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0);
      const next = root.isConnected && !suspended && !document.hidden && rect.height > 0 &&
        (active ? pixels > 0 : pixels >= Math.min(rect.height * .6, innerHeight * .35));
      if (next !== active) { active = next; update(active); }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(check); }
    update(false);
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule, {passive:true});
    document.addEventListener('visibilitychange', check);
    addEventListener('pagehide', () => { suspended = true; check(); });
    addEventListener('pageshow', () => { suspended = false; schedule(); });
    new ResizeObserver(schedule).observe(root);
    schedule();
  }
  function chart(root) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    function sync(restart = false) {
      root.dataset.chartRunning = String(visible && !reduced.matches);
      if (restart && !reduced.matches) {
        // Restart CSS timelines, including finished ones, without replacing SVG
        // nodes, keyboard focus, or the selected model/precision.
        for (const animation of root.getAnimations({subtree:true})) {
          if (animation instanceof CSSAnimation) animation.currentTime = 0;
        }
      }
    }
    observe(root, next => { visible = next; sync(next); });
    reduced.addEventListener('change', () => sync(visible));
  }
  return {observe, chart};
})();
