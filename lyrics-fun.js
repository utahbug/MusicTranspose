import {phaseNames,phaseDuration,laserPalette,createWorm,stepWorm,wormPoints,wormHit,shortenWorm,resizeWorm} from './lyrics-fun-ambient.js';
// Independent, finite flights. Coordinates are fractions of independently sampled visible content regions.
export function planFlight(existing=[]){
 let flight;
 for(let attempt=0;attempt<40;attempt++){
  const choice=Math.random(),region=choice<.4?'header':choice<.8?'upper':'lower',upper=region!=='lower',direction=Math.random()<.5?-1:1;
  const startX=Math.random()<.35?(direction===1?.03:.97):.12+Math.random()*.76;
  flight={delay:350+Math.random()*5150,startX,endX:direction===1?1.1:-.1,direction,upper,region,
   startY:.1+Math.random()*.8,
   endY:.1+Math.random()*.8,
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
 let frame=0,gesture=null,stopped=false,last=0,bounds=null,shotBusy=false,dirty=true,noteHeight=0;let limit=Math.max(1,Math.min(4,initialLimit));const targets=[],flights=[];
 let phase=0,phaseTime=0,phaseLength=phaseDuration(0),worm=null,wormNode=null,wormGap=0,lastColor=-1;
 const effects=new Map();
 const clearEffect=e=>{clearTimeout(effects.get(e));effects.delete(e);e.remove();};
 const svgNS='http://www.w3.org/2000/svg';
 const svg=(tag,attrs)=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
 function spawn(flight){
  if(stopped||targets.length>=limit)return;
  const type=['half','quarter','eighth','sixteenth','beamed-eighth','beamed-sixteenth'][Math.floor(Math.random()*6)];
  const note=svg('svg',{viewBox:'0 0 44 56',class:'lyrics-fun-note','data-note-type':type,'data-region':flight.region});
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
 function addFlights(count){for(let i=0;i<count;i++){const flight=planFlight(flights);flight.duration=Math.min(flight.duration,Math.max(6000,phaseLength-phaseTime-flight.delay-50));if(phase===2)flight.curve=(Math.random()-.5)*.36;flights.push(flight);if(flights.length>4)flights.shift();spawn(flight);}}
 function measure(){
  if(!dirty)return;dirty=false;
  const r=paper.getBoundingClientRect(),body=paper.querySelector('.lyrics-body'),bodyRect=body.getBoundingClientRect();
  const top=Math.max(8,r.top+8),bottom=Math.min(innerHeight-8,r.bottom-8),height=Math.max(0,bottom-top);
  noteHeight=parseFloat(getComputedStyle(body).fontSize)*1.4;
  const usable=Math.max(0,height-noteHeight),middle=Math.min(usable*.5,Math.max(0,innerHeight/2-top-noteHeight/2));
  // Text is eligible, including wrapped titles and the notice before the first verse.
  // Once the header scrolls away, header-weighted flights use the visible upper area.
  const headerEnd=Math.max(0,Math.min(middle,bodyRect.top-top-noteHeight/2));
  const split=headerEnd>noteHeight/2?headerEnd:middle*.45;
  const oldBounds=bounds;
  bounds={left:r.left+8,top,width:Math.max(0,r.width-16),height,
   regions:{header:[0,split],upper:[split,middle],lower:[middle,usable]}};
  Object.assign(layer.style,{left:bounds.left+'px',top:top+'px',width:bounds.width+'px',height:height+'px'});
  layer.hidden=height<64||document.hidden;
  if(worm&&oldBounds&&(oldBounds.width!==bounds.width||oldBounds.height!==height||worm.font!==noteHeight/1.4)){if(bounds.width>0&&height>0)resizeWorm(worm,bounds.width,height,noteHeight/1.4);}
 }
 const invalidate=()=>{dirty=true;};
 const observer=new ResizeObserver(invalidate);observer.observe(paper);observer.observe(paper.querySelector('.lyrics-body'));
 window.addEventListener('resize',invalidate,{signal,passive:true});
 function removeWorm(){wormNode?.remove();wormNode=null;worm=null;}
 function spawnWorm(){
  worm=createWorm(bounds.width,bounds.height,noteHeight/1.4);wormNode=document.createElement('div');wormNode.className='lyrics-fun-worm';layer.append(wormNode);
  for(let i=0;i<worm.count;i++){const dot=document.createElement('i');dot.className='lyrics-fun-segment';dot.dataset.part=i?'body':'head';wormNode.append(dot);}drawWorm();
 }
 function drawWorm(){
  while(wormNode.children.length<worm.count){const dot=document.createElement('i');dot.className='lyrics-fun-segment';dot.dataset.part='body';wormNode.append(dot);}
  const points=wormPoints(worm);while(wormNode.children.length>worm.count)wormNode.lastElementChild.remove();
  [...wormNode.children].forEach((dot,i)=>{const p=points[i];dot.hidden=!p;if(!p)return;const size=worm.size*(i===0?1.2:1);dot.style.width=size*1.35+'px';dot.style.height=size+'px';dot.style.transform=`translate(${p.x-size*.675}px,${p.y-size/2}px) rotate(-20deg)`;});
 }
 function enterPhase(index){
  phase=index;phaseTime=0;phaseLength=phaseDuration(index);layer.dataset.phase=phaseNames[index];
  for(const t of targets)t.note.remove();targets.length=0;flights.length=0;removeWorm();wormGap=0;
  for(const e of effects.keys())clearEffect(e);shotBusy=false;
  if(phase===1){if(!layer.hidden)spawnWorm();}else addFlights(limit);
 }
 function tick(now){
  if(stopped)return;
  measure();
  const dt=last?Math.min(now-last,50):0;last=now;
  if(!layer.hidden){
   phaseTime+=dt;if(phaseTime>=phaseLength)enterPhase((phase+1)%4);
   if(phase===1){
    if(worm){stepWorm(worm,dt/1000,reduced.matches);if(worm.escaped){removeWorm();wormGap=4000;}else drawWorm();}
    else{wormGap=Math.max(0,wormGap-dt);if(wormGap===0)spawnWorm();}
   }
  }
  const h=noteHeight,w=h*44/56;
  for(const t of [...targets]){
   if(!layer.hidden&&!t.shot)t.elapsed+=dt;
   const f=t.flight,elapsed=t.elapsed-f.delay;
   if(elapsed<0)continue;
   if(elapsed>=f.duration&&!t.shot){targets.splice(targets.indexOf(t),1);t.note.remove();continue;}
   t.active=true;t.note.hidden=false;t.note.style.display='';
   const progress=reduced.matches?.25:Math.min(1,elapsed/f.duration);
   const [low,high]=bounds.regions[f.region],startX=w/2+f.startX*Math.max(0,bounds.width-w);
   if(!t.shot)t.point={x:startX+(f.endX*bounds.width-startX)*progress,
    y:h/2+low+(f.startY+(f.endY-f.startY)*progress+Math.sin(progress*Math.PI)*f.curve)*(high-low)};
   Object.assign(t.note.style,{width:w+'px',height:h+'px',left:t.point.x-w/2+'px',top:t.point.y-h/2+'px'});
  }
  frame=requestAnimationFrame(tick);
 }
 function fire(event){
  measure();if(layer.hidden||!bounds||shotBusy)return;shotBusy=true;
  const tap={x:Math.max(0,Math.min(bounds.width,event.clientX-bounds.left)),y:Math.max(0,Math.min(bounds.height,event.clientY-bounds.top))};
  const visible=targets.filter(t=>t.active&&t.point.x>=0&&t.point.x<=bounds.width);
  const target=visible.length?visible[Math.floor(Math.random()*visible.length)]:null;
  const contact=worm?wormHit(worm,tap):null;
  const kind=contact?(contact.index===0?'head':'body'):target?'hit':'free';
  const destination=contact?{...contact.point}:target?{...target.point}:tap;
  if(target)target.shot=true;
  if(contact){if(contact.index===0){removeWorm();wormGap=4000;}else{shortenWorm(worm);drawWorm();}}
  // Shared visible-playfield coordinates for hits and empty-space shots on every device.
  const origin={x:bounds.width*(.2+Math.random()*.6),y:bounds.height*(.55+Math.random()*.2)};
  const palette=laserPalette[host.classList.contains('lyrics-dark')?'dark':'light'];
  let color=Math.floor(Math.random()*(palette.length-(lastColor<0?0:1)));if(lastColor>=0&&color>=lastColor)color++;lastColor=color;
  const effect=svg('svg',{class:'lyrics-fun-effect',width:'100%',height:'100%'});effect.dataset.origin='lower-middle';effect.dataset.shot=kind;
  const line=svg('line',{x1:origin.x,y1:origin.y,x2:destination.x,y2:destination.y,stroke:palette[color],'stroke-width':2,'stroke-linecap':'round',class:'lyrics-fun-projectile'}),length=Math.hypot(destination.x-origin.x,destination.y-origin.y);line.style.setProperty('--shot-length',length+'px');effect.append(line);layer.append(effect);
  effects.set(effect,setTimeout(()=>{
   line.remove();
   if(target){const i=targets.indexOf(target);if(i>=0){targets.splice(i,1);target.note.remove();}
    for(let i=0;i<8;i++){const angle=i*Math.PI/4,spark=svg('circle',{cx:destination.x,cy:destination.y,r:4,fill:['#E078A2','#48B8C3','#D2A536','#9876DD'][i%4]});spark.style.setProperty('--dx',Math.cos(angle)*25+'px');spark.style.setProperty('--dy',Math.sin(angle)*25+'px');spark.classList.add('lyrics-fun-spark');effect.append(spark);}
    effects.set(effect,setTimeout(()=>{clearEffect(effect);shotBusy=false;},400));
   }else{clearEffect(effect);shotBusy=false;}
  },300));
 }
 const safe=e=>e.target instanceof Element&&paper.contains(e.target)&&!e.target.closest('button,a,input,select,textarea,[role=button]');
 host.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0){gesture=null;return;}gesture=safe(e)?{id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),scroll:scrollY}:null;},{signal,passive:true});
 host.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture=null;},{signal,passive:true});
 host.addEventListener('pointerup',e=>{const g=gesture;gesture=null;if(g&&g.id===e.pointerId&&safe(e)&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=8&&performance.now()-g.time<450&&Math.abs(scrollY-g.scroll)<2)fire(e);},{signal,passive:true});
 host.addEventListener('pointercancel',()=>{gesture=null;},{signal,passive:true});
 window.addEventListener('scroll',()=>{gesture=null;dirty=true;},{signal,passive:true,capture:true});
 document.addEventListener('visibilitychange',()=>{gesture=null;dirty=true;cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(tick);},{signal});
 measure();enterPhase(0);frame=requestAnimationFrame(tick);
 const cleanup=()=>{stopped=true;abort.abort();observer.disconnect();cancelAnimationFrame(frame);removeWorm();for(const e of effects.keys())clearEffect(e);layer.remove();};
 cleanup.setLimit=value=>{const next=Math.max(1,Math.min(4,Number(value)||4));const previous=limit;limit=next;if(phase!==1&&next>previous)addFlights(next-previous);else while(targets.length>next)targets.pop().note.remove();if(!frame&&targets.length){last=0;frame=requestAnimationFrame(tick);}};
 return cleanup;
}
