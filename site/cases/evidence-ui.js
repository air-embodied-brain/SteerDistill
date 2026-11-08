/* Shared text-only evidence components. They render editorial decisions; they do not choose emphasis. */
window.EvidenceUI=(()=>{

 'use strict';
 const t=(text,values)=>window.CaseLocale?.t(text,values)||text.replace(/\{(\w+)\}/g,(match,key)=>values?.[key]??match);
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function validateSpans(text,spans=[]){
  if(typeof text!=='string'||!Array.isArray(spans))throw new TypeError('Evidence text must be a string and spans an array');
  let end=0;
  spans.forEach((s,i)=>{if(s?.tone!==undefined&&!['before','after'].includes(s.tone))throw new RangeError(`Invalid evidence span ${i}: unknown tone`);if(!s||!Number.isInteger(s.start)||!Number.isInteger(s.end)||s.start<end||s.start<0||s.end<=s.start||s.end>text.length||text.slice(s.start,s.end)!==s.text)throw new RangeError(`Invalid evidence span ${i}: offsets must be ordered, non-overlapping and match the exact text`);end=s.end;});
  return spans;
 }
 function marked(text,spans=[],appendRange){
  validateSpans(text,spans);const el=make('span');let at=0;
  const appendText=appendRange||((parent,start,end)=>parent.append(document.createTextNode(text.slice(start,end))));
  const append=(parent,start,end)=>{if(end>start)appendText(parent,start,end)};
  for(const span of spans){append(el,at,span.start);const mark=make('mark',span.tone?'ev-mark-'+span.tone:'');append(mark,span.start,span.end);el.append(mark);at=span.end;}
  append(el,at,text.length);return el;
 }
 function highlightedText(text,spans=[],{inlineCode=false}={}){
  if(!inlineCode)return marked(text,spans);
  // Keep annotation coordinates in the untouched source, including backticks.
  const ranges=[],re=/`([^`\n]+)`/g;let at=0,m;
  while((m=re.exec(text))){if(m.index>at)ranges.push({start:at,end:m.index});ranges.push({start:m.index+1,end:re.lastIndex-1,code:true});at=re.lastIndex;}
  if(at<text.length)ranges.push({start:at,end:text.length});
  return marked(text,spans,(parent,start,end)=>{for(const range of ranges){const a=Math.max(start,range.start),b=Math.min(end,range.end);if(b>a)parent.append(range.code?make('code','',text.slice(a,b)):document.createTextNode(text.slice(a,b)));}});
 }
 function inline(text,{bold=false}={}){
  const node=make('span');const re=bold?/`([^`\n]+)`|\*\*([^*\n]+)\*\*/g:/`([^`\n]+)`/g;let end=0,m;
  while((m=re.exec(text))){node.append(document.createTextNode(text.slice(end,m.index)),make(m[1]!==undefined?'code':'strong','',m[1]??m[2]));end=re.lastIndex;}
  node.append(document.createTextNode(text.slice(end)));return node;
 }
 function prose(text){
  const node=make('div','ev-prose'),re=/```[^\n]*\n([\s\S]*?)```/g;let end=0,m;
  while((m=re.exec(text))){if(m.index>end)node.append(inline(text.slice(end,m.index)));node.append(make('pre','ev-code ev-fenced',m[1].replace(/\n$/,'')));end=re.lastIndex;}
  if(end<text.length)node.append(inline(text.slice(end)));return node;
 }
 function markdown(text){
  const outer=make('div','ev-prose ev-markdown');let paragraph=[],list=null,fenced=null;
  const flush=()=>{if(paragraph.length){const p=make('p');p.append(inline(paragraph.join('\n'),{bold:true}));outer.append(p);paragraph=[];}};
  for(const line of String(text).split('\n')){
   if(/^\s*```/.test(line)){flush();list=null;if(fenced){outer.append(make('pre','ev-code ev-fenced',fenced.join('\n')));fenced=null;}else fenced=[];continue;}
   if(fenced){fenced.push(line);continue;}
   const item=line.match(/^\s*(?:([-*]) |(\d+)[.)] )(.*)$/),heading=line.match(/^\s*#{1,6} (.*)$/);
   if(item){flush();const kind=item[2]?'ol':'ul';if(!list||list.tagName.toLowerCase()!==kind){list=make(kind);if(item[2])list.start=Number(item[2]);outer.append(list);}const li=make('li');li.append(inline(item[3],{bold:true}));list.append(li);}
   else if(heading){flush();list=null;const h=make('h4');h.append(inline(heading[1],{bold:true}));outer.append(h);}
   else if(!line.trim()){flush();list=null;}else{list=null;paragraph.push(line);}
  }
  flush();if(fenced)outer.append(make('pre','ev-code ev-fenced',fenced.join('\n')));return outer;
 }
 function frame(title,body,{tone='',code=false}={}){
  const el=make('section','ev-frame'+(tone?' ev-'+tone:'')),label=make('h3','ev-label');
  const heading=typeof title==='string'?{title}:title;
  label.append(make('span','ev-label-title',heading.title));
  if(heading.context)label.append(' ',make('span','ev-label-context',heading.context));
  el.append(label);
  const inner=make('div','ev-body');inner.append(typeof body==='string'?(code?make('pre','ev-code',body):prose(body)):body);el.append(inner);return el;
 }
 function fields(values,{labels={},renderValue}={}){
  const entries=Array.isArray(values)?values:Object.entries(values),dl=make('dl','ev-fields');
  for(const [key,value] of entries){const row=make('div'),dd=make('dd');row.dataset.field=key;
   dd.append(renderValue?renderValue(value,key):typeof value==='string'?prose(value):make('pre','ev-code',JSON.stringify(value,null,2)));
   row.append(make('dt','',labels[key]||key),dd);dl.append(row);
  }return dl;
 }
 const guidance=values=>fields(values,{labels:{precondition:t('当前条件'),decision_rule:t('修正规则'),expected_transition:t('预期变化'),recovery_check:t('核验方式')}});
 function pair(...items){const el=make('div','pair ev-pair');el.append(...items);return el;}
 function action(event){
  const name=event.name,args=event.args??'';
  if(event.tone!==undefined&&!['before','after','neutral'].includes(event.tone))throw new TypeError('Unknown action tone');
  if(typeof name!=='string'||typeof args!=='string')throw new TypeError('Action name and displayed args must be strings; adapt raw records before rendering');
  if(event.returnTone!==undefined&&!['','before','after','neutral'].includes(event.returnTone))throw new TypeError('Unknown action return tone');
  const text=`${name}(${args})`,h=event.highlights||{},spans=[...(h.call||[])];
  for(const [field,offset,value] of [['name',0,name],['args',name.length+1,args]]){validateSpans(value,h[field]||[]);spans.push(...(h[field]||[]).map(s=>({...s,start:s.start+offset,end:s.end+offset})));}
  spans.sort((a,b)=>a.start-b.start);
  const call=marked(text,spans,(parent,start,end)=>{if(start<name.length){parent.append(make('span','ev-function',text.slice(start,Math.min(end,name.length))));start=Math.min(end,name.length);}if(start<end)parent.append(document.createTextNode(text.slice(start,end)));});
  const el=make('div','ev-action'+(event.tone?' ev-'+event.tone:'')),code=make('pre','ev-code');code.append(call);
  if(event.result!==undefined){if(typeof event.result!=='string')throw new TypeError('Displayed action result must be a string');const ret=make('span','ev-return'+(event.returnTone?' ev-return-'+event.returnTone:''));ret.append('→ ',highlightedText(event.result,h.result||[]));code.append('\n',ret);}
  el.append(code);return el;
 }
 function reply(event){const el=make('div','ev-reply');el.append(make('p','ev-reply-label',event.label||(event.excerpt?t('Agent 回复 · 节选'):t('Agent 回复'))));const p=make('p','ev-prose');p.append(highlightedText(event.text,event.highlights?.text||[],{inlineCode:true}));el.append(p);return el;}
 function actionSequence(events){const el=make('div','ev-action-sequence');events.forEach(e=>{if(e.type==='action')el.append(action(e));else if(e.type==='reply')el.append(reply(e));else throw new TypeError(`Unknown evidence event type: ${e.type}`);});return el;}
 function reasoningDisclosure(branches,{label=t('查看 agent 推理节选'),open=false,key,ariaLabel}={}){
  const el=make('details','ev-disclosure reasoning');el.open=open;if(key!==undefined)el.dataset.reasoningTurn=String(key);const summary=make('summary','',label);if(ariaLabel)summary.setAttribute('aria-label',ariaLabel);el.append(summary);
  const items=branches.map(b=>{const body=make('div','ev-prose');body.append(highlightedText(b.text,b.highlights||[],{inlineCode:true}));return frame(b.header||b.title,body,{tone:b.tone||''});});
  el.append(items.length===1?items[0]:pair(...items));return el;
 }
 function arrow(){const el=make('div','ev-arrow');el.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.setAttribute('viewBox','0 0 24 20');path.setAttribute('d','M9 2h6v8h6l-9 8-9-8h6Z');svg.append(path);el.append(svg);return el;}
 return {make,inline,prose,markdown,frame,fields,guidance,pair,validateSpans,highlightedText,action,reply,actionSequence,reasoningDisclosure,arrow};
})();
