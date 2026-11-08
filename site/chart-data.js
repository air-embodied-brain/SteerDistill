/* The homepage and article read the same published scores and use the same palette. */
window.ResearchChartData = (() => {
  const methods=['BF16','Ours','QeRL','On-Policy QAD','BitDistiller','EfficientQAT','GPTQ'];
  const benchmarkMethods=['BF16','GPTQ','EfficientQAT','BitDistiller','On-Policy QAD','QeRL','Ours'];
  const colors={BF16:'var(--red)',Ours:'var(--blue)',QeRL:'#858177','On-Policy QAD':'#9d988c',BitDistiller:'#b5b0a5',EfficientQAT:'#c9c5bb',GPTQ:'#dad7cf'};
  const settings=[['Qwen3-8B','W4A16'],['Qwen3-8B','W4A8'],['Qwen3-8B','W2A16'],['Qwen3.5-4B','W4A16'],['Gemma 4 12B-it','W4A16']];
  const label=m=>m==='Ours'?'SteerDistill':m;
  const cache=new Map();
  function read(path,parse){if(!cache.has(path))cache.set(path,fetch(SitePaths.url(path)).then(r=>{if(!r.ok)throw Error('Chart data unavailable');return r.text()}).then(parse).catch(e=>{cache.delete(path);throw e}));return cache.get(path);}
  function parseScores(csv){const lines=csv.trim().split(/\r?\n/),keys=lines.shift().split(',');return lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[keys[i],i<3?v:Number(v)])));}
  function scores(){return read('experiments/data/benchmark_results.csv',parseScores);}
  function efficiency(){return read('experiments/data/efficiency.json',JSON.parse);}
  function selected(rows,model,precision){return benchmarkMethods.map(method=>{
    const row=rows.find(r=>r.model===model&&r.method===method&&r.precision===(method==='BF16'?'BF16':precision));
    if(!row)throw Error(`Missing score: ${model} / ${precision} / ${method}`);return row;
  });}
  return {methods,benchmarkMethods,colors,settings,label,scores,efficiency,selected,parseScores};
})();
