/* Two reading figures, each with one clock and an inspectable sequence.
 * SVG geometry is illustrative. It does not encode measured probabilities. */
window.ArticleMotion = (() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  let serial = 0;
  const en = window.SiteLocale?.lang === 'en', W = (zh, english) => en ? english : zh;
  const stories = en ? {
    repair: [
      ['Locate', 'Align the student and teacher rollouts by environment state, find the first divergence, and restore the state before it.'],
      ['Steer', 'The teacher names the overlooked condition in a steering prompt G; the student regenerates and executes the turn.'],
      ['Feedback', 'If local verification fails, the teacher refines G into G′ from the execution feedback, and the student retries from the same state.'],
      ['Accept', 'State and returns match the reference, so the check passes; the correction y* and its prompt G′ are kept.'],
      ['Continue', 'The prompt is removed and the rollout continues. The check covers this turn only; task success depends on what follows.']
    ],
    distill: [
      ['Shared context', 'c is the history plus the response prefix. The student in training sees only c, never the guidance.'],
      ['Corrected turns', 'On corrected turns, the frozen snapshot also sees G; its token distribution is the forward-KL target.'],
      ['Other turns', 'On other turns, the full-precision teacher sees the same input as the student and supervises with reverse KL.'],
      ['Update', 'Only the quantized student is updated; in the next cycle it rolls out again to expose remaining errors.']
    ]
  } : {
    repair: [
      ['定位', '按环境状态对齐 Student 与 Teacher 的轨迹，找到首个行为分歧，并恢复分歧前的历史与环境状态。'],
      ['指导', 'Teacher 指出被忽略的条件，给出指导 G；Student 在原上下文中重新生成这一步并执行。'],
      ['反馈', '核验未通过时，执行反馈交还 Teacher，细化为 G′，Student 再从同一状态重试。'],
      ['接受', '状态与返回信息和参考一致，核验通过；保留修正 y* 及其指导 G′。'],
      ['继续', '撤去指导继续 rollout。核验只确认这一步，任务能否完成取决于后续执行。']
    ],
    distill: [
      ['同一上下文', 'c 由历史与回复前缀组成。训练中的 Student 始终只看到 c，看不到指导。'],
      ['修正轮次', '修正轮次：冻结快照额外接收指导 G，以其 token 分布作为 forward KL 的目标。'],
      ['其他轮次', '其他轮次：全精度 Teacher 与 Student 输入相同，以 reverse KL 提供监督。'],
      ['更新', '只更新量化 Student 的参数；下一周期用新模型重新 rollout，寻找仍未解决的错误。']
    ]
  };
  // Approximate advance widths for the reading sans; layout leaves margin for font variation.
  const tw = (value, size) => [...value].reduce((w, c) => w + (/[\u2e80-\u9fff\uff00-\uffef]/.test(c) ? size : size * (/[A-Z]/.test(c) ? .58 : .47)), 0);
  function el(tag, cls, text) {
    const n = document.createElement(tag); if (cls) n.className = cls;
    if (text) n.textContent = text; return n;
  }
  function svgEl(tag, attrs = {}, text) {
    const n = document.createElementNS(NS, tag);
    for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,v);
    if (text) n.textContent = text; return n;
  }
  function text(g,x,y,value,cls='',anchor='start') {
    g.append(svgEl('text',{x,y,class:cls,'text-anchor':anchor},value));
  }
  function path(g,d,cls='am-wire',extra={}) {g.append(svgEl('path',{d,class:cls,...extra}));}
  function rect(g,x,y,w,h,cls='am-box',rx=3) {g.append(svgEl('rect',{x,y,width:w,height:h,rx,class:cls}));}
  function group(g,stage,cls='',leave) {
    const n=svgEl('g',{'data-enter':stage,class:cls,...(leave===undefined?{}:{'data-leave':leave})});g.append(n);return n;
  }
  function arrow(g,d,marker,cls='am-wire',extra={}) {path(g,d,cls,{'marker-end':`url(#${marker})`,pathLength:1,...extra});}
  function signal(g,d,phase){path(g,d,'am-signal',{pathLength:1,'data-flow':phase});}
  function mark(g,x,y,kind='check') {
    path(g,kind==='check'?`M${x-5} ${y}l4 4 8-9`:`M${x-4} ${y-4}l8 8m0-8-8 8`,'am-mark');
  }
  function distribution(g,x,y,learner=false,teacher=false) {
    const bars=svgEl('g',{transform:`translate(${x} ${y})`,class:'am-distribution','aria-hidden':'true'});
    const corrected=[.2,.45,.9,.3,.55,.2],ordinary=[.45,.2,.35,.85,.25,.5],initial=[.7,.3,.25,.45,.6,.35];
    for(let i=0;i<6;i++){
      const bar=svgEl('rect',{x:i*8,y:-22,width:5,height:22,rx:.5,class:learner?'am-learner-bar':'am-target-bar'});
      bar.style.cssText=`--am-initial:${initial[i]};--am-corrected:${corrected[i]};--am-teacher:${ordinary[i]};${learner?'':`transform:scaleY(${(teacher?ordinary:corrected)[i]})`}`;
      bars.append(bar);
    }
    g.append(bars);
  }
  function setup(mobile,label) {
    const id='article-arrow-'+(++serial),svg=svgEl('svg',{
      viewBox:mobile?'0 0 360 570':'0 0 680 380',
      class:'am-svg '+(mobile?'am-mobile':'am-desktop'),role:'img','aria-label':label
    });
    const defs=svgEl('defs'),marker=svgEl('marker',{id,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});
    marker.append(svgEl('path',{d:'M2 2L8 5L2 8',fill:'none',stroke:'context-stroke','stroke-width':1.3}));defs.append(marker);svg.append(defs);return {svg,id};
  }
  // A labelled node: thin editorial rule, title and one line of detail.
  function node(g,x,y,title,detail,cls='') {
    path(g,`M${x+.5} ${y-15}V${y+27}`,'am-editorial-rule '+cls);
    text(g,x+12,y,title,'am-node-title');
    if(detail)text(g,x+12,y+22,detail,'am-small '+cls);
  }
  function traces(s,mobile) {
    const start=mobile?92:120,gap=mobile?60:100,x=start+gap*2;
    text(s,0,25,W('Teacher 参考','Teacher'),'am-label');text(s,0,69,'Student','am-label');
    const trace=group(s,0);
    for (let row=0;row<2;row++) {
      const y=21+row*44;
      path(trace,`M${start} ${y}H${start+gap*4}`,'am-track');
      for(let i=0;i<5;i++) {
        if(row===1&&i===2)continue;
        trace.append(svgEl('circle',{cx:start+gap*i,cy:y,r:3.5,class:row===0||i<2?'am-dot':'am-empty'}));
      }
    }
    path(trace,`M${x} 29V55`,'am-alignment');
    mark(group(trace,0,'am-red'),x,65,'cross');
    text(trace,x+10,46,W('首个行为分歧','First divergence'),'am-small am-red');
    // Restore the history and environment state that preceded the divergence.
    const back=group(trace,0,'am-blue');
    arrow(back,`M${x} 76V90H${x-gap}V78`,s.dataset.marker,'am-wire am-blue');
    text(back,x-gap,110,W('恢复分歧前的历史与环境状态','Restore the pre-error state'),'am-small am-blue');
    path(s,`M0 130H${mobile?360:680}`,'am-rule');
  }
  function repair(mobile) {
    const {svg:s,id}=setup(mobile,W('按环境状态定位首个行为分歧；Teacher 指导 Student 修订，未通过局部核验时用执行反馈细化指导，通过后保留修正并撤去指导继续执行。','Locate the first behavioral divergence by environment state; the teacher steers the student’s revision, refines its guidance from execution feedback when local verification fails, and the verified correction is kept as the rollout continues without guidance.'));
    s.dataset.marker=id;
    s.setAttribute('viewBox',mobile?'0 0 360 520':'0 0 680 236');
    traces(s,mobile);
    // Desktop: one row with the feedback arc above, spaced from label widths. Mobile: one column.
    const N=[
      {title:W('Teacher 指导','Teacher steers'),details:[W('G：指出遗漏的条件','G: what was missed'),W('G′：依据反馈细化','G′: after feedback')]},
      {title:W('Student 修订','Student revises'),details:[W('从同一状态重新生成','from the same state')]},
      {title:W('局部核验','Local check'),details:[W('对照参考结果','vs. the reference')],mark:22},
      {title:W('保留修正','Keep'),details:[W('y* 与 G′','y* and G′')]},
      {title:W('继续执行','Continue'),details:[W('撤去指导','no guidance')],min:78}];
    N.forEach(n=>{n.tw=tw(n.title,15)*1.05;n.w=Math.max(n.tw+(n.mark||0),...n.details.map(d=>tw(d,12)),n.min||0)+12;});
    const arrowLen=Math.max(18,(680-N.reduce((a,n)=>a+n.w,0)-4*20)/4);
    let cursor=0;const pos=N.map((n,i)=>{const p=mobile?[0,176+i*78]:[cursor,180];cursor+=n.w+20+arrowLen;return p;});
    const [g,st,v,r,c]=pos;
    const guide=group(s,1);
    node(guide,g[0],g[1],N[0].title,'',' am-blue');
    text(group(guide,1,'am-first',3),g[0]+12,g[1]+22,N[0].details[0],'am-small am-blue');
    text(group(guide,3,'am-revised'),g[0]+12,g[1]+22,N[0].details[1],'am-small am-blue');
    const student=group(s,1);node(student,st[0],st[1],N[1].title,N[1].details[0]);
    const verify=group(s,1);node(verify,v[0],v[1],N[2].title,N[2].details[0]);
    const link=(grp,i,phase,cls='am-wire am-blue')=>{
      const from=pos[i],to=pos[i+1];
      const d=mobile?`M${from[0]+20} ${from[1]+32}V${to[1]-21}`:`M${from[0]+N[i].w+10} ${from[1]-5}H${to[0]-10}`;
      arrow(grp,d,id,cls);signal(grp,d,phase);
    };
    link(student,0,1);link(verify,1,1);
    const feedback=group(s,2,'am-red');
    const loop=mobile?`M${v[0]+150} ${v[1]-5}H318V${g[1]-5}H${g[0]+150}`:`M${v[0]+36} ${v[1]-21}V150H${g[0]+40}V${g[1]-21}`;
    arrow(feedback,loop,id,'am-wire am-red am-draw');signal(feedback,loop,2);
    if(mobile)text(feedback,310,(g[1]+v[1])/2,W('执行反馈','Execution feedback'),'am-small am-red','end');
    else text(feedback,(g[0]+v[0])/2+40,144,W('执行反馈','Execution feedback'),'am-small am-red','middle');
    const markX=v[0]+12+N[2].tw+14;
    mark(group(s,2,'am-red',3),markX,v[1]-5,'cross');
    mark(group(s,3,'am-blue'),markX,v[1]-5);
    const keep=group(s,3);node(keep,r[0],r[1],N[3].title,N[3].details[0],' am-blue');link(keep,2,3);
    const go=group(s,4);node(go,c[0],c[1],N[4].title,N[4].details[0]);link(go,3,4);
    for(let i=0;i<3;i++)rect(go,(mobile?c[0]+150:c[0]+12)+i*26,mobile?c[1]+14:c[1]+38,20,6,'am-action',0);
    return s;
  }
  function distill(mobile) {
    const {svg:s,id}=setup(mobile,W('同一上下文 c；修正轮次由看得到指导的冻结快照提供 forward KL 目标，其他轮次由全精度 Teacher 提供 reverse KL 监督；训练中的 Student 始终看不到指导。','Shared context c: on corrected turns, a frozen snapshot that sees the guidance provides the forward-KL target; on other turns, the full-precision teacher supervises with reverse KL. The student in training never sees the guidance.'));
    s.setAttribute('viewBox',mobile?'0 0 360 530':'0 0 680 306');
    text(s,0,20,W('保留轨迹','Retained trajectory'),'am-label');
    const tape=group(s,0);
    for(let i=0;i<7;i++)rect(tape,i*46,34,36,8,i===2?'am-action':'am-tape',0);
    path(tape,'M92 50H128','am-turn-marker');
    text(tape,110,72,W('修正轮次','Corrected turn'),'am-small am-blue','middle');
    text(tape,248,72,W('其他轮次','Other turns'),'am-small','middle');
    const ctx=group(s,0),cx=mobile?0:400,cy=mobile?108:30;
    text(ctx,cx,cy,W('c = 历史 ＋ 回复前缀','c = history + response prefix'),'am-context');
    text(ctx,cx,cy+24,W('Student 的输入不含指导','The student never sees guidance'),'am-small');
    const rule=mobile?150:96;path(s,`M0 ${rule}H${mobile?360:680}`,'am-rule');
    const sy=rule+(mobile?56:58),ty=sy+(mobile?104:96);
    const source=group(s,0,'am-source');
    text(source,0,sy-30,W('修正轮次','Corrected turns'),'am-label am-blue');
    node(source,0,sy,W('冻结 Student 快照','Frozen snapshot'),'',' am-blue');text(source,12,sy+22,W('输入 c ＋ G','input c + G'),'am-small am-blue');
    distribution(source,160,sy+24);
    const teacher=group(s,0,'am-teacher');
    text(teacher,0,ty-30,W('其他轮次','Other turns'),'am-label');
    node(teacher,0,ty,W('全精度 Teacher','BF16 teacher'),'',' am-neutral');text(teacher,12,ty+22,W('输入 c','input c'),'am-small');
    distribution(teacher,160,ty+24,false,true);
    const lx=mobile?0:450,ly=mobile?ty+108:(sy+ty)/2-6,lw=mobile?360:230;
    const learner=group(s,0,'am-learner');
    path(learner,`M${lx} ${ly-28}H${lx+lw}M${lx} ${ly+38}H${lx+lw}`,'am-learner-rule');
    text(learner,lx+12,ly,W('训练中的 Student','Student in training'),'am-node-title');
    text(learner,lx+12,ly+22,W('输入 c','input c'),'am-small am-blue');
    distribution(learner,lx+lw-60,ly+24,true);
    const fkl=group(s,1,'am-fkl',2),rkl=group(s,2,'am-rkl',3);
    const fd=mobile?`M222 ${sy-5}H300V${ly-36}`:`M222 ${sy-5}H340Q356 ${sy-5} 356 ${sy+11}V${ly-16}H440`;
    const rd=mobile?`M222 ${ty-5}H256V${ly-36}`:`M222 ${ty-5}H340Q356 ${ty-5} 356 ${ty-21}V${ly+8}H440`;
    arrow(fkl,fd,id,'am-wire am-blue am-draw');signal(fkl,fd,1);
    arrow(rkl,rd,id,'am-wire am-blue am-draw');signal(rkl,rd,2);
    text(fkl,230,sy-13,'forward KL','am-small am-blue');
    text(rkl,230,ty-13,'reverse KL','am-small am-blue');
    const update=group(s,3,'am-blue');
    text(update,lx+12,ly+62,W('↻ 更新参数，下一周期重新 rollout','↻ Update, then roll out again'),'am-small am-blue');
    text(s,mobile?0:680,mobile?526:302,W('token 分布仅为示意','Token distributions are illustrative'),'am-tiny',mobile?'start':'end');
    return s;
  }
  function mount(kind,title) {
    const figure=el('figure',`${kind==='repair'?'method-diagram':'target-diagram'} article-motion`);
    figure.dataset.story=kind;figure.dataset.stage='0';
    const head=el('div','am-heading');head.append(el('h3','',title));
    const play=el('button','am-play',W('暂停 Ⅱ','Pause Ⅱ'));play.type='button';head.append(play);figure.append(head);
    const stage=el('div','am-canvas');stage.append(...[false,true].map(kind==='repair'?repair:distill));figure.append(stage);
    const controls=el('div','am-steps');controls.setAttribute('role','group');controls.setAttribute('aria-label',title+W('：逐步查看',': step by step'));
    const steps=stories[kind],buttons=steps.map(([label],i)=>{const b=el('button','',label);b.type='button';b.setAttribute('aria-label',W(`第 ${i+1} 步：${label}`,`Step ${i+1}: ${label}`));b.append(el('span','am-step-progress'));controls.append(b);return b;});
    const caption=el('figcaption','am-caption');const counter=el('span','am-counter'),copy=el('span');caption.append(counter,copy);figure.append(controls,caption);
    // Move briskly through the explanation, then hold the completed diagram.
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),phaseMs=1600,lastHoldMs=4800;
    const total=(steps.length-1)*phaseMs+lastHoldMs;
    let elapsed=reduced.matches?(steps.length-1)*phaseMs:0,playing=!reduced.matches,visible=false,frame=0,previous=0,current=-1;
    const reveals=[...stage.querySelectorAll('[data-enter]')];
    function paint() {
      const index=Math.min(steps.length-1,Math.floor(elapsed/phaseMs));
      if(index!==current){
        current=index;figure.dataset.stage=String(index);
        reveals.forEach(n=>n.dataset.revealed=String(index>=Number(n.dataset.enter)&&(n.dataset.leave===undefined||index<Number(n.dataset.leave))));
        buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
        counter.textContent=String(index+1).padStart(2,'0');copy.textContent=steps[index][1];
      }
      const duration=index===steps.length-1?lastHoldMs:phaseMs;
      figure.style.setProperty('--am-progress',(elapsed-index*phaseMs)/duration);
    }
    function tick(now){if(previous)elapsed=(elapsed+now-previous)%total;previous=now;paint();frame=requestAnimationFrame(tick);}
    function sync(){
      cancelAnimationFrame(frame);previous=0;
      const run=playing&&visible&&!document.hidden;
      figure.dataset.running=String(run);play.textContent=playing?W('暂停 Ⅱ','Pause Ⅱ'):W('播放 ▷','Play ▷');
      play.setAttribute('aria-label',(playing?W('暂停','Pause'):W('播放','Play'))+W('：',': ')+title);play.setAttribute('aria-pressed',String(playing));
      if(run)frame=requestAnimationFrame(tick);
    }
    play.onclick=()=>{if(!playing&&reduced.matches&&current===steps.length-1){elapsed=0;paint();}playing=!playing;sync();};
    buttons.forEach((b,i)=>b.onclick=()=>{elapsed=i*phaseMs;playing=false;paint();sync();});
    SiteVisibility.observe(figure,next=>{
      visible=next;
      if(visible&&playing){elapsed=0;paint();for(const a of figure.getAnimations({subtree:true}))if(a instanceof CSSAnimation)a.currentTime=0;}
      sync();
    });
    reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;elapsed=(steps.length-1)*phaseMs;paint();sync();}});
    paint();sync();return figure;
  }
  return {mount};
})();
