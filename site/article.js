/* Render the same post for direct reading and the homepage continuation. */
window.ResearchArticle = (() => {
 'use strict';
 const U=EvidenceUI,make=(tag,cls,value)=>U.make(tag,cls,value);
 const url=path=>SitePaths.url(path);
 function heading(title,id){const node=make('h2'),link=make('a','section-link',title);link.href='#'+id;node.append(link);return node}
 function prose(section){const node=make('div','main-prose');section.append(node);return node}
 function methodDiagram(block){return ArticleMotion.mount('repair',block.title)}
 function targetDiagram(block){return ArticleMotion.mount('distill',block.title)}

 let content;
 const en=SiteLocale.lang==='en',L=en?{note:'Note ',notes:'Notes',back:'Back to text',backTo:n=>'Back to note '+n+' in the text',error:'The article could not be loaded.',retry:'Reload'}:{note:'注 ',notes:'注释',back:'返回正文',backTo:n=>'返回注 '+n+' 的正文',error:'文章暂时无法读取。',retry:'重新载入'};
 async function load(){
  // Editorial text follows the reader's language; recorded calls, returns and reasoning are unchanged.
  if(!content)content=Promise.all([`content/article/post.${en?'en':'zh'}.json`,`content/article/cases.${en?'en':'zh'}.json`].map(async path=>{
   const response=await fetch(url(path));if(!response.ok)throw Error('Article data unavailable');return response.json();
  })).catch(error=>{content=null;throw error});
  return content;
 }
 async function mount(root){
  if(root.dataset.ready==='true')return;
  try{
   const [data,cases]=await load(),registry=new Map(cases.sections.map(section=>[section.id,section.case]));
   const fragment=document.createDocumentFragment(),notes=[];
   for(const chapter of data.sections){
    const section=make('section','main-chapter');section.id=chapter.id;let copy=prose(section);copy.append(heading(chapter.title,chapter.id));
    for(const block of chapter.blocks){
     if(block.type==='paragraph'){
      if(!copy)copy=prose(section);const p=make('p');if(block.id)p.id=block.id;p.innerHTML=block.html;
      for(const link of p.querySelectorAll('a[href]'))link.href=url(link.getAttribute('href'));
      if(block.note){
       const number=notes.length+1,note=block.note,group=make('div','noted-paragraph');
       const ref=make('a','note-ref',String(number));ref.href='#note-'+note.id;ref.id='ref-'+note.id;ref.setAttribute('aria-label',L.note+number);ref.setAttribute('role','doc-noteref');const sup=make('sup');sup.append(ref);p.append(sup);
       const side=make('aside','sidenote');side.setAttribute('aria-label',L.note+number);side.append(make('span','',String(number)),document.createTextNode(' '+(note.aside||note.text)));group.append(p,side);copy.append(group);notes.push({...note,number});
      }else copy.append(p);
     }else if(block.type==='case'){
      const evidence=registry.get(block.caseKey);if(!evidence)throw Error('Missing case: '+block.caseKey);
      ArticleCaseEmbed.mount(section,{case:{...evidence,href:url(evidence.href)},variant:'flow'});copy=null;
     }else if(block.type==='method-diagram'){section.append(methodDiagram(block));copy=null}
     else if(block.type==='target-diagram'){section.append(targetDiagram(block));copy=null}
     else if(block.type==='experiment-chart'){section.append(ArticleCharts.mount(block.chart));copy=null}
    }
    fragment.append(section);
   }
   const endnotes=make('section','post-endnotes');endnotes.id='notes';endnotes.setAttribute('role','doc-endnotes');endnotes.append(heading(L.notes,'notes'));const list=make('ol');
   for(const note of notes){const li=make('li');li.id='note-'+note.id;li.append(document.createTextNode(note.text+' '));const back=make('a','note-back',L.back);back.href='#ref-'+note.id;back.setAttribute('aria-label',L.backTo(note.number));li.append(back);list.append(li)}endnotes.append(list);fragment.append(endnotes);
   const resources=make('section','main-resources');resources.id=data.resources.id;resources.append(heading(data.resources.title,data.resources.id));const links=make('nav','resource-links');links.setAttribute('aria-label',data.resources.title);
   for(const item of data.resources.links){const a=make('a');a.href=url(item.href);a.append(make('strong','',item.label),make('span','',item.description));links.append(a)}resources.append(links);fragment.append(resources);
   root.replaceChildren(fragment);root.dataset.ready='true';document.dispatchEvent(new CustomEvent('article:ready',{detail:data}));
  }catch(error){root.replaceChildren(make('p','',L.error));const retry=make('button','article-retry',L.retry);retry.onclick=()=>mount(root);root.append(retry);console.error(error)}
 }
 return {mount,load};
})();
