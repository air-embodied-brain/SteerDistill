/* Dataset-neutral, turn-aligned comparison. Literal event formatting stays in a case adapter. */
window.InferenceCase={mount(root,config){
 const t=(text,values)=>window.CaseLocale?.t(text,values)||text.replace(/\{(\w+)\}/g,(match,key)=>values?.[key]??match);
 const U=EvidenceUI,methods=config.methods;
 if(!Array.isArray(methods)||methods.length<2)throw new Error('InferenceCase requires at least two methods');
 if(methods.some(m=>typeof m.id!=='string'||!m.id)||new Set(methods.map(m=>m.id)).size!==methods.length)throw new Error('InferenceCase method IDs must be nonempty and unique');
 if(!Array.isArray(config.turns)||!config.turns.length||config.turns.some(t=>typeof t.label!=='string'))throw new Error('InferenceCase turns require display labels');
 if(methods.some(m=>!Array.isArray(m.turns)||m.turns.length!==config.turns.length||m.turns.some(t=>!Array.isArray(t))))throw new Error('Every method must provide an event array for every displayed turn');
 const byId=id=>methods.find(m=>m.id===id),params=new URLSearchParams(location.search),defaults=config.defaultPair||[methods[0].id,methods[1].id];
 if(defaults.length!==2||defaults[0]===defaults[1]||defaults.some(id=>!byId(id)))throw new Error('InferenceCase defaultPair requires two distinct known IDs');
 let left=params.get('left')||defaults[0],right=params.get('right')||defaults[1];
 if(!byId(left))left=defaults[0];if(!byId(right))right=defaults[1];if(left===right){if(params.has('right')&&!params.has('left'))left=defaults.find(id=>id!==right)||methods.find(m=>m.id!==right).id;else right=defaults.find(id=>id!==left)||methods.find(m=>m.id!==left).id;}
 const intro=U.make('div','intro'),summary=U.prose(config.summary);summary.classList.add('case-summary');intro.append(U.make('h1','case-title',config.title),summary,CaseTaskSource.create(config.task,{turns:config.taskTurns}));
 const controls=U.make('div','comparison-controls'),comparison=U.make('div','comparison-body');root.replaceChildren(intro,controls,comparison);
 const selected=()=>[byId(left),byId(right)],openStates=new Map();
 const save=()=>{const p=new URLSearchParams(location.search);p.delete('controls');p.delete('actions');p.set('left',left);p.set('right',right);history.replaceState(history.state,'',location.pathname+'?'+p+location.hash)};
 function choose(side,id){if(!byId(id))throw new Error('Unknown comparison method');if(side==='left'){if(id===right)right=left;left=id}else{if(id===left)left=right;right=id}save();renderControls();render();root.querySelector('#method-'+side)?.focus({preventScroll:true});}
 function renderControls(){controls.replaceChildren();const row=U.make('div','method-selects');selected().forEach((m,i)=>{const side=i?'right':'left',label=U.make('label'),select=U.make('select');select.id='method-'+side;select.setAttribute('aria-label',config.selectionLabels?.[i]||(i?t('右侧对比方法'):t('左侧对比方法'))); methods.forEach(x=>{const option=U.make('option','',x.name);option.value=x.id;option.selected=x.id===m.id;select.append(option)});select.onchange=()=>choose(side,select.value);label.append(U.make('span','selection-label',config.selectionLabels?.[i]||(i?t('右侧方法'):t('左侧方法'))),select);row.append(label)});controls.append(row);}
 function render(){comparison.querySelectorAll('[data-reasoning-turn]').forEach(d=>openStates.set(Number(d.dataset.reasoningTurn),d.open));comparison.replaceChildren();const pair=selected();
  const heads=U.pair(...pair.map(m=>{const h=U.make('div');h.append(U.make('h2','case-branch-title',m.name+(m.heading?t('：')+m.heading:'')));if(m.description)h.append(U.prose(m.description));return h}));heads.classList.add('branch-heads');comparison.append(heads);
  config.turns.forEach((turn,index)=>{const section=U.make('section',index?'step':'comparison-first-turn');if(turn.title)section.append(U.make('h2','case-section-title',turn.title));if(turn.summary)section.append(U.prose(turn.summary));
   section.append(U.pair(...pair.map(m=>{const body=U.make('div');if(index===0&&m.description){const summary=U.prose(m.description);summary.classList.add('comparison-mobile-summary');body.append(summary)}body.append(U.actionSequence((m.turns[index]||[]).map(config.presentEvent||((x)=>x))));return U.frame({title:t('调用与回复'),context:[m.name,turn.label,turn.excerpt?t('节选'):''].filter(Boolean).join(' · ')},body,{tone:m.tones?.[index]||''})})));
   if(turn.outcome)section.append(U.pair(...pair.map(m=>U.make('p','segment-outcome '+(m.tones?.[index]==='before'?'outcome-before':m.tones?.[index]==='after'?'outcome-after':''),turn.outcome(m,index)))));
   if(pair.some(m=>m.reasoning?.[index]))section.append(U.reasoningDisclosure(pair.map(m=>({title:m.name+t(' · 推理节选'),header:{title:t('Agent 推理节选'),context:[m.name,turn.label].filter(Boolean).join(' · ')},text:m.reasoning?.[index]?.text||t('这一轮记录中没有推理文本。'),highlights:m.reasoning?.[index]?.highlights||[],tone:m.tones?.[index]||''})),{open:openStates.get(index)||false,key:index,ariaLabel:t('查看第 {n} 轮 agent 推理节选',{n:index+1})}));comparison.append(section);
  });
  if(config.afterTurns){const extra=config.afterTurns(pair);if(extra)comparison.append(extra);}
  const footer=U.make('footer','case-footer');if(config.recordLink)pair.forEach(m=>{const a=U.make('a','',m.name+t(' 完整记录'));a.href=config.recordLink(m);footer.append(a)});if(config.download){const a=U.make('a','',config.download.label||t('下载全部方法记录'));a.href=config.download.href;a.download='';footer.append(a);}if(footer.childNodes.length)comparison.append(footer);
 }
 if(params.has('left')||params.has('right')||params.has('controls')||params.has('actions'))save();renderControls();render();return {select:choose,selected:()=>[left,right],refresh:render};
}};
