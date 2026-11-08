/* One catalogue structure and drawer lifecycle for cases and raw-record readers. */
window.CaseSidebar=(()=>{
 const t=(text,values)=>window.CaseLocale?.t(text,values)||text.replace(/\{(\w+)\}/g,(match,key)=>values?.[key]??match);
 const instances=new WeakMap();let drawer;
 const variants=new Set(['rail','type','compact']);
 function previewVariant(){const value=new URLSearchParams(location.search).get('sidebar');return variants.has(value)?value:''}
 function previewUrl(href){const url=new URL(href,location.href),variant=previewVariant();if(variant&&!url.searchParams.has('sidebar'))url.searchParams.set('sidebar',variant);if(window.CaseLocale)url.searchParams.set('lang',CaseLocale.lang);return url.pathname+url.search+url.hash;}
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 function bind(root){
  const button=document.querySelector('.site-header .site-menu');
  if(!button)return;drawer={root,button};button.setAttribute('aria-controls',root.id);button.setAttribute('aria-expanded','false');
  button.onclick=()=>setOpen(!document.body.classList.contains('case-menu-open'));
 }
 function setOpen(open,restore=false){if(!drawer)return;document.body.classList.toggle('case-menu-open',open);document.body.classList.remove('menu-open');drawer.button.setAttribute('aria-expanded',String(open));if(!open&&restore)drawer.button.focus();}
 function close(){setOpen(false)}
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('case-menu-open'))setOpen(false,true)});
 document.addEventListener('click',e=>{if(drawer&&!drawer.root.contains(e.target)&&!drawer.button.contains(e.target))close()});
 window.matchMedia('(min-width:1200px)').addEventListener('change',e=>{if(e.matches)close()});
 function mount(root,config){
  let api=instances.get(root);if(api){api.update(config);return api;}
  root.className='case-catalog case-sidebar';bind(root);let current,groups,openState=new Map();
  function setCurrent(key){current=key;root.querySelectorAll('.sidebar-item').forEach(n=>{const active=n.dataset.key===String(key);if(active){n.setAttribute('aria-current',n.tagName==='A'?'page':'true');const d=n.closest('details');d.open=true;openState.set(d.dataset.key,true)}else n.removeAttribute('aria-current')});}
  function itemList(items){
   const list=node('ul','sidebar-items');items.forEach(item=>{const li=node('li'),link=node(item.href?'a':'button','sidebar-item',item.label);link.dataset.key=String(item.id);if(item.singleLine)link.classList.add('sidebar-case-item');if(item.code&&item.indexTitle){link.textContent='';link.append(node('span','sidebar-code',item.code),node('span','sidebar-code-separator',' · '),node('span','sidebar-case-name',item.indexTitle));link.setAttribute('aria-label',item.label);}if(item.title)link.title=item.title;if(item.href){link.href=item.href;if(item.download)link.download=''}else link.type='button';link.addEventListener('click',()=>{if(item.onSelect)item.onSelect();close()});li.append(link);list.append(li)});return list;
  }
  function update(next){
   root.querySelectorAll('.sidebar-group').forEach(d=>openState.set(d.dataset.key,d.open));
   groups=next.groups;const isCases=groups.some(g=>(g.items||[]).some(i=>i.singleLine)||(g.sections||[]).some(s=>(s.items||[]).some(i=>i.singleLine)));const variant=isCases&&(previewVariant()||'rail');if(variant)root.dataset.sidebarStyle=variant;else delete root.dataset.sidebarStyle;root.replaceChildren(node('h2','sidebar-title',next.title));const nav=node('nav','sidebar-tree');nav.setAttribute('aria-label',next.title);
   groups.forEach(group=>{
    const d=node('details','sidebar-group'),summary=node('summary','sidebar-group-label',group.label);d.dataset.key=String(group.id);d.open=openState.has(String(group.id))?openState.get(String(group.id)):!!group.open;
    d.append(summary);if(group.items?.length)d.append(itemList(group.items));
    if(group.sections?.length){const sections=node('div','sidebar-sections');group.sections.forEach(section=>{const block=node('section','sidebar-section');block.dataset.section=section.id;block.append(node('h3','sidebar-section-label',section.label),itemList(section.items||[]));sections.append(block)});d.append(sections)}
    summary.addEventListener('click',()=>{if(!d.open&&group.onOpen)group.onOpen()});d.addEventListener('toggle',()=>{openState.set(String(group.id),d.open)});nav.append(d);
   });root.append(nav);if(next.current!==undefined)current=next.current;if(current!==undefined)setCurrent(current);
  }
  api={update,setCurrent,close};instances.set(root,api);update(config);return api;
 }
 function caseItem(kind,entry){return {id:kind+'/'+entry.id,label:entry.code?entry.code+' · '+(entry.indexTitle||entry.title):(entry.indexTitle||entry.title),singleLine:!!(entry.code&&entry.indexTitle),code:entry.code,indexTitle:entry.indexTitle,title:entry.title,href:previewUrl(SitePaths.url('cases/?'+new URLSearchParams({group:kind,case:entry.id})))}}
 function caseGroup(group){
  const result={id:group.id,label:group.label,open:true,items:[]};
  if(group.sections?.length){result.sections=group.sections.map(section=>({id:section.id,label:section.label,items:group.cases.filter(c=>c.section===section.id).map(c=>caseItem(group.id,c))}));result.items=group.cases.filter(c=>!c.section).map(c=>caseItem(group.id,c))}
  else result.items=group.cases.map(c=>caseItem(group.id,c));
  return result;
 }
 async function cases(root,active,caseId){
  const response=await fetch(SitePaths.url('content/cases/catalog.json'),{cache:'no-cache'});if(!response.ok)throw Error(t('案例目录无法读取'));let catalog=await response.json();if(window.CaseLocale?.lang==='en'){const translated=await fetch(SitePaths.url('content/cases/en/catalog.json'));if(!translated.ok)throw Error('Could not load the English case directory');catalog=CaseLocale.apply(catalog,await translated.json());}
  return mount(root,{title:t('案例目录'),current:active+'/'+caseId,groups:catalog.groups.map(caseGroup)});
 }

 const root=document.querySelector('.case-catalog');if(root){root.className='case-catalog case-sidebar';bind(root);if(root.dataset.caseKind)cases(root,root.dataset.caseKind)}
 return {mount,cases,caseItem,caseGroup,close,previewVariant,previewUrl};
})();
