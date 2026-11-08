/* Render the original user turns; keep source wording separate from editorial summaries. */
window.CaseTaskSource={create(task,{turns:selected}={}){
 const t=(text,values)=>window.CaseLocale?.t(text,values)||text.replace(/\{(\w+)\}/g,(match,key)=>values?.[key]??match);
 const details=document.createElement('details');details.className='ev-disclosure original-task';
 const summary=document.createElement('summary');summary.textContent=t('原始任务描述');details.append(summary);
 const body=document.createElement('div');body.className='original-turns';
 const turns=task.question||[],indices=selected??turns.map((_,index)=>index);
 if(!Array.isArray(indices)||!indices.length||indices.some((n,i)=>!Number.isInteger(n)||n<0||n>=turns.length||(i>0&&n<=indices[i-1])))throw Error('Task turn selection must be ordered, unique and in range');
 indices.forEach(index=>{
  const messages=turns[index];
  const users=(Array.isArray(messages)?messages:[messages]).filter(m=>m.role==='user');
  if(!users.length)return;
  const turn=document.createElement('section');turn.className='original-turn';
  if(indices.length>1){const label=document.createElement('h3');label.textContent=t('用户 · 第 {n} 轮',{n:index+1});turn.append(label)}
  users.forEach(m=>{const p=document.createElement('p');p.textContent=typeof m.content==='string'?m.content:JSON.stringify(m.content,null,2);turn.append(p)});
  body.append(turn);
 });details.append(body);return details;
}};
