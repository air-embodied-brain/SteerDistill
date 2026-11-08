/* Resolve published assets from this script, including GitHub project-site prefixes. */
window.SitePaths=(()=>{
 const root=new URL('../../',document.currentScript.src);
 function url(value){
  const text=String(value);
  let target;
  if(/^[a-z][a-z0-9+.-]*:/i.test(text)||text.startsWith('//'))target=new URL(text,root);
  else if(text.startsWith('/')&&text.startsWith(root.pathname))target=new URL(text,root.origin);
  else target=new URL(text.replace(/^\/+/,''),root);
  return target.origin===root.origin?target.pathname+target.search+target.hash:target.href;
 }
 return{root:root.href,url};
})();
