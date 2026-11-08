/* Composition templates take presentation data; they do not resolve dataset IDs or source archives. */
window.CaseTemplates=(()=>{
 const t=(text,values)=>window.CaseLocale?.t(text,values)||text.replace(/\{(\w+)\}/g,(match,key)=>values?.[key]??match);
 const U=EvidenceUI;
 function training(config){
  const article=U.make('article','training-story'),head=U.make('header','training-story-head');head.id='case-start';
  const task=U.prose(config.summary);task.classList.add('training-task','case-summary');head.append(U.make('h1','case-title',config.title),task);
  if(config.originalTask)head.append(CaseTaskSource.create(config.originalTask,{turns:config.taskTurns}));article.append(head);
  const comparison=U.make('section','training-branches');comparison.setAttribute('aria-label',t('动作对照'));
  config.branches.forEach(b=>{const col=U.make('section','training-branch');col.append(U.make('h2','case-branch-title',b.title),U.prose(b.summary),U.frame({title:t('调用与回复'),context:b.title+(b.excerpt?' · '+t('节选'):'')},U.actionSequence(b.events),{tone:b.tone}));comparison.append(col)});
  article.append(comparison);
  const reasoning=config.branches.filter(b=>b.reasoning).map(b=>({title:b.reasoning.title,header:{title:t('Agent 推理节选'),context:b.title},text:b.reasoning.text,highlights:b.reasoning.highlights,tone:b.tone}));
  if(reasoning.length)article.append(U.reasoningDisclosure(reasoning,{label:t('查看 agent 推理')}));
  if(config.guidance){const g=config.guidance,s=U.make('section','teacher-reading');s.id='teacher-guidance';s.append(U.make('h2','case-section-title',g.title),U.frame({title:t('指导原文'),context:'Teacher'},U.guidance(g.fields),{tone:g.tone||'after'}));
   if(g.checks){const result=U.frame(g.resultLabel||t('执行结果'),U.fields(g.checks),{tone:g.tone||'after'});result.id='case-verification';s.append(U.arrow(),result);}
   if(g.takeaway)s.append(U.make('p','training-takeaway',g.takeaway));article.append(s);
  }
  if(config.links?.length){const footer=U.make('footer','training-records case-footer');footer.id='case-records';config.links.forEach(link=>{const a=U.make('a','',link.label);a.href=link.href;if(link.download)a.download='';footer.append(a)});article.append(footer);}
  return article;
 }
 function sequence(config){
  const article=U.make('article','training-story sequence-story'+(config.compact?' sequence-compact':'')),head=U.make('header','training-story-head');
  const summary=U.prose(config.summary);summary.classList.add('case-summary');head.append(U.make('h1','case-title',config.title),summary);
  if(config.originalTask)head.append(CaseTaskSource.create(config.originalTask,{turns:config.taskTurns}));article.append(head);
  const addReasoning=(parent,reasoning,tone,context=config.sequenceTitle)=>{if(!reasoning)return;const branches=(Array.isArray(reasoning)?reasoning:[reasoning]).map(r=>({...r,header:{title:t('Agent 推理节选'),context:r.context||context},tone:r.tone??tone}));parent.append(U.reasoningDisclosure(branches));};
  const reference=()=>{const r=config.reference;if(!r)return null;
   const section=U.make('section','sequence-reference'+(r.compact?' sequence-reference-compact':''));section.setAttribute('aria-label',r.title);
   if(!r.compact)section.append(U.make('h2','case-section-title',r.title));if(r.summary)section.append(U.prose(r.summary));
   const evidence=U.make('div','sequence-reference-evidence');if(r.events?.length)evidence.append(U.frame({title:t('调用与回复'),context:r.frameTitle||r.title},U.actionSequence(r.events),{tone:r.tone}));addReasoning(evidence,r.reasoning,r.tone,r.method||r.title);
   if(evidence.childNodes.length){if(r.collapsed){const disclosure=U.make('details','ev-disclosure');disclosure.append(U.make('summary','',r.disclosureLabel||t('查看参照过程')),evidence);section.append(disclosure);}else section.append(evidence);}return section;
  };
  if(config.reference?.position==='before')article.append(reference());
  const steps=U.make('section','sequence-steps');steps.setAttribute('aria-label',config.sequenceTitle||t('操作过程'));
  if(config.sequenceTitle)steps.append(U.make('h2','case-section-title',config.sequenceTitle));
  config.steps.forEach(step=>{const section=U.make('section','sequence-step');if(step.summary)section.append(U.prose(step.summary));section.append(U.frame({title:t('调用与回复'),context:step.title},U.actionSequence(step.events),{tone:step.tone}));addReasoning(section,step.reasoning,step.tone);steps.append(section);});
  article.append(steps);
  if(config.reference&&config.reference.position!=='before')article.append(reference());
  if(config.result){const r=config.result,section=U.make('section','sequence-result');if(r.summary)section.append(U.prose(r.summary));if(r.fields)section.append(U.frame(r.title||t('执行结果'),U.fields(r.fields),{tone:r.tone}));article.append(section);}
  if(config.links?.length){const footer=U.make('footer','training-records case-footer');config.links.forEach(link=>{const a=U.make('a','',link.label);a.href=link.href;if(link.download)a.download='';footer.append(a);});article.append(footer);}
  return article;
 }
 return {training,sequence};
})();
