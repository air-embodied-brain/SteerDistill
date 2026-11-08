/* One source/message reader for every formal case manifest. Raw files are never rewritten. */
(async()=>{
 const t=(text,values)=>window.CaseLocale?.t(text,values)||text.replace(/\{(\w+)\}/g,(match,key)=>values?.[key]??match);
 const U=EvidenceUI,C=CaseCollection,{config:c,entry}=await C.load(),sources=c.records.sources,params=new URLSearchParams(location.search),cache=new Map();
 let current=params.get('source')||c.records.defaultSource||sources[0].id,index=Number(params.get('message')??c.records.defaultMessage??0),raw=params.get('mode')==='raw',serial=0;
 if(!sources.some(s=>s.id===current))current=c.records.defaultSource||sources[0].id;
 const root=document.querySelector('#record'),title=document.querySelector('#record-title');document.title=C.title(c,entry)+t(' · 完整记录');
 const text=v=>typeof v==='string'?v:JSON.stringify(v,null,2),decode=v=>{if(typeof v!=='string')return v;try{return JSON.parse(v)}catch{}if(/^\s*[\[{]/.test(v)){try{return JSON.parse(v.replace(/\\"/g,'"'))}catch{}}return v},messageText=m=>typeof m.content==='string'?m.content:(m.content||[]).map(x=>x.text??text(x)).join('\n');
 const disclosure=(label,body)=>{const d=U.make('details','ev-disclosure');d.append(U.make('summary','',label),body);return d};
 function fields(v){if(v===null||typeof v!=='object')return U.markdown(String(v??''));return U.fields(Object.entries(v),{renderValue:x=>{const value=decode(x);return typeof value==='string'?U.markdown(value):U.make('pre','ev-code',text(value))}})}
 function guidance(v){if(v&&typeof v==='object'&&typeof v.text==='string'&&!v.decision_rule)v=v.text;if(typeof v==='string')v=decode(v.trim().replace(/^```json\s*/,'').replace(/```$/,'').trim());return typeof v==='string'?U.markdown(v):U.guidance(v)}
 function callsOf(m){return (m.tool_calls||[]).map(call=>{const f=call.function||call,args=decode(f.arguments);return f.name==='call_tool'&&args?.tool_name?{name:args.tool_name,args:decode(args.arguments)}:{name:f.name,args}})}
 function label(m,i,callMap){const role={system:t('系统'),user:t('用户'),assistant:'Agent',tool:t('工具返回')}[m?.role]||t('记录');const name=callsOf(m||{})[0]?.name||(m?.role==='tool'?(callMap.get(m.tool_call_id)||m.tool_name):'');return (i+1)+' · '+role+(name?' · '+name.replace(/^mcp_(?:server|tool)_/,''):'')}
 async function load(s){if(cache.has(s.id))return cache.get(s.id);if(s.format==='sqlite'){const loaded={items:[null],labels:[t('数据库下载')],raw:null};cache.set(s.id,loaded);return loaded}
  const response=await fetch(s.url);if(!response.ok)throw Error(t('来源读取失败：{label} ({status})',{label:s.label,status:response.status}));const raw=await response.text(),value=s.format==='text'?raw:decode(raw);let messages=s.messagePath?s.messagePath.split('.').reduce((x,k)=>x?.[k],value):value?.messages||value?.trajectory||value?.choices?.map(x=>x.message)||(Array.isArray(value)&&value.every(x=>x?.role)?value:null);if(messages&&!Array.isArray(messages))throw Error(t('messagePath 未指向数组：')+s.id);
  const items=messages||(Array.isArray(value)?value:[value]),callMap=new Map();const labels=messages?items.map((m,i)=>{const calls=callsOf(m);(m.tool_calls||[]).forEach((call,j)=>callMap.set(call.id,calls[j]?.name));return label(m,i,callMap)}):items.map((_,i)=>items.length>1?(i+1)+t(' · 记录'):t('完整来源'));const loaded={raw,value,items,messages:!!messages,labels};cache.set(s.id,loaded);return loaded;
 }
 function message(m){const out=U.make('div'),body=messageText(m),steeringMarker=['Steering guidance for the current decision:','Local steering for this response only:'].find(marker=>body.includes(marker));
  if(m.role==='system'&&steeringMarker){const at=body.indexOf(steeringMarker),base=body.slice(0,at),g=body.slice(at+steeringMarker.length);out.append(U.frame(t('当前指导'),guidance(g)),disclosure(t('系统执行约束'),U.prose(base.trim())))}
  else if(m.role==='tool'){
   const envelope=decode(body);
   if(envelope&&typeof envelope==='object'&&Array.isArray(envelope.data)){envelope.data.forEach(part=>out.append(U.frame(t('工具返回'),fields(decode(part.text??part)))));const meta=Object.fromEntries(Object.entries(envelope).filter(([k])=>k!=='data'));if(Object.keys(meta).length)out.append(disclosure(t('调用状态'),U.frame(t('调用状态'),fields(meta))))}
   else out.append(U.frame(t('工具返回'),fields(envelope)));
  }else if(m.role==='assistant'){
   const reasoning=m.reasoning||m.reasoning_content||body.match(/<think>([\s\S]*?)(?:<\/think>|<tool_call>|$)/)?.[1];const visible=body.replace(/<think>[\s\S]*?(?:<\/think>|(?=<tool_call>)|$)/g,'').replace(/<tool_call>[\s\S]*?<\/tool_call>/g,'').replace(/<\/?(?:final_answer|think)>/g,'').trim();
   const calls=callsOf(m);if(calls.length)out.append(U.frame(t('Agent 调用'),U.actionSequence(calls.map(f=>({type:'action',name:f.name,args:typeof f.args==='string'?f.args:JSON.stringify(f.args,null,2)})))));else for(const match of body.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/g))out.append(U.frame(t('Agent 调用'),match[1].trim(),{code:true}));
   if(visible){const value=decode(visible.replace(/^```json\s*/,'').replace(/```$/,'').trim());out.append(U.frame(value?.decision_rule?t('指导内容'):t('Agent 回复'),value?.decision_rule?U.guidance(value):U.markdown(visible)))}
   if(reasoning?.trim())out.append(U.reasoningDisclosure([{title:t('Agent 推理'),text:reasoning.trim()}],{label:t('查看完整 agent 推理')}));
  }else out.append(U.frame(m.role==='user'?t('用户任务'):t('系统消息'),U.markdown(body)));
  out.append(disclosure(t('消息完整字段'),U.make('pre','ev-code',text(m))));return out;
 }
 const picker=U.make('details','ev-disclosure source-picker'),select=U.make('select'),path=U.make('p','source-path');select.setAttribute('aria-label',t('选择原始来源'));sources.forEach(s=>{const o=U.make('option','',s.label);o.value=s.id;select.append(o)});select.onchange=()=>choose(select.value,0);picker.append(U.make('summary','',t('全部来源与运行配置')),select,path);document.querySelector('.record-toolbar').after(picker);
 const sidebar=CaseSidebar.mount(document.querySelector('.case-catalog'),{title:t('完整记录'),groups:[]});
 function tree(){const shown=sources.filter(s=>s.primary||s.id===current);sidebar.update({title:t('完整记录'),current:current+'#'+index,groups:shown.map(s=>({id:s.id,label:s.label,open:s.id===current,onOpen:async()=>{await load(s);tree()},items:cache.has(s.id)?cache.get(s.id).labels.map((label,i)=>({id:s.id+'#'+i,label,onSelect:()=>choose(s.id,i)})):[{id:s.id+'#0',label:t('打开来源'),onSelect:()=>choose(s.id,0)}]}))})}
 async function choose(id,i){const token=++serial,currentSource=sources.find(s=>s.id===id),loaded=await load(currentSource);if(token!==serial)return;current=id;index=Math.max(0,Math.min(Number.isFinite(i)?i:0,loaded.items.length-1));select.value=current;path.textContent=currentSource.url;title.textContent=currentSource.label;document.querySelector('#download').href=currentSource.url;document.querySelector('#download').download=currentSource.url.split('/').pop();document.querySelector('#readable').setAttribute('aria-pressed',String(!raw));document.querySelector('#raw').setAttribute('aria-pressed',String(raw));
  root.replaceChildren(currentSource.format==='sqlite'?U.prose(t('此来源为 SQLite 数据库，请下载查看。')):raw?U.make('pre','raw-view',loaded.raw):loaded.messages?message(loaded.items[index]):U.frame(currentSource.label,currentSource.format==='guidance'?guidance(loaded.items[index]):fields(loaded.items[index])));
  document.querySelector('#previous').disabled=index===0;document.querySelector('#next').disabled=index===loaded.items.length-1;history.replaceState(null,'',C.record(c,current,index)+(raw?'&mode=raw':''));tree();
 }
 const footer=document.querySelector('#record-footer'),back=U.make('a','',t('返回案例'));back.href=C.page(c.kind,c.id);back.title=C.title(c,entry);footer.append(back);if(c.records.download){const a=U.make('a','',c.records.download.label||t('下载原始记录'));a.href=c.records.download.href;a.download='';footer.append(a)}
 document.querySelector('#previous').onclick=()=>choose(current,index-1);document.querySelector('#next').onclick=()=>choose(current,index+1);document.querySelector('#raw').onclick=()=>{raw=true;choose(current,index)};document.querySelector('#readable').onclick=()=>{raw=false;choose(current,index)};
 await choose(current,index);
})().catch(e=>{document.querySelector('#record').textContent=e.message;console.error(e)});
