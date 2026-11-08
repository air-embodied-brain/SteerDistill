/* Formal collection: registry lookup and JSON composition only. No editorial generation. */
window.CaseCollection=(()=>{
 const t=(text,values)=>window.CaseLocale?.t(text,values)||text.replace(/\{(\w+)\}/g,(match,key)=>values?.[key]??match);
 const U=EvidenceUI,base=SitePaths.url('');
 const previewUrl=href=>CaseSidebar.previewUrl?CaseSidebar.previewUrl(href):href;
 const page=(kind,id)=>previewUrl(base+'cases/?'+new URLSearchParams({group:kind,case:id}));
 const title=(c,entry)=>entry?.code?entry.code+' · '+c.title:c.title;
 const record=(c,source,message)=>previewUrl(base+'records/?'+new URLSearchParams({group:c.kind,case:c.id,source:source||c.records.defaultSource,message:String(message??c.records.defaultMessage??0)}));
 // Revalidate once per document, then reuse the same request/data while browsing cases.
 // A reload still reads edited JSON; failed requests are never retained.
 const jsonCache=new Map();
 function json(url){url=SitePaths.url(url);if(!jsonCache.has(url))jsonCache.set(url,fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error(`${url}: HTTP ${r.status}`);return r.json()}).catch(e=>{jsonCache.delete(url);throw e}));return jsonCache.get(url)}
 function validate(c){if(c.schemaVersion!==1||!['training','comparison','sequence'].includes(c.template)||!c.originalTask||!Array.isArray(c.records?.sources)||!c.records.sources.length)throw Error(t('案例配置不符合 schemaVersion 1'));return c}
 async function load(href){
  const url=new URL(href||location.href,location.href),locale=window.CaseLocale;
  const originalCatalog=await json(base+'content/cases/catalog.json');
  const catalog=locale?locale.apply(originalCatalog,locale.lang==='en'?await json(base+'content/cases/en/catalog.json'):null):originalCatalog;
  const p=url.searchParams,group=catalog.groups.find(g=>g.id===p.get('group')||g.aliases?.includes(p.get('group')))||catalog.groups[0];
  if(group.aliases?.includes(p.get('group')))p.set('group',group.id);
  let requested=p.get('case');
  if(group.retiredCases?.includes(requested)){requested=null;p.set('group',group.id);p.set('case',group.cases[0].id);['left','right','source','message','mode'].forEach(key=>p.delete(key));if(!href)history.replaceState(history.state,'',url.pathname+'?'+p+url.hash);}
  const entry=group.cases.find(c=>c.id===requested||c.aliases?.includes(requested))||(requested&&/^[a-z0-9_-]+$/.test(requested)?{id:requested,url:base+'content/cases/'+group.id+'/'+requested+'.json'}:group.cases[0]);
  if(!entry)throw Error(t('此分类尚无可读案例'));const original=validate(await json(entry.url));const config=locale?locale.apply(original,locale.lang==='en'?await json(base+'content/cases/en/'+original.kind+'/'+original.id+'.json'):null):original;config.records.sources.forEach(source=>{if(source.url)source.url=SitePaths.url(source.url)});if(config.records.download?.href)config.records.download.href=SitePaths.url(config.records.download.href);if(!group.cases.some(e=>e.id===config.id)){entry.title=config.title;group.cases.push(entry)}return {catalog,config,entry,url};
 }
 function sidebar(catalog,c){return CaseSidebar.mount(document.querySelector('.case-catalog'),{title:t('案例目录'),current:c.kind+'/'+c.id,groups:catalog.groups.map(CaseSidebar.caseGroup)})}
 function details(pair,settings,open){const section=U.make('section','step');if(settings.guidanceTitle)section.append(U.make('h2','case-section-title',settings.guidanceTitle));
  if(pair.some(m=>m.guidanceExcerpt))section.append(U.frame({title:t('指导原文'),context:t('节选')},U.fields(pair.map(m=>[m.name,m]),{renderValue:m=>{const p=U.make('div','ev-prose');p.append(U.highlightedText(m.guidanceExcerpt||(m.guidance?'':t('未提供指导')),m.guidanceHighlights||[],{inlineCode:true}));return p}})));
  pair.forEach(m=>{
   if(!m.guidance)return;
   const d=U.make('details','ev-disclosure'),body=U.make('div','guidance-detail-stack');
   d.open=open.get(m.id)||false;d.addEventListener('toggle',()=>open.set(m.id,d.open));
   if(m.guidanceAnalysis){
    const analysis=U.make('div','ev-prose');
    analysis.append(U.highlightedText(m.guidanceAnalysis.text,m.guidanceAnalysis.highlights||[],{inlineCode:true}));
    body.append(U.frame({title:t('指导生成推理节选'),context:m.name},analysis));
   }
   body.append(U.frame({title:t('指导原文'),context:m.name},m.guidance.guidance?U.prose(m.guidance.guidance):U.guidance(m.guidance)));
   d.append(U.make('summary','',m.name+t(' · 完整指导')),body);section.append(d);
  });
  if(pair.some(m=>m.resultLines)){section.append(U.arrow(),U.frame(settings.resultTitle||t('执行结果'),U.fields(pair.map(m=>[m.name,m.resultLines||[]]),{renderValue:lines=>{const p=U.make('div','ev-prose');lines.forEach((line,i)=>{if(i)p.append('\n');p.append(U.highlightedText(line.text,line.highlights||[]))});return p}})))}return section;
 }
 function mount(root,c,entry){const p=c.presentation,heading=title(c,entry),links=[{label:t('完整记录'),href:record(c)}];if(c.records.download)links.push({...c.records.download,download:true});
  if(c.template==='comparison'){const open=new Map();return InferenceCase.mount(root,{...p,title:heading,summary:c.summary,task:c.originalTask,taskTurns:c.taskTurns,turns:p.turns.map((t,i)=>({...t,...(t.showOutcome?{outcome:m=>m.outcomes?.[i]||''}:{})})),recordLink:m=>record(c,m.record?.sourceId,m.record?.message),download:c.records.download,afterTurns:p.details?pair=>details(pair,p.details,open):undefined})}
  root.replaceChildren(CaseTemplates[c.template==='sequence'?'sequence':'training']({...p,title:heading,summary:c.summary,originalTask:c.originalTask,taskTurns:c.taskTurns,links}));
 }
 let navigation=0,started=false,loading=false;
 function caseLink(target){
  const a=target.closest?.('a[href]');if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return null;
  const url=new URL(a.href,location.href);return url.origin===location.origin&&url.pathname===base+'cases/'?new URL(previewUrl(url.href),location.href):null;
 }
 function moveTo(url,scroll){
  let anchor;try{anchor=url.hash&&document.getElementById(decodeURIComponent(url.hash.slice(1)))}catch{}
  if(anchor)anchor.scrollIntoView();else window.scrollTo({left:scroll?.[0]||0,top:scroll?.[1]||0,behavior:'instant'});
 }
 async function navigate(href,{push=false,restore}={}){
  const ticket=++navigation,root=document.querySelector('#case');loading=true;
  try{
   const {catalog,config,entry,url}=await load(href);if(ticket!==navigation)return;
   if(push){history.replaceState({...history.state,caseScroll:[scrollX,scrollY]},'',location.href);history.pushState({caseScroll:[0,0]},'',url)}
   else if(url.href!==location.href)history.replaceState(history.state,'',url);
   // Keep the old case during the fetch; render synchronously in one paint once ready.
   const controller=mount(root,config,entry);
   const aside=document.querySelector('.case-catalog'),scroll=aside.scrollTop;sidebar(catalog,config);aside.scrollTop=scroll;
   document.title=title(config,entry)+' · SteerDistill';window.caseConfig=config;window.caseController=controller;
   loading=false;CaseSidebar.close();moveTo(url,restore);
   if(push){const h=root.querySelector('h1');h?.setAttribute('tabindex','-1');h?.focus({preventScroll:true})}
  }catch(e){
   if(ticket!==navigation)return;loading=false;
   // A normal navigation remains available if a soft-navigation request fails.
   if(push){location.assign(href);return}
   root.replaceChildren(U.prose(t('案例未能载入：')+e.message));console.error(e);
  }
 }
 function start(){
  if(started)return;started=true;
  document.addEventListener('click',e=>{
   if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
   const url=caseLink(e.target);if(!url)return;
   // Let native fragment navigation keep its usual history behavior.
   if(url.pathname===location.pathname&&url.search===location.search&&url.hash)return;
   e.preventDefault();if(url.href===location.href){if(loading)navigate(url.href,{restore:[scrollX,scrollY]});CaseSidebar.close();return}navigate(url.href,{push:true});
  });
  const prefetch=e=>{const url=caseLink(e.target);if(url)load(url.href).catch(()=>{})};
  document.addEventListener('pointerover',prefetch);document.addEventListener('focusin',prefetch);
  window.addEventListener('popstate',e=>navigate(location.href,{restore:e.state?.caseScroll}));
  return navigate(location.href,{restore:[scrollX,scrollY]});
 }
 return {load,json,validate,page,record,title,sidebar,mount,start,navigate};
})();
if(document.querySelector('#case'))CaseCollection.start();
