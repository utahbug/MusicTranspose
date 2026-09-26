// PrimarySongs' inactive/active/accent dot pattern, driven by MusicTranspose's
// existing performance clock. No metronome audio context or independent audio timer.
export function beatState(timeline,seconds){
 const measures=timeline.measures;if(!measures?.length)return null;
 let quarter=0,elapsed=0,bpm=timeline.tempos[0][1];
 for(const [at,next] of timeline.tempos){const span=(at-quarter)*60/bpm;if(elapsed+span>seconds)break;elapsed+=span;quarter=at;bpm=next;}
 quarter+=Math.max(0,seconds-elapsed)*bpm/60;
 const m=measures.findLast(m=>m.beat<=quarter+1e-8)||measures[0];
 const compound=m.unit===8&&m.beats>=6&&m.beats%3===0,step=(compound?3:1)*4/m.unit,count=compound?m.beats/3:m.beats;
 if(!Number.isFinite(count)||count<1||count>16)return null;
 // A short pickup occupies the final beats of its written meter.
 const pickup=m===measures[0]?Math.max(0,m.beats*4/m.unit-m.length):0;
 return {count,index:Math.min(count-1,Math.floor((Math.max(0,quarter-m.beat)+pickup+1e-8)/step)%count),meter:m.beats+'/'+m.unit};
}
export function createMetronome(playback,getState){
 const control=document.getElementById('metronome-mode'),score=document.getElementById('score'),key='music-transpose-metronome-session-v1';
 let enabled=false;try{enabled=sessionStorage.getItem(key)==='dots';}catch{}control.value=enabled?'dots':'off';
 const rails=['top','bottom'].map(side=>{const e=document.createElement('div');e.className='beat-rail beat-rail-'+side;e.setAttribute('aria-hidden','true');e.hidden=true;document.body.append(e);return e;});
 let version=0,prepared='',pending='',frame=0,last=0,position=0,previousPlayback='stopped',lastBeat='',timeline=null;
 const clipped=()=>[score,document.getElementById('source-credits'),document.getElementById('original-key-reference')];
 function setVisible(on){if(document.body.classList.contains('metronome-visible')===on)return;document.body.classList.toggle('metronome-visible',on);queueMicrotask(()=>document.dispatchEvent(new Event('metronome-layout')));}
 function hide(){cancelAnimationFrame(frame);frame=0;last=0;lastBeat='';for(const e of rails)e.hidden=true;setVisible(false);for(const e of clipped()){e.style.removeProperty('--beat-clip-top');e.style.removeProperty('--beat-clip-bottom');}}
 function place(){
  const r=score.getBoundingClientRect(),heading=document.querySelector('.score-heading').getBoundingClientRect(),footer=document.querySelector('.masthead').getBoundingClientRect();
  const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--beat-safe-top'))||0;
  const top=Math.max(safe,Math.min(r.top,heading.bottom)),bottom=footer.top-14;
  for(const [i,e] of rails.entries()){e.style.left=Math.max(12,r.left)+'px';e.style.width=Math.max(0,Math.min(r.right,innerWidth-12)-Math.max(12,r.left))+'px';e.style.top=(i?bottom:top)+'px';}
  // Thin viewport lanes protect notation; pointer events pass through unchanged.
  for(const e of clipped()){const rect=e.getBoundingClientRect();e.style.setProperty('--beat-clip-top',Math.max(0,top+14-rect.top)+'px');e.style.setProperty('--beat-clip-bottom',Math.max(0,rect.bottom-bottom)+'px');}
 }
 function draw(beat){const identity=beat.count+':'+beat.index;if(identity===lastBeat)return;lastBeat=identity;for(const rail of rails){if(rail.children.length!==beat.count){rail.replaceChildren(...Array.from({length:beat.count},(_,i)=>{const dot=document.createElement('span');dot.className='beat-dot'+(i===0?' beat-first':'');return dot;}));}rail.dataset.beat=String(beat.index);rail.dataset.count=String(beat.count);[...rail.children].forEach((dot,i)=>dot.classList.toggle('active',i===beat.index));}}
 function tick(now){
  const state=getState();if(!enabled||!state.available||document.hidden||!timeline){hide();return;}
  const play=playback.state;
  if(play==='playing'||play==='paused')position=Math.max(0,playback.position);
  else{if(previousPlayback!=='stopped')position=0;else if(last)position+=(now-last)/1000*playback.tempo.rate;}
  last=now;previousPlayback=play;
  const beat=beatState(timeline,position%timeline.duration);if(beat)draw(beat);
  for(const rail of rails)rail.hidden=false;setVisible(true);place();frame=requestAnimationFrame(tick);
 }
 async function sync(){
  const state=getState();if(!enabled||!state.available||document.hidden){version++;pending='';hide();return;}
  if(prepared===state.xml&&timeline){if(!frame)frame=requestAnimationFrame(tick);return;}
  if(pending===state.xml)return;const token=++version;pending=state.xml;hide();
  try{await playback.prepare();if(token!==version||!getState().available||!enabled)return;timeline=playback.timeline;prepared=state.xml;position=0;previousPlayback='stopped';frame=requestAnimationFrame(tick);}catch{if(token===version){timeline=null;hide();}}finally{if(token===version)pending='';}
 }
 control.addEventListener('change',()=>{enabled=control.value==='dots';try{sessionStorage.setItem(key,control.value);}catch{}position=0;last=0;sync();});
 document.addEventListener('visibilitychange',sync);
 document.addEventListener('library-open',()=>{version++;pending='';hide();});
 document.addEventListener('score-session-reset',()=>{version++;prepared='';pending='';timeline=null;hide();});
 window.addEventListener('beforeprint',hide);window.addEventListener('afterprint',sync);
 return {sync};
}
