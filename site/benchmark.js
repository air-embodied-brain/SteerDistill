(()=>{
'use strict';
const root=document.querySelector('[data-press-chart]');if(!root)return;
SiteVisibility.chart(root);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const methods=ResearchChartData.benchmarkMethods;
const benchmarks=[['bfcl_v4','BFCL V4'],['tau2_bench','τ²-Bench'],['webshop','WebShop'],['alfworld','ALFWorld'],['search_qa','Search QA']];
const label=m=>m==='Ours'?'SteerDistill':m;
const fills=ResearchChartData.colors;
let data=[],model='Qwen3-8B',precision='W4A16';
const settingRows=()=>data.filter(r=>r.model===model&&(r.precision===precision||r.precision==='BF16'));
function grouped(){
 const active=methods;
 const w=1280,h=330,L=48,R=18,T=32,B=55,plotW=w-L-R,plotH=h-T-B,group=plotW/5;
 const unit=20,gap=4,total=active.length*(unit+gap)-gap;
 let axisLabels="",barLabels="";
 let s=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(model+' '+precision)} scores on five benchmarks; vertical axis starts at zero">`;
 s+=`<text x="${L}" y="14" class="axis-label">Score (%)</text>`;
 [0,25,50,75,100].forEach(t=>{const y=T+plotH*(1-t/100);if(t!==0)s+=`<line x1="${L}" x2="${w-R}" y1="${y}" y2="${y}" class="gridline"/>`;axisLabels+=`<text x="${L-12}" y="${y+4}" text-anchor="end" class="tick">${t}</text>`});
 benchmarks.forEach(([key,title],i)=>{
  const start=L+i*group+(group-total)/2;
  active.forEach((method,j)=>{
   const row=settingRows().find(r=>r.method===method),v=row[key],barH=plotH*v/100,x=start+j*(unit+gap),y=T+plotH-barH;
   const cls=method==='Ours'?'ours':method==='BF16'?'bf16':'baseline';
   s+=`<rect x="${x}" y="${y}" width="${unit}" height="${barH}" fill="${fills[method]}" class="benchmark-bar ${cls}" style="--bar-delay:${i*65+j*22}ms" tabindex="0" role="img" aria-label="${esc(title+' · '+label(method)+' · '+v.toFixed(2))}"><title>${esc(model+' / '+precision+' / '+title+' / '+label(method)+': '+v.toFixed(2))}</title></rect>`;
   if(method==='Ours'||method==='BF16')barLabels+=`<text x="${x+unit/2}" y="${y-7}" text-anchor="middle" class="bar-value ${cls}" style="--bar-delay:${i*65+j*22}ms">${v.toFixed(2)}</text>`;
  });
  axisLabels+=`<text x="${L+i*group+group/2}" y="${h-34}" text-anchor="middle" class="benchmark-label">${title}</text>`;
 });
 s+=`<g class="chart-value-layer">${barLabels}</g><g class="chart-axis-layer"><line x1="${L}" x2="${w-R}" y1="${T+plotH}" y2="${T+plotH}" class="gridline zero"/>${axisLabels}</g></svg>`;
 root.querySelector('.press-legend').innerHTML=active.map(m=>`<span><i class="legend-${m==='BF16'?'reference':''}" style="--series:${fills[m]}"></i>${esc(label(m))}</span>`).join('');
 return s;
}
function render(){
 root.querySelector('.press-plot').innerHTML=grouped();
 root.querySelectorAll('[data-press-model]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pressModel===model&&b.dataset.pressPrecision===precision)));
 const rows=settingRows(),ours=rows.find(r=>r.method==='Ours'),bf=rows.find(r=>r.method==='BF16'),best=rows.filter(r=>!['BF16','Ours'].includes(r.method)).reduce((a,b)=>a.average>b.average?a:b);
 let summary=`${model} · ${precision}: average score ${ours.average.toFixed(2)} (BF16: ${bf.average.toFixed(2)}), ${(ours.average-best.average).toFixed(2)} points above the strongest quantized baseline, ${best.method}.`;
 if(window.SiteLocale?.lang==='zh')summary=`${model} · ${precision}：平均分 ${ours.average.toFixed(2)}（BF16：${bf.average.toFixed(2)}），比最强量化基线 ${best.method} 高 ${(ours.average-best.average).toFixed(2)} 分。`;
 root.querySelector('[data-press-summary]').textContent=summary;
 root.dataset.ready='true';
}
root.querySelectorAll('[data-press-model]').forEach(b=>b.onclick=()=>{if(!data.length)return;model=b.dataset.pressModel;precision=b.dataset.pressPrecision||'W4A16';render()});
ResearchChartData.scores().then(d=>{data=d;render()}).catch(()=>{root.querySelector('.press-plot').textContent=window.HomeLocale?.t('Benchmark data could not be loaded. Please reload.')||'Benchmark data could not be loaded. Please reload.'});
})();
