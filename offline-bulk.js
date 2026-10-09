// Transient workflow only: authoritative ownership remains in offline-manager/worker.
export const ownershipKey=state=>JSON.stringify([!!state?.local,!!state?.individual,[...(state?.lists||[])].sort()]);
export const individuallyRemovable=(song,state)=>!song.local&&!state.local&&!!state.individual;
export function createBulkRemoval({refresh,summary,remove,changed=()=>{}}){
 let busy=false,stopping=false;
 async function fresh(){await refresh();const value=summary();if(value.bulkRemoval!==1)throw Error('Offline management is updating. Reopen the app online, then try again.');if(!value.inventoryReady||value.busy)throw Error('Ownership could not be verified. Wait for other saves to finish, then try again.');return value;}
 function prepare(items,value){return items.map(item=>{const state=item.song.local?{local:true}:value.songs[item.song.id]||{},key=ownershipKey(state);return {...item,key,state,changed:item.key!==key,action:individuallyRemovable(item.song,state)?'release':item.retry&&!item.song.local&&!state.local?'cleanup':'skip'};});}
 async function review(items){if(busy)return null;return prepare(items,await fresh());}
 async function run(plan){
  if(busy)return null;busy=true;stopping=false;changed({busy:true,message:'Checking ownership before removal…'});
  const outcomes=[];let remaining=[...plan];
  try{
   const current=prepare(plan,await fresh());
   if(stopping)return {outcomes,remaining};
   if(current.some((item,i)=>item.key!==plan[i].key||item.action!==plan[i].action))return {review:current};
   for(const item of plan){
    if(stopping)break;
    changed({busy:true,message:`Checking ${outcomes.length+1} of ${plan.length}: ${item.song.title}`});
    let state;
    try{state=(await fresh()).songs[item.song.id]||{};}catch(error){remaining=remaining.slice(1);outcomes.push({...item,status:'unverified',detail:error.message});break;}
    if(stopping)break;
    remaining=remaining.slice(1);
    if(item.action==='skip'||ownershipKey(state)!==item.key){outcomes.push({...item,status:'skipped',detail:'Ownership changed or no individual save remains. Review again before removing.'});continue;}
    changed({busy:true,message:`Removing ${outcomes.length+1} of ${plan.length}: ${item.song.title}. You can close this panel; remaining songs will stop.`});
    try{
     // Guard evaluated inside the worker queue, not just against a potentially stale UI snapshot.
     const result=await remove(item.song,item.action==='cleanup'?{cleanupOnly:true}:{expectedLists:[...(state.lists||[])].sort()});
     const after=result.songs[item.song.id]||{};
     outcomes.push({...item,status:result.skipped?'skipped':item.action==='cleanup'?'cleaned':'released',protected:!!after.lists?.length,detail:result.skipped?'Ownership changed before removal. Review again.':item.action==='cleanup'?'Unused saved-cache cleanup completed.':after.lists?.length?'Individual save removed; kept by an offline List.':'Individual save removed.'});
    }catch(error){
     // An absent pin does NOT prove cleanup completed: writes precede collectUnused().
     await refresh();const verified=summary().inventoryReady,after=summary().songs[item.song.id];
     const failed=verified&&after?.individual&&error.message!=='timeout';
     outcomes.push({...item,retry:true,status:failed?'failed':'uncertain',detail:failed?'Individual save is still present. Removal failed; review before retrying.':verified&&!after?.individual?'Individual save is released, but cleanup was not confirmed.':'Removal was not confirmed. Cleanup may be incomplete.'});
     break;
    }
   }
   await refresh();return {outcomes,remaining};
  }finally{busy=false;changed({busy:false});}
 }
 return {review,run,stop(){stopping=true;changed({busy,message:'Stopping after the current check or removal…'});},get busy(){return busy;}};
}
