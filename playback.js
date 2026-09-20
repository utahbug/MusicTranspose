// MusicXML performance timeline: written-order measures, all pitched parts/voices.
export function scoreTimeline(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror')||doc.documentElement.localName!=='score-partwise')throw Error('Unsupported score');
 const text=(e,s)=>e.querySelector(s)?.textContent.trim(),num=(e,s,d=0)=>Number(text(e,s)??d),parts=[],lengths=[],tempos=[],warnings=new Set();
 for(const part of doc.querySelectorAll('score-partwise > part')){
  let divisions=1,meter=4;const measures=[];
  for(const [mi,measure] of [...part.children].filter(e=>e.localName==='measure').entries()){
   let cursor=0,lastStart=0,end=0;const notes=[],marks=[];
   for(const el of measure.children){
    if(el.localName==='attributes'){divisions=num(el,'divisions',divisions);if(!(divisions>0))throw Error('Invalid divisions');const beats=text(el,'time > beats'),unit=num(el,'time > beat-type');if(beats&&unit)meter=beats.split('+').reduce((a,b)=>a+Number(b),0)*4/unit;}
    if(el.localName==='backup')cursor-=num(el,'duration')/divisions;
    if(el.localName==='forward'){cursor+=num(el,'duration')/divisions;end=Math.max(end,cursor);}
    if(el.localName==='direction'||el.localName==='sound'){
     const sound=el.localName==='sound'?el:el.querySelector('sound[tempo]');let bpm=Number(sound?.getAttribute('tempo'));
     if(!(bpm>0)){const m=el.querySelector('metronome'),units={whole:4,half:2,quarter:1,eighth:.5,'16th':.25};if(m){const unit=units[text(m,'beat-unit')],dots=m.querySelectorAll('beat-unit-dot').length;bpm=num(m,'per-minute')*unit*(2-1/2**dots);}}
     if(bpm>0&&Number.isFinite(bpm))marks.push({beat:Math.max(0,cursor+num(el,'offset')/divisions),bpm});
    }
    if(el.localName!=='note')continue;
    if(el.querySelector('grace')){warnings.add('Grace notes omitted');continue;}
    const duration=num(el,'duration')/divisions,start=el.querySelector('chord')?lastStart:cursor;
    if(!el.querySelector('chord')){lastStart=start;cursor+=duration;}
    end=Math.max(end,start+duration,cursor);
    const pitch=el.querySelector('pitch');if(!pitch||el.querySelector('cue')||el.getAttribute('print-object')==='no'&&el.getAttribute('dynamics')==='0')continue;
    const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11},midi=(num(pitch,'octave')+1)*12+natural[text(pitch,'step')]+num(pitch,'alter');
    if(!Number.isFinite(midi)||duration<=0)continue;
    notes.push({beat:start,duration,midi,part:part.id,voice:text(el,'voice')||'1',staff:text(el,'staff')||'1',ties:[...el.querySelectorAll(':scope > tie')].map(t=>t.getAttribute('type'))});
   }
   const length=end||meter;lengths[mi]=Math.max(lengths[mi]||0,length);measures.push({notes,marks});
  }parts.push(measures);
 }
 const starts=[];let total=0;for(const length of lengths){starts.push(total);total+=length;}
 const raw=[];for(const measures of parts)for(const [i,m] of measures.entries()){for(const n of m.notes)raw.push({...n,beat:n.beat+starts[i]});for(const t of m.marks)tempos.push({...t,beat:t.beat+starts[i]});}
 const tempoMap=new Map();for(const t of tempos)if(!tempoMap.has(t.beat))tempoMap.set(t.beat,t.bpm);
 const fallback=!tempoMap.has(0);if(fallback)tempoMap.set(0,90);
 const changes=[...tempoMap].sort((a,b)=>a[0]-b[0]);
 const seconds=beat=>{let time=0,pos=0,bpm=90;for(const [at,next] of changes){if(at>beat)break;time+=(at-pos)*60/bpm;pos=at;bpm=next;}return time+(beat-pos)*60/bpm;};
 const merged=[],ties=new Map();for(const n of raw.sort((a,b)=>a.beat-b.beat)){
  const key=[n.part,n.voice,n.staff,n.midi].join(':'),prior=ties.get(key);
  if(n.ties.includes('stop')&&prior&&Math.abs(prior.beat+prior.duration-n.beat)<.001){prior.duration+=n.duration;if(!n.ties.includes('start'))ties.delete(key);}
  else{merged.push(n);if(n.ties.includes('start'))ties.set(key,n);else ties.delete(key);}
 }
 const notes=merged.map(n=>({...n,start:seconds(n.beat),duration:seconds(n.beat+n.duration)-seconds(n.beat)}));
 if(!notes.length)throw Error('No playable notes');
 return {notes,duration:seconds(total),fallbackTempo:fallback?90:null,tempos:changes,warnings:[...warnings],repeats:doc.querySelectorAll('repeat,ending,sound[dalsegno],sound[dacapo]').length>0,order:'linear'};
}
export function createPlayback(getSource){
 let context,master,timeline,sourceKey='',state='stopped',position=0,epoch=0,timer=0,index=0,generation=0,pending=false,blocked=false;const voices=new Set(),holds=new Set(),songRates=new Map();let rate=1,songId='';
 const icons={stopped:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8q5 4 0 8M19 5q8 7 0 14"/>',playing:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',paused:'<path d="m8 4 12 8-12 8z"/>'};
 function update(){for(const b of document.querySelectorAll('.song-playback')){const label={stopped:'Play song',playing:'Pause song',paused:'Resume song'}[state];b.setAttribute('aria-label',label);b.title=label+' · Hold to stop';b.disabled=pending||blocked;b.dataset.state=state;b.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">'+icons[state]+'</svg>';}}
 function silence(){clearInterval(timer);timer=0;for(const v of voices){v.osc.onended=null;try{v.osc.stop();}catch{}v.osc.disconnect();v.gain.disconnect();}voices.clear();}
 function stop(){for(const h of holds)clearTimeout(h);holds.clear();generation++;pending=false;silence();position=0;state='stopped';update();}
 function voice(n,start,duration){
  const osc=context.createOscillator(),gain=context.createGain();osc.type='triangle';osc.frequency.value=440*2**((n.midi-69)/12);osc.connect(gain);gain.connect(master);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.13,start+.008);gain.gain.exponentialRampToValueAtTime(.035,start+Math.max(.02,duration*.8));gain.gain.linearRampToValueAtTime(0,start+duration+.025);
  const v={osc,gain};voices.add(v);osc.onended=()=>{voices.delete(v);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.03);
 }
 function schedule(){const elapsed=(context.currentTime-epoch)*rate;if(elapsed>=timeline.duration+.05){stop();return;}while(index<timeline.notes.length&&timeline.notes[index].start<elapsed+.2*rate){const n=timeline.notes[index++],remaining=n.start+n.duration-Math.max(n.start,elapsed);if(remaining>0)voice(n,context.currentTime+Math.max(0,n.start-elapsed)/rate,remaining/rate);}}
 // Positions remain source-timeline seconds. Only the audio clock is scaled.
 async function prepare(){
  const token=generation,source=await getSource();if(token!==generation)throw Error('Song changed');
  if(source.key!==sourceKey){timeline=scoreTimeline(source.xml);sourceKey=source.key;songId=source.id||source.key;rate=songRates.get(songId)||1;position=0;}
  return tempo();
 }
 function tempo(){const original=timeline?.tempos[0][1]||90;return {original,bpm:original*rate,rate,min:Math.min(original,Math.max(40,original*.5)),max:Math.max(original,Math.min(240,original*2)),fallback:!!timeline?.fallbackTempo};}
 function setTempo(bpm){
  if(!timeline||!Number.isFinite(bpm))return;
  const info=tempo(),next=Math.max(info.min,Math.min(info.max,bpm))/info.original;
  if(state==='playing'){position=Math.max(0,(context.currentTime-epoch)*rate);silence();}
  rate=next;songRates.set(songId,rate);
  if(state==='playing'){index=0;while(index<timeline.notes.length&&timeline.notes[index].start+timeline.notes[index].duration<=position)index++;epoch=context.currentTime-position/rate;schedule();if(state==='playing')timer=setInterval(schedule,25);}
 }
 async function toggle(){
  if(state==='playing'){position=Math.max(0,(context.currentTime-epoch)*rate);silence();state='paused';update();return;}if(pending||blocked)return;
  const token=++generation;pending=true;update();
  try{
   // Resume synchronously from the tap before fetching/unpacking a direct-Lyrics score.
   if(!context){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('Audio unavailable');context=new C();master=context.createGain();master.gain.value=.35;const limiter=context.createDynamicsCompressor();master.connect(limiter);limiter.connect(context.destination);}
   const resumed=context.resume();await prepare();await resumed;if(token!==generation)return;
   index=0;while(index<timeline.notes.length&&timeline.notes[index].start+timeline.notes[index].duration<=position)index++;
   epoch=context.currentTime-position/rate;state='playing';pending=false;update();schedule();timer=setInterval(schedule,25);
  }catch{if(token!==generation)return;stop();const message=document.getElementById('playback-message');message.textContent='Unable to play this score. Please try again.';}
 }
 function attach(heading){if(heading.querySelector('.song-playback')){update();return;}const b=document.createElement('button');b.type='button';b.className='song-playback';b.setAttribute('aria-description','Hold or right-click to stop and return to the beginning.');let hold=0,held=false,x,y;
 b.onclick=()=>{if(held){held=false;return;}document.getElementById('playback-message').textContent='';toggle();};
 const cancelHold=()=>{clearTimeout(hold);holds.delete(hold);};b.onpointerdown=e=>{cancelHold();held=false;x=e.clientX;y=e.clientY;hold=setTimeout(()=>{held=true;stop();},600);holds.add(hold);};b.onpointermove=e=>{if(Math.hypot(e.clientX-x,e.clientY-y)>8)cancelHold();};for(const name of ['onpointerup','onpointercancel','onpointerleave'])b[name]=cancelHold;
 b.oncontextmenu=e=>{e.preventDefault();clearTimeout(hold);holds.delete(hold);held=true;stop();};b.onkeydown=e=>{if(e.key==='Escape'){stop();}if(e.key==='F10'&&e.shiftKey){e.preventDefault();stop();}};
 heading.append(b);update();
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing'){position=Math.max(0,(context.currentTime-epoch)*rate);silence();state='paused';update();}});
 return {attach,stop,prepare,setTempo,get tempo(){return tempo();},setBlocked(value){blocked=value;update();},get state(){return state;},get position(){return state==='playing'?(context.currentTime-epoch)*rate:position;},get timeline(){return timeline;},get nodes(){return voices.size;},get songKey(){return sourceKey;}};
}
