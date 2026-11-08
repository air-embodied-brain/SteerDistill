const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'site/demo-timing.js'), 'utf8'), context);
vm.runInNewContext(fs.readFileSync(path.join(root, 'site/cases/evidence-ui.js'), 'utf8'), context);
const timing = context.window.DemoTiming;
const data = JSON.parse(fs.readFileSync(path.join(root, 'demos/wps/replay.json')));
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test('replay retains every decision, output, executed coordinate and measured duration', () => {
  for (const run of data.runs) {
    const folder = path.join(root, 'demos/wps/raw', run.id);
    const rows = fs.readFileSync(path.join(folder, 'turns.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    const metrics = JSON.parse(fs.readFileSync(path.join(folder, 'metrics.json')));
    assert.equal(run.steps.length, rows.length);
    near(run.total, metrics.episode_seconds);
    for (const [i, step] of run.steps.entries()) {
      near(step.start, i ? rows[i - 1].episode_elapsed_seconds : 0);
      near(step.end, rows[i].episode_elapsed_seconds);
      near(step.actStart - step.inferStart, rows[i].inference_seconds);
      near(step.end - step.actStart, rows[i].environment_seconds);
      assert.ok(step.start <= step.inferStart && step.inferStart <= step.actStart && step.actStart <= step.end);
      assert.equal(step.action, rows[i].raw_action);
      assert.equal(step.thought, rows[i].thought);
      assert.deepEqual(step.executed, rows[i].result.info.executed_action);
      assert.ok(fs.existsSync(path.join(root, 'demos/wps', step.image)));
    }
    assert.ok(fs.existsSync(path.join(root, 'demos/wps', run.final)));
    const final = timing.at(run, 100);
    assert.equal(final.finished, true);
    near(final.inference, metrics.inference_seconds);
    near(final.execution, run.execution);
  }
});

test('shared wall time preserves early finish, phase boundaries, and exact step seeking', () => {
  const [bf16, ours, qad] = data.runs;
  assert.equal(timing.at(ours, 6).finished, true);
  assert.equal(timing.at(bf16, 6).finished, false);
  assert.equal(timing.at(qad, 4).finished, false);
  for (const run of data.runs) {
    assert.equal(timing.at(run, -1).time, 0);
    for (const step of run.steps) {
      assert.equal(timing.at(run, step.start).phase, 'observe');
      assert.equal(timing.at(run, step.inferStart).phase, 'infer');
      const selected = timing.at(run, timing.decisionTime(step));
      assert.equal(selected.phase, 'act');
      assert.equal(selected.step.index, step.index);
    }
  }
});

test('method seeking never changes the master or other methods; explicit master seeking resynchronizes all', () => {
  const c = timing.createClock(data.runs);
  c.seekAll(2);
  const oursBefore = c.forRun('ours'), qadBefore = c.forRun('qad');
  c.seekRun('bf16', 4.2);
  near(c.time, 2); near(c.forRun('bf16'), 4.2);
  near(c.forRun('ours'), oursBefore); near(c.forRun('qad'), qadBefore);
  c.advance(.5);
  near(c.time, 2.5); near(c.forRun('bf16'), 4.2); near(c.forRun('ours'), 2.5);
  assert.equal(c.isLocal('bf16'), true);
  c.seekRun('ours', 3.3); near(c.forRun('bf16'), 4.2); near(c.forRun('qad'), 2.5);
  c.seekAll(1);
  for (const run of data.runs) { near(c.forRun(run.id), 1); assert.equal(c.isLocal(run.id), false); }
  c.seekAll(99);
  for (const run of data.runs) near(c.forRun(run.id), run.total);
});

test('reviewed marks match original output; routine waiting remains unmarked and QAD divergence is grounded in the new run', () => {
  for (const run of data.runs) for (const step of run.steps) {
    context.window.EvidenceUI.validateSpans(step.thought, step.thoughtHighlights);
    context.window.EvidenceUI.validateSpans(step.action, step.actionEvent.highlights.call);
    assert.equal(`${step.actionEvent.name}(${step.actionEvent.args})`, step.action);
  }
  assert.deepEqual(data.runs[0].steps[3].thoughtHighlights, []);
  assert.deepEqual(data.runs[1].steps[3].actionEvent.highlights.call, []);
  assert.equal(data.runs[2].steps[0].thoughtHighlights[0].text, '首先需要授权查看本地文档才能搜索目标文件');
  assert.equal(data.runs[2].steps[1].actionEvent.highlights.call[0].tone, 'before');
  assert.deepEqual(data.runs.map(r => r.precision), ['BF16', 'W4A16', 'W4A16']);
});

test('every task has a reviewed, source-faithful replay with valid timing and precise highlights', () => {
 const catalog = JSON.parse(fs.readFileSync(path.join(root, 'demos/catalog.json')));
 assert.deepEqual(catalog.tasks.map(t => t.id), ['wps','whatsapp','news']);
 let count = 0;
 for (const task of catalog.tasks) {
  const folder = path.join(root, 'demos', task.path);
  const replay = JSON.parse(fs.readFileSync(path.join(folder, 'replay.json')));
  const editorial = JSON.parse(fs.readFileSync(path.join(folder, 'editorial.json')));
  assert.equal(replay.id, task.rawTask);
  for (const run of replay.runs) {
   const rows = fs.readFileSync(path.join(folder, 'raw', run.id, 'turns.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
   const metrics = JSON.parse(fs.readFileSync(path.join(folder,'raw',run.id,'metrics.json')));
   assert.equal(run.steps.length, rows.length); assert.equal(run.steps.length, editorial[run.id].steps.length);
   assert.equal(run.success, metrics.success); near(run.total, metrics.episode_seconds);
   for (const [i, step] of run.steps.entries()) {
    count++; assert.equal(step.thought, rows[i].thought); assert.equal(step.action, rows[i].raw_action);
    assert.deepEqual(step.executed, rows[i].result.info.executed_action);
    context.window.EvidenceUI.validateSpans(step.thought, step.thoughtHighlights);
    context.window.EvidenceUI.validateSpans(step.action, step.actionEvent.highlights.call);
    assert.equal(`${step.actionEvent.name}(${step.actionEvent.args})`, step.action);
    near(step.end, rows[i].episode_elapsed_seconds); near(step.actStart - step.inferStart, rows[i].inference_seconds);
    near(step.end - step.actStart, rows[i].environment_seconds);
    assert.ok(step.start <= step.inferStart); assert.equal(timing.at(run, timing.decisionTime(step)).step.index, i);
    assert.ok(fs.existsSync(path.join(folder, step.image)));
    assert.ok(editorial[run.id].steps[i].review);
   }
   near(timing.at(run, 999).inference, run.inference);
   assert.ok(fs.existsSync(path.join(folder, run.final)));
  }
 }
 assert.equal(count, 176);
});


test('range-input rounding still reaches the exact replay endpoint', () => {
  const clock = timing.createClock(data.runs), end = Math.max(...data.runs.map(r => r.total));
  clock.seekAll(Number(end.toPrecision(15)));
  assert.equal(clock.time, end);
  for (const run of data.runs) {
    clock.seekRun(run.id, Number(run.total.toPrecision(15)));
    assert.equal(clock.forRun(run.id), run.total);
    assert.equal(timing.at(run, clock.forRun(run.id)).finished, true);
  }
});

test('reviewed repeated tails compress only presentation time and preserve measured records', () => {
 for (const task of ['wps','whatsapp','news']) {
  const replay = JSON.parse(fs.readFileSync(path.join(root,'demos',task,'replay.json')));
  const run = replay.runs.find(r => r.id === 'qad'), snapshot = JSON.stringify(run);
  const m = timing.presentation(run), full = timing.presentation(run,true);
  assert.equal(m.folded,true); assert.equal(full.folded,false);
  assert.equal(m.start,run.steps[run.repetition.from].start);
  near(m.total,m.start+2); near(full.total,run.total);
  for (const step of run.steps.slice(0,run.repetition.from)) {
   near(m.position(step.start),step.start); near(m.actual(step.start),step.start);
  }
  assert.equal(m.holding(m.start+1),true);
  near(m.actual(m.start+1),timing.decisionTime(run.steps[run.repetition.from]));
  near(m.actual(m.total),run.total); near(m.position(run.total),m.total);
  near(full.actual(run.steps[20].actStart),run.steps[20].actStart);
  for (const successful of replay.runs.filter(r => r.success)) {
   const plain=timing.presentation(successful); assert.equal(plain.folded,false);
   near(plain.total,successful.total); near(plain.actual(2),2);
  }
  assert.equal(JSON.stringify(run),snapshot);
 }
});
