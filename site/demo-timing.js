/* One master clock with independent, paused inspection positions per method. */
window.DemoTiming = (() => {
  function at(run, time) {
    const t = Math.max(0, Math.min(time, run.total));
    const finished = t >= run.steps.at(-1).end;
    const step = run.steps.find(s => t < s.end) || run.steps.at(-1);
    const phase = finished ? 'done' : t < step.inferStart ? 'observe' : t < step.actStart ? 'infer' : 'act';
    const sum = (from, to) => run.steps.reduce((n, s) => n + Math.max(0, Math.min(t, s[to]) - s[from]), 0);
    return {step, phase, finished, time: t, inference: sum('inferStart', 'actStart'), execution: sum('actStart', 'end')};
  }
  function decisionTime(step) { return step.actStart + (step.end - step.actStart) / 2; }
  function createClock(runs) {
    const ends = new Map(runs.map(run => [run.id, run.total]));
    const duration = Math.max(...ends.values()), local = new Map();
    let time = 0;
    // Native range inputs can round the endpoint by a few floating-point digits.
    const clamp = (value, end) => Math.abs(value - end) < 1e-9 ? end : Math.max(0, Math.min(value, end));
    return {
      get time() { return time; },
      seekAll(value) { time = clamp(value, duration); local.clear(); },
      seekRun(id, value) {
        if (!ends.has(id)) throw Error('Unknown replay method: ' + id);
        local.set(id, clamp(value, ends.get(id)));
      },
      advance(seconds) { time = clamp(time + seconds, duration); },
      forRun(id) { return local.has(id) ? local.get(id) : clamp(time, ends.get(id)); },
      isLocal(id) { return local.has(id); }
    };
  }
  // Only editorially reviewed trailing repetitions may be folded. Raw times never change.
  function presentation(run, expanded = false) {
    const from = run.repetition?.from;
    const start = Number.isInteger(from) ? run.steps[from]?.start : undefined;
    const folded = !expanded && start !== undefined && run.total - start > 2;
    const total = folded ? start + 2 : run.total;
    return {
      folded, start, total,
      position(time) { return !folded || time <= start ? time : start + (time-start)/(run.total-start)*2; },
      actual(time) {
        if (!folded || time < start) return Math.min(time,run.total);
        if (time >= total - 1e-9) return run.total;
        return decisionTime(run.steps[from]);
      },
      holding(time) { return folded && time >= start && time < total - 1e-9; }
    };
  }
  return {at, decisionTime, createClock, presentation};
})();
