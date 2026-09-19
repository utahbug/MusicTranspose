// Independent, finite flights. Coordinates are fractions of the visible lyric body.
export function planFlight(existing=[]){
 let flight;
 for(let attempt=0;attempt<40;attempt++){
  const upper=Math.random()<.8,direction=Math.random()<.5?-1:1;
  const startX=Math.random()<.35?(direction===1?.03:.97):.12+Math.random()*.76;
  flight={delay:350+Math.random()*5150,startX,endX:direction===1?1.1:-.1,direction,upper,
   startY:upper?.05+Math.random()*.34:.48+Math.random()*.32,
   endY:upper?.05+Math.random()*.34:.48+Math.random()*.32,
   duration:18000+Math.random()*16000,curve:(Math.random()-.5)*.08};
  const speed=f=>Math.abs(f.endX-f.startX)/f.duration;
  if(!existing.some(f=>Math.abs(f.delay-flight.delay)<450||
   (f.direction===direction&&Math.abs(f.startX-startX)<.2&&Math.abs(f.startY-flight.startY)<.1&&Math.abs(speed(f)/speed(flight)-1)<.3)))break;
 }
 return flight;
}
// Decorative, view-scoped interaction. No lyric data or score dependencies.
export function createLyricsFun(host,paper,initialLimit=4){
 const abort=new AbortController(),signal=abort.signal,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.className='lyrics-fun-layer';layer.setAttribute('aria-hidden','true');host.append(layer);
 let frame=0,gesture=null,stopped=false,last=0,bounds=null,shotBusy=false;let limit=Math.max(1,Math.min(4,initialLimit));const targets=[],flights=[];
 const effects=new Map();
 const clearEffect=e=>{clearTimeout(effects.get(e));effects.delete(e);e.remove();};
 const svgNS='http://www.w3.org/2000/svg';
 const svg=(tag,attrs)=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
 function spawn(flight){
  if(stopped||targets.length>=limit)return;
  const type=['half','quarter','eighth','sixteenth','beamed-eighth','beamed-sixteenth'][Math.floor(Math.random()*6)];
  const note=svg('svg',{viewBox:'0 0 44 56',class:'lyrics-fun-note','data-note-type':type});
  if(type.startsWith('beamed-')){
   for(const [x,y] of [[10,43],[33,38]])note.append(svg('ellipse',{cx:x,cy:y,rx:7,ry:5,transform:`rotate(-20 ${x} ${y})`,fill:'currentColor'}));
   note.append(svg('path',{d:'M16 42V10L39 5V37',fill:'none',stroke:'currentColor','stroke-width':2.5}),svg('path',{d:'M16 10L39 5V10L16 15Z',fill:'currentColor'}));
   if(type==='beamed-sixteenth')note.append(svg('path',{d:'M16 19L39 14V18L16 23Z',fill:'currentColor'}));
  }else{
  note.append(svg('ellipse',{cx:15,cy:43,rx:9,ry:6,transform:'rotate(-20 15 43)',fill:type==='half'?'none':'currentColor',stroke:'currentColor','stroke-width':3}),svg('path',{d:'M23 42V7',fill:'none',stroke:'currentColor','stroke-width':3}));
  if(type==='eighth'||type==='sixteenth')note.append(svg('path',{d:'M24 8 Q43 18 30 29 Q35 20 24 18Z',fill:'currentColor'}));
  if(type==='sixteenth')note.append(svg('path',{d:'M24 19 Q43 29 30 40 Q35 31 24 29Z',fill:'currentColor'}));
  }
  note.hidden=true;note.style.display='none';targets.push({note,flight,elapsed:0,point:{x:0,y:0},active:false});layer.append(note);
 }
 function addFlights(count){for(let i=0;i<count;i++){const flight=planFlight(flights);flights.push(flight);if(flights.length>4)flights.shift();spawn(flight);}}
 function measure(){
  const r=paper.getBoundingClientRect(),body=paper.querySelector('.lyrics-body').getBoundingClientRect();
  const top=Math.max(0,body.top),bottom=Math.min(innerHeight,r.bottom-8),height=Math.max(0,bottom-top);
  bounds={left:r.left+8,top,width:Math.max(0,r.width-16),height};
  Object.assign(layer.style,{left:bounds.left+'px',top:top+'px',width:bounds.width+'px',height:height+'px'});
  layer.hidden=height<64||document.hidden;
 }
 function tick(now){
  if(stopped)return;
  measure();
  const dt=last?Math.min(now-last,50):0;last=now;
  const h=parseFloat(getComputedStyle(paper.querySelector('.lyrics-body')).fontSize)*1.4,w=h*44/56;
  for(const t of [...targets]){
   if(!layer.hidden&&!t.shot)t.elapsed+=dt;
   const f=t.flight,elapsed=t.elapsed-f.delay;
   if(elapsed<0)continue;
   if(elapsed>=f.duration&&!t.shot){targets.splice(targets.indexOf(t),1);t.note.remove();continue;}
   t.active=true;t.note.hidden=false;t.note.style.display='';
   const progress=reduced.matches?.25:Math.min(1,elapsed/f.duration);
   if(!t.shot)t.point={x:(f.startX+(f.endX-f.startX)*progress)*bounds.width,
    y:h/2+(f.startY+(f.endY-f.startY)*progress+Math.sin(progress*Math.PI)*f.curve)*Math.max(0,bounds.height-h)};
   Object.assign(t.note.style,{width:w+'px',height:h+'px',left:t.point.x-w/2+'px',top:t.point.y-h/2+'px'});
  }
  frame=targets.length?requestAnimationFrame(tick):0;
 }
 function fire(){
  measure();if(layer.hidden||!bounds||shotBusy)return;shotBusy=true;
  const visible=targets.filter(t=>t.active&&t.point.x>=0&&t.point.x<=bounds.width);
  const target=visible.length?visible[Math.floor(Math.random()*visible.length)]:null,hit=!!target;
  if(target)target.shot=true;
  const side=Math.random()<.5?'left':'right',origin={x:side==='left'?0:bounds.width,y:30+Math.random()*Math.max(0,bounds.height*.42-60)};
  // Free shots cross the opposite edge; they never stop in the middle of the lyrics.
  const destination=hit?{...target.point}:{x:side==='left'?bounds.width+24:-24,y:20+Math.random()*Math.max(0,bounds.height*.7-40)};
  const effect=svg('svg',{class:'lyrics-fun-effect',width:'100%',height:'100%'});effect.dataset.origin=side;effect.dataset.shot=hit?'hit':'free';
  const line=svg('line',{x1:origin.x,y1:origin.y,x2:destination.x,y2:destination.y,stroke:'var(--fun-beam)','stroke-width':3,'stroke-linecap':'round',class:'lyrics-fun-projectile'}),length=Math.hypot(destination.x-origin.x,destination.y-origin.y);line.style.setProperty('--shot-length',length);line.style.setProperty('--shot-dash',Math.min(38,length*.3));effect.append(line);layer.append(effect);
  effects.set(effect,setTimeout(()=>{
   line.remove();
   if(hit){const i=targets.indexOf(target);if(i>=0){targets.splice(i,1);target.note.remove();}
    for(let i=0;i<8;i++){const angle=i*Math.PI/4,spark=svg('circle',{cx:destination.x,cy:destination.y,r:4,fill:['#E078A2','#48B8C3','#D2A536','#9876DD'][i%4]});spark.style.setProperty('--dx',Math.cos(angle)*25+'px');spark.style.setProperty('--dy',Math.sin(angle)*25+'px');spark.classList.add('lyrics-fun-spark');effect.append(spark);}
    effects.set(effect,setTimeout(()=>{clearEffect(effect);shotBusy=false;},400));
   }else{clearEffect(effect);shotBusy=false;}
  },300));
 }
 const safe=e=>e.target instanceof Element&&paper.contains(e.target)&&!e.target.closest('button,a,input,select,textarea,[role=button]');
 host.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0){gesture=null;return;}gesture=safe(e)?{id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),scroll:scrollY}:null;},{signal,passive:true});
 host.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture=null;},{signal,passive:true});
 host.addEventListener('pointerup',e=>{const g=gesture;gesture=null;if(g&&g.id===e.pointerId&&safe(e)&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=8&&performance.now()-g.time<450&&Math.abs(scrollY-g.scroll)<2)fire();},{signal,passive:true});
 host.addEventListener('pointercancel',()=>{gesture=null;},{signal,passive:true});
 window.addEventListener('scroll',()=>{gesture=null;},{signal,passive:true,capture:true});
 document.addEventListener('visibilitychange',()=>{gesture=null;cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(tick);},{signal});
 addFlights(limit);frame=requestAnimationFrame(tick);
 const cleanup=()=>{stopped=true;abort.abort();cancelAnimationFrame(frame);for(const e of effects.keys())clearEffect(e);layer.remove();};
 cleanup.setLimit=value=>{const next=Math.max(1,Math.min(4,Number(value)||4));const previous=limit;limit=next;if(next>previous)addFlights(next-previous);else while(targets.length>next)targets.pop().note.remove();if(!frame&&targets.length){last=0;frame=requestAnimationFrame(tick);}};
 return cleanup;
}
