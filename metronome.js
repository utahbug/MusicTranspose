import {claimToolPanel,releaseToolPanel} from './tool-panel.js';
// Peripheral score-edge pulses use the existing metronome/playback clock.
// Visual and click share this clock and the source timeline; no second beat timer.
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
// Cache visual beat onsets from the existing linear measure/tempo timeline.
// Pickups retain their written beat number; side alternation counts actual beats.
const pulseTimelines=new WeakMap();
export function pulseState(timeline,seconds,rate=1){
 const local=seconds%timeline.duration,beat=beatState(timeline,local);if(!beat)return null;
 let events=pulseTimelines.get(timeline);
 if(!events){
  const secondsAt=q=>{let time=0,previous=0,bpm=timeline.tempos[0][1];for(const [at,next] of timeline.tempos){if(at>q)break;time+=(at-previous)*60/bpm;previous=at;bpm=next;}return time+(q-previous)*60/bpm;};
  events=[];
  for(const [i,m] of timeline.measures.entries()){
   const compound=m.unit===8&&m.beats>=6&&m.beats%3===0,step=(compound?3:1)*4/m.unit;
   const pickup=i===0?Math.max(0,m.beats*4/m.unit-m.length):0;
   for(let n=Math.floor(pickup/step);n*step-pickup<m.length-1e-8;n++)events.push(secondsAt(m.beat+Math.max(0,n*step-pickup)));
  }
  pulseTimelines.set(timeline,events);
 }
 const index=Math.max(0,events.findLastIndex(t=>t<=local+1e-8)),sequence=Math.floor(seconds/timeline.duration)*events.length+index;
 const downbeat=beat.index===0,interval=(events[index+1]??timeline.duration)-events[index];
 const duration=Math.min(downbeat?.22:.15,interval/rate*.6),elapsed=Math.max(0,(local-events[index])/rate);
 return {...beat,sequence,side:sequence%2?'right':'left',downbeat,elapsed,duration};
}
// Manual beats have no measure, meter, pickup, or score-position interpretation.
export function standalonePulse(seconds,bpm){const interval=60/bpm,sequence=Math.floor(seconds/interval);return {sequence,side:sequence%2?'right':'left',index:0,count:0,downbeat:false,elapsed:seconds-sequence*interval,duration:Math.min(.15,interval*.6)};}
export function createMetronome(playback,getState){
 const $=id=>document.getElementById(id),score=$('score'),panel=$('metronome-panel'),opener=$('score-metronome');
 let visual=false,click=false,lastClick=-1,taps=[],opening=0,clickRequest=0,manualBpm=90;
 const enabled=()=>visual||click;
 const rails=['left','right'].map(side=>{const e=document.createElement('div');e.className='beat-rail beat-rail-'+side;e.setAttribute('aria-hidden','true');e.hidden=true;document.body.append(e);return e;});
 let version=0,prepared='',pending='',frame=0,last=0,position=0,previousPlayback='stopped',timeline=null;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function setVisible(on){document.body.classList.toggle('metronome-visible',on);}
 function hide(){playback.silenceClicks();lastClick=-1;cancelAnimationFrame(frame);frame=0;last=0;for(const e of rails){e.hidden=true;e.style.opacity='0';}setVisible(false);}
 function place(){
  const r=score.getBoundingClientRect(),heading=document.querySelector('.score-heading').getBoundingClientRect(),footer=document.querySelector('.masthead').getBoundingClientRect();
  const safe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--beat-safe-top'))||0;
  const top=Math.max(safe,r.top,heading.bottom),bottom=Math.min(r.bottom,footer.top-8,innerHeight);
  for(const [i,e] of rails.entries()){
   e.style.left=Math.max(0,Math.min(innerWidth-4,i?r.right+2:r.left-6))+'px';e.style.top=top+'px';e.style.height=Math.max(0,bottom-top)+'px';e.hidden=bottom<=top;
  }
 }
 function draw(beat,paused){
  const gain=paused?0:reduced.matches?Number(beat.elapsed<beat.duration):Math.max(0,1-beat.elapsed/beat.duration);
  for(const [i,e] of rails.entries()){
   const active=(i===0?'left':'right')===beat.side;
   if(e.dataset.sequence!==String(beat.sequence)||e.dataset.beat!==String(beat.index)||e.dataset.count!==String(beat.count)){
    e.dataset.beat=String(beat.index);e.dataset.count=String(beat.count);e.dataset.sequence=String(beat.sequence);e.dataset.downbeat=String(beat.downbeat);
   }
   const opacity=String(active?gain*(beat.downbeat?.9:.65):0);if(e.style.opacity!==opacity)e.style.opacity=opacity;
  }
 }
 function tick(now){
  const state=getState();if(!enabled()||!state.available||document.hidden||!state.standalone&&!timeline){hide();return;}
  const play=state.standalone?'stopped':playback.state;
  if(play==='playing'||play==='paused')position=Math.max(0,playback.position);
  else{if(previousPlayback!=='stopped')position=0;else if(last)position+=(now-last)/1000*(state.standalone?1:playback.tempo.rate);}
  last=now;previousPlayback=play;
  const beat=state.standalone?standalonePulse(position,manualBpm):pulseState(timeline,position,playback.tempo.rate);if(beat){if(visual)draw(beat,play==='paused');if(click&&play!=='paused'&&beat.sequence!==lastClick){playback.clickBeat(beat.downbeat);lastClick=beat.sequence;}}
  if(visual){setVisible(true);place();}else{for(const rail of rails)rail.hidden=true;setVisible(false);}frame=requestAnimationFrame(tick);
 }
 async function sync(){
  const state=getState();opener.hidden=!state.available;if(!state.available)closePanel();if(!enabled()||!state.available||document.hidden){version++;pending='';hide();return;}
  if(state.standalone){version++;pending='';prepared='';timeline=null;if(!frame)frame=requestAnimationFrame(tick);return;}
  if(prepared===state.xml&&timeline){if(!frame)frame=requestAnimationFrame(tick);return;}
  if(pending===state.xml)return;const token=++version;pending=state.xml;hide();
  try{await playback.prepare();if(token!==version||!getState().available||!enabled())return;timeline=playback.timeline;prepared=state.xml;position=0;previousPlayback='stopped';frame=requestAnimationFrame(tick);}catch{if(token===version){timeline=null;hide();}}finally{if(token===version)pending='';}
 }
 const tempo=()=>getState().standalone?{bpm:manualBpm,min:40,max:240}:playback.tempo;
 function setTempo(bpm){if(getState().standalone){manualBpm=Math.max(40,Math.min(240,bpm));position=0;last=0;lastClick=-1;}else playback.setTempo(bpm);}
 function controls(){
  $('metronome-mode').hidden=!getState().standalone;
  for(const [id,on] of [['metronome-visual',visual],['metronome-click',click]]){$(id).setAttribute('aria-pressed',String(on));$(id).querySelector('span').textContent=on?'On':'Off';}
  const t=tempo();$('tempo-value').textContent=Math.round(t.bpm)+' BPM';$('tempo-down').disabled=t.bpm<=t.min;$('tempo-up').disabled=t.bpm>=t.max;
 }
 function closePanel(focus=false){opening++;panel.hidden=true;opener.setAttribute('aria-expanded','false');releaseToolPanel('metronome');if(focus)$('score-tools').focus({preventScroll:true});}
 opener.addEventListener('click',async()=>{
  if(!getState().available)return;claimToolPanel('metronome',()=>closePanel());const token=++opening;panel.hidden=false;opener.setAttribute('aria-expanded','true');$('metronome-message').textContent='';
  for(const b of panel.querySelectorAll('button:not(#metronome-done)'))b.disabled=true;
  try{if(!getState().standalone)await playback.prepare();if(token!==opening||!getState().available)return;for(const b of panel.querySelectorAll('button'))b.disabled=false;controls();requestAnimationFrame(()=>{if(!panel.hidden)$('metronome-visual').focus({preventScroll:true});});}
  catch{if(token===opening){$('metronome-message').textContent='Unable to prepare metronome timing. Try again online.';}}
 });
 $('metronome-visual').onclick=()=>{visual=!visual;controls();sync();};
 $('metronome-click').onclick=async()=>{const token=++clickRequest;if(click){click=false;playback.silenceClicks();controls();sync();return;}
  try{await playback.enableClick();if(token!==clickRequest||!getState().available)return;click=true;lastClick=-1;controls();sync();}catch{$('metronome-message').textContent='Click sound is unavailable.';}
 };
 for(const [id,delta] of [['tempo-down',-4],['tempo-up',4]])$(id).onclick=()=>{setTempo(tempo().bpm+delta);controls();};
 $('tap-tempo').onclick=()=>{const now=performance.now();if(taps.length&&now-taps.at(-1)>2000)taps=[];taps.push(now);taps=taps.slice(-5);if(taps.length>1)setTempo(60000*(taps.length-1)/(now-taps[0]));controls();};
 $('metronome-done').onclick=()=>closePanel(true);
 panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();closePanel(true);}});
 function reset(){version++;clickRequest++;prepared='';pending='';timeline=null;position=0;visual=false;click=false;taps=[];hide();closePanel();controls();}
 document.addEventListener('visibilitychange',sync);
 document.addEventListener('library-open',reset);
 document.addEventListener('score-session-reset',reset);
 window.addEventListener('beforeprint',hide);window.addEventListener('afterprint',sync);
 return {sync};
}
