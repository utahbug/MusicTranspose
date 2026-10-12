// A normal registration update: activation and reload remain owned by sw.js/app.js.
export async function checkForUpdates({serviceWorker,online=true,onStatus,timeoutMs=30000}){
 const failed='Unable to check for updates. Try again when online.';
 const cleanup=[];let timer,finished=false;
 const report=text=>{if(!finished)onStatus(text);};
 report('Checking for updates…');
 try{
  if(!online||!serviceWorker)throw Error('Unavailable');
  await Promise.race([(async()=>{
   const registration=await serviceWorker.getRegistration();if(!registration||finished)throw Error('No registration');
   let worker=registration.installing||registration.waiting;
   const found=()=>{worker=registration.installing||registration.waiting||worker;if(worker)report('Update found. Refreshing…');};
   registration.addEventListener('updatefound',found);cleanup.push(()=>registration.removeEventListener('updatefound',found));
   await registration.update();if(finished)return;found();
   if(!worker){report('B\'itz Score is up to date.');return;}
   await new Promise((resolve,reject)=>{
    const changed=()=>{if(worker.state==='activated')resolve();else if(worker.state==='redundant')reject(Error('Install failed'));};
    worker.addEventListener('statechange',changed);cleanup.push(()=>worker.removeEventListener('statechange',changed));changed();
   });
  })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Update timeout')),timeoutMs);})]);
 }catch{report(failed);}finally{finished=true;clearTimeout(timer);for(const dispose of cleanup)dispose();}
}
export function initUpdateCheck({closeMenu,returnFocus}){
 const button=document.getElementById('home-check-updates'),status=document.getElementById('home-update-status');let busy=false;
 button.onclick=async()=>{if(busy)return;busy=true;button.disabled=true;closeMenu();returnFocus();try{await checkForUpdates({serviceWorker:navigator.serviceWorker,online:navigator.onLine,onStatus:text=>{status.textContent=text;}});}finally{busy=false;button.disabled=false;}};
}
