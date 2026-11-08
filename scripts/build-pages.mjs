// Buildless hosting, generated shared shell. Run after changing templates or post metadata.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const data=JSON.parse(await read('content/article/post.zh.json'));
const dataEn=JSON.parse(await read('content/article/post.en.json'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const loadingCSS=await read('site/loading.css');
const themeInit=await read('site/theme-init.js');
const fontBootstrap=await read('site/font-bootstrap.js');
const citation=(await read('site/templates/citation.html')).replace('{{bibtex}}',escape((await read('CITATION.bib')).trim()));
const assetHash=async p=>createHash('sha256').update(await readFile(new URL(p,root))).digest('hex').slice(0,12);
const sharedCSS=['site/fonts.css','site/site.css'];
const articleCSS=['site/cases/evidence-system.css','site/cases/article-embed.css','site/article-content.css','site/article.css','site/article-motion.css','site/article-charts.css'];
const sharedJS=['site/cases/site-paths.js','site/site.js','site/visibility.js'];
const articleJS=['site/chart-data.js','site/article-charts.js','site/cases/evidence-ui.js','site/cases/article-embed.js','site/article-motion.js','site/article.js','site/reading.js'];
// Editorial text in both languages; html[lang] shows one. Evidence embeds keep their source language.
const both=(zh,en,attrs=['',''])=>`<span data-lang="zh" lang="zh-CN"${attrs[0]}>${zh}</span><span data-lang="en" lang="en"${attrs[1]}>${en}</span>`;
const lines=d=>(d.post.titleLines||[d.post.title]).map(escape).join('<br>');
function post(){
 const toc=data.sections.map((s,i)=>`<a href="#${s.id}">${both(escape(s.navTitle),escape(dataEn.sections[i].navTitle))}</a>`).join('');
 return `<section class="post-surface" data-article-surface>
<div class="post-layout"><aside class="post-toc"><details open><summary>${both('目录','Contents')}</summary><nav aria-label="目录" data-i18n-aria="目录">${toc}</nav></details></aside>
<article class="post-article" id="article-start"><header class="post-heading"><h1><a class="section-link" href="#article-start">${both(lines(data),lines(dataEn),[data,dataEn].map(d=>` data-title="${escape(d.post.title)}"`))}</a></h1><p class="post-byline"><a rel="author" href="${escape(data.post.author.href)}">${escape(data.post.author.name)}</a><time datetime="${data.post.date}">${data.post.date.replaceAll('-',' / ')}</time></p><div class="post-tldr"><p class="post-tldr-label">TL;DR</p><p class="post-intro">${both(escape(data.post.intro),escape(dataEn.post.intro))}</p></div></header>
<div id="main-article" class="zh-article"><p class="article-loading">${both('正在载入文章…','Loading the article…')}</p><noscript>${both('请开启 JavaScript 阅读正文与交互案例。','Enable JavaScript to read the article and its interactive cases.')}</noscript></div>
${citation}</article></div></section>`}
const continuousCSS=['site/home.css',...articleCSS,'site/demo-replay.css'];
const continuousJS=['site/home-locale.js',...articleJS,'site/benchmark.js','site/concept.js','site/demo-timing.js','site/demo-replay.js','site/demo-gallery.js','site/citation.js','site/home.js'];
const continuousBody=(await read('site/templates/home.html')).replace('{{post}}',post());
const pages=[
{path:'index.html',page:'home',lang:'en',title:'SteerDistill: Quantizing LLM Agents via Closed-Loop Teacher Steering',css:continuousCSS,js:continuousJS,body:continuousBody},
{path:'article/index.html',page:'article',lang:'zh-CN',title:data.post.title+' · SteerDistill',css:continuousCSS,js:continuousJS,body:continuousBody},
...['paper-cases','case-records'].map(name=>({path:(name==='paper-cases'?'cases':'records')+'/index.html',page:'cases',lang:'zh-CN',title:'案例分析 · SteerDistill',name,css:['collection','case-shell','case-sidebar','case-templates','inference-case','evidence-system'].map(x=>'site/cases/'+x+'.css'),js:['case-sidebar','evidence-ui','task-source','case-templates','inference-case','collection',...(name==='case-records'?['collection-records']:[])].map(x=>'site/cases/'+x+'.js')}))
];
for(const page of pages){
 const prefix=page.path.includes('/')?'../':'';
 let header=(await read('site/templates/header.html')).replaceAll('{{page}}',page.page).replace('{{menu}}',page.name?`<button class="site-menu menu" data-i18n="${page.name==='case-records'?'记录目录':'案例目录'}" aria-controls="catalog" aria-expanded="false">${page.name==='case-records'?'记录目录':'案例目录'}</button>`:'').replaceAll('{{root}}',prefix);
 let body=page.body||await read(`site/templates/${page.name}.html`);
 // Full reading surface on both routes; static links must also resolve without JS.
 if(page.body&&prefix)body=body.replace(/(href|src)="(?![a-z]+:|\/|#)([^"]+)"/gi,(_,attr,url)=>`${attr}="${prefix+url}"`);
 if(page.name)body=body.replace('<main ','<main tabindex="-1" ');
 let skipTarget=page.name?(page.name==='paper-cases'?'case':'record-title'):'content';header=header.replace('href="#content"',`href="#${skipTarget}"`);
 const css=(await Promise.all([...page.css,...sharedCSS].map(async p=>`<link rel="stylesheet" href="${prefix+p}?v=${await assetHash(p)}">`))).join('\n');
 const js=(await Promise.all(['site/locale.js','site/cases/case-locale.js',...sharedJS,...page.js].map(async p=>`<script defer src="${prefix+p}?v=${await assetHash(p)}"></script>`))).join('\n');
 const html=`<!doctype html>\n<!-- Generated by scripts/build-pages.mjs; edit site/templates and content JSON. -->\n<html lang="${page.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escape(page.title)}</title><style>${loadingCSS}</style><script>${themeInit}\ndocument.documentElement.dataset.fonts="loading";${page.page==='article'?'document.documentElement.dataset.readingEntry="pending";setTimeout(()=>delete document.documentElement.dataset.readingEntry,4000);':''}</script><link rel="preload" href="${prefix}fonts/latin/libre.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="${prefix}fonts/latin/serif.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="${prefix}fonts/latin/sans.woff2" as="font" type="font/woff2" crossorigin>${css}\n${js}</head><body class="site-page ${page.name?'case-site evidence-reader':'reading-site'}" data-page="${page.page}" data-layout="flow">${header}\n${body}\n<script>${fontBootstrap}</script>\n</body></html>\n`.replace(/^ +$/gm,'');
 if(process.argv.includes('--check')){
  if(await read(page.path)!==html)throw Error(page.path+' is stale; run node scripts/build-pages.mjs');
 }else {await mkdir(new URL('./',new URL(page.path,root)),{recursive:true});await writeFile(new URL(page.path,root),html);}
}
console.log(process.argv.includes('--check')?'All four generated pages are current.':'Built homepage, article, case reader and record reader from one shell.');

// Compatibility entry points keep query selections and fragments intact.
for(const [old,target] of Object.entries({'article.html':'article/','design-lab/p2.html':'../','design-lab/paper-cases.html':'../cases/','design-lab/case-records.html':'../records/'})){
 const html=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>SteerDistill</title><a href="${target}">Continue to SteerDistill</a><script>location.replace(${JSON.stringify(target)}+location.search+location.hash)</script>\n`;
 if(process.argv.includes('--check')){if(await read(old)!==html)throw Error(old+' redirect is stale');}
 else {await mkdir(new URL('./',new URL(old,root)),{recursive:true});await writeFile(new URL(old,root),html);}
}
