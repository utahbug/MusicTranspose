// Same-document routes: never ask the static host to serve virtual paths.
const key='musicTransposeNavigation';
const views=new Set(['library','lists','files','score','lyrics']);
const valid=r=>r&&views.has(r.view);
export function createViewHistory({capture,restore,isBusy,onTravel}){
 let current={view:'library'},restoring=false,pending=null,running=false,revision=0;
 const read=state=>state?.[key]?.version===1&&valid(state[key].route)?state[key].route:null;
 const write=(route,push=false)=>{if(!push&&JSON.stringify(read(history.state))===JSON.stringify(route))return;history[push?'pushState':'replaceState']({...history.state,[key]:{version:1,route}},'');};
 const snapshot=()=>{if(restoring)return;current=capture(current);write(current);};
 function visit(route){
  if(restoring)return;
  snapshot();
  if(current.view===route.view&&(!['score','lyrics'].includes(route.view)||current.song===route.song)&&(!['lists','library'].includes(route.view)||current.list===route.list)&&(route.view!=='lists'||!!current.picking===!!route.picking))return;
  current={...current,...route,scroll:0};write(current,true);
 }
 async function drain(){
  if(running)return;running=true;restoring=true;
  try{while(pending){const target=pending,token=revision;pending=null;
   while(isBusy())await new Promise(r=>setTimeout(r,25));
   if(token!==revision)continue;
   current=target;const resolved=await restore(target);
   if(token===revision){current=capture(resolved||target);write(current);}
  }}finally{running=false;restoring=false;}
 }
 function travel(route){pending=route;revision++;onTravel?.(route,current);void drain();}
 window.addEventListener('popstate',e=>travel(read(e.state)||{view:'library'}));
 window.addEventListener('pagehide',snapshot);
 // Store reading/list scroll without adding entries for scrolling or page flips.
 let scrollTimer;window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(snapshot,200);},{passive:true});
 return {visit,snapshot,get current(){return current;},replace(route){if(restoring)return;current={...current,...route};write(current);},start(){history.scrollRestoration='manual';const saved=read(history.state);if(saved)travel(saved);else snapshot();}};
}
