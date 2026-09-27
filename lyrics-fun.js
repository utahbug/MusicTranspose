import {phaseNames,phaseDuration,laserPalette} from './lyrics-fun-ambient.js';
// Fair automatic target choice; use only the current, connected target list.
export function chooseFunTarget(entries,random=Math.random){return entries.length?entries[Math.floor(random()*entries.length)]:null;}
export function laserOrigin(width,height,random=Math.random){
 const left=random()<.5;return {x:left?0:width,y:height*(.55+random()*.35),edge:left?'left':'right'};
}
export function missEndpoint(origin,width,height,aim=null){
 const x=origin.edge==='left'?width:0;
 const y=aim&&Math.abs(aim.x-origin.x)>1?origin.y+(aim.y-origin.y)*(x-origin.x)/(aim.x-origin.x):origin.y;
 return {x,y:Math.max(8,Math.min(height-8,y))};
}
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
 let frame=0,gesture=null,stopped=false,last=0,bounds=null,shot=null,dirty=true,noteHeight=0;let limit=Math.max(1,Math.min(4,initialLimit));const targets=[],flights=[];
 let phase=0,phaseTime=0,phaseLength=phaseDuration(0),lastColor=-1;
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
 function addFlights(count,replacement=false){for(let i=0;i<count;i++){const flight=planFlight(flights);if(replacement)flight.delay=1000+Math.random()*1000;flight.duration=Math.min(flight.duration,Math.max(6000,phaseLength-phaseTime-flight.delay-50));if(phase===1)flight.curve=(Math.random()-.5)*.36;flights.push(flight);if(flights.length>4)flights.shift();spawn(flight);}}
 function measure(){
  if(!dirty)return;dirty=false;
  const r=paper.getBoundingClientRect(),body=paper.querySelector('.lyrics-body'),bodyRect=body.getBoundingClientRect();
  const footer=host.querySelector('.lyrics-footer'),viewport=window.visualViewport;
  const viewportTop=viewport?.offsetTop||0,viewportBottom=viewportTop+(viewport?.height||innerHeight);
  const top=Math.max(viewportTop+8,r.top+8),bottom=Math.min(viewportBottom-8,footer?footer.getBoundingClientRect().top-8:viewportBottom-8,r.bottom-8),height=Math.max(0,bottom-top);
  noteHeight=parseFloat(getComputedStyle(body).fontSize)*1.4;
  const usable=Math.max(0,height-noteHeight),middle=Math.min(usable*.5,Math.max(0,innerHeight/2-top-noteHeight/2));
  // Text is eligible, including wrapped titles and the notice before the first verse.
  // Once the header scrolls away, header-weighted flights use the visible upper area.
  const headerEnd=Math.max(0,Math.min(middle,bodyRect.top-top-noteHeight/2));
  const split=headerEnd>noteHeight/2?headerEnd:middle*.45;
  bounds={left:viewport?.offsetLeft||0,top,width:Math.min(innerWidth,viewport?.width||innerWidth),height,contentLeft:r.left+8-(viewport?.offsetLeft||0),contentWidth:Math.max(0,r.width-16),
   regions:{header:[0,split],upper:[split,middle],lower:[middle,usable]}};
  Object.assign(layer.style,{left:bounds.left+'px',top:top+'px',width:bounds.width+'px',height:height+'px'});
  layer.hidden=height<64||document.hidden;
 }
 const invalidate=()=>{dirty=true;};
 const observer=new ResizeObserver(invalidate);observer.observe(paper);observer.observe(paper.querySelector('.lyrics-body'));const footer=host.querySelector('.lyrics-footer');if(footer)observer.observe(footer);
 for(const event of ['resize','scroll'])window.visualViewport?.addEventListener(event,invalidate,{signal,passive:true});
 window.addEventListener('resize',invalidate,{signal,passive:true});
 function enterPhase(index){
  phase=index;phaseTime=0;phaseLength=phaseDuration(index);layer.dataset.phase=phaseNames[index];
  for(const t of targets)t.note.remove();targets.length=0;flights.length=0;
  addFlights(limit);
 }
 function tick(now){
  if(stopped)return;
  measure();
  const dt=last?Math.min(now-last,50):0;last=now;
  if(!layer.hidden){
   phaseTime+=dt;if(phaseTime>=phaseLength)enterPhase((phase+1)%phaseNames.length);
  }

  const h=noteHeight,w=h*44/56;
  for(const t of [...targets]){
   if(!layer.hidden&&!t.shot)t.elapsed+=dt;
   const f=t.flight,elapsed=t.elapsed-f.delay;
   if(elapsed<0)continue;
   if(elapsed>=f.duration&&!t.shot){targets.splice(targets.indexOf(t),1);t.note.remove();addFlights(1,true);continue;}
   t.active=true;t.note.hidden=false;t.note.style.display='';
   const progress=reduced.matches?.25:Math.min(1,elapsed/f.duration);
   const [low,high]=bounds.regions[f.region],startX=bounds.contentLeft+w/2+f.startX*Math.max(0,bounds.contentWidth-w);
   if(!t.shot)t.point={x:startX+(bounds.contentLeft+f.endX*bounds.contentWidth-startX)*progress,
    y:h/2+low+(f.startY+(f.endY-f.startY)*progress+Math.sin(progress*Math.PI)*f.curve)*(high-low)};
   Object.assign(t.note.style,{width:w+'px',height:h+'px',left:t.point.x-w/2+'px',top:t.point.y-h/2+'px'});
  }
  advanceShot(now);
  frame=requestAnimationFrame(tick);
 }
 // Selection is independent of the tap location; geometry still comes from painted targets.
 function pickTarget(){
  const r=layer.getBoundingClientRect();
  return chooseFunTarget(targets.filter(t=>t.active&&!t.shot&&t.note.isConnected).filter(t=>{const b=t.note.getBoundingClientRect();return b.width&&b.height&&b.right>r.left&&b.left<r.right&&b.bottom>r.top&&b.top<r.bottom;}));
 }
 function fire(){
  dirty=true;measure();if(layer.hidden||!bounds||shot)return;
  const target=pickTarget(),rect=target?.note.getBoundingClientRect(),r=layer.getBoundingClientRect();
  const aim=rect?{x:rect.x+rect.width/2-r.left,y:rect.y+rect.height/2-r.top}:null;
  const origin=laserOrigin(bounds.width,bounds.height),end=aim||missEndpoint(origin,bounds.width,bounds.height);
  if(target)target.shot=true;
  const palette=laserPalette[host.classList.contains('lyrics-dark')?'dark':'light'];
  let color=Math.floor(Math.random()*(palette.length-(lastColor<0?0:1)));if(lastColor>=0&&color>=lastColor)color++;lastColor=color;
  const effect=svg('svg',{class:'lyrics-fun-effect',width:'100%',height:'100%'});effect.dataset.origin=origin.edge;effect.dataset.shot=target?'hit':'miss';
  const line=svg('line',{x1:origin.x,y1:origin.y,x2:origin.x,y2:origin.y,stroke:palette[color],'stroke-width':1.8,'stroke-linecap':'round',class:'lyrics-fun-projectile'});effect.append(line);layer.append(effect);
  effects.set(effect,0);shot={effect,line,target,origin,start:origin,end,started:performance.now(),duration:650,point:origin};
 }
 function advanceShot(now){
  if(!shot)return;const s=shot;
  if(s.target&&(!s.target.note.isConnected||!targets.includes(s.target))){
   const removed=targets.indexOf(s.target);if(removed>=0){targets.splice(removed,1);s.target.note.remove();addFlights(1,true);}
   s.target=null;s.effect.dataset.shot='miss';s.start={...s.point};s.end=missEndpoint(s.origin,bounds.width,bounds.height,s.end);s.started=now;s.duration=Math.max(180,650*Math.abs(s.end.x-s.start.x)/Math.max(1,bounds.width));
  }
  const progress=Math.min(1,(now-s.started)/s.duration),dx=s.end.x-s.start.x,dy=s.end.y-s.start.y,length=Math.hypot(dx,dy)||1;
  const point={x:s.start.x+dx*progress,y:s.start.y+dy*progress};s.point=point;
  const trail=Math.min(18,length*progress);s.line.setAttribute('x1',point.x-dx/length*trail);s.line.setAttribute('y1',point.y-dy/length*trail);s.line.setAttribute('x2',point.x);s.line.setAttribute('y2',point.y);
  if(progress<1)return;
  shot=null;s.line.remove();
  if(s.target){const i=targets.indexOf(s.target);targets.splice(i,1);s.target.note.remove();addFlights(1,true);
   for(let i=0;i<8;i++){const angle=i*Math.PI/4,spark=svg('circle',{cx:point.x,cy:point.y,r:4,fill:['#E078A2','#48B8C3','#D2A536','#9876DD'][i%4]});spark.style.setProperty('--dx',Math.cos(angle)*25+'px');spark.style.setProperty('--dy',Math.sin(angle)*25+'px');spark.classList.add('lyrics-fun-spark');s.effect.append(spark);}effects.set(s.effect,setTimeout(()=>clearEffect(s.effect),400));
  }else clearEffect(s.effect);
 }
 const safe=e=>e.target instanceof Element&&paper.contains(e.target)&&!e.target.closest('button,a,input,select,textarea,[role=button]');
 host.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0){gesture=null;return;}gesture=safe(e)?{id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),scroll:scrollY}:null;},{signal,passive:true});
 host.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture=null;},{signal,passive:true});
 host.addEventListener('pointerup',e=>{const g=gesture;gesture=null;if(g&&g.id===e.pointerId&&safe(e)&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=8&&performance.now()-g.time<450&&Math.abs(scrollY-g.scroll)<2)fire(e);},{signal,passive:true});
 host.addEventListener('pointercancel',()=>{gesture=null;},{signal,passive:true});
 window.addEventListener('scroll',()=>{gesture=null;dirty=true;},{signal,passive:true,capture:true});
 document.addEventListener('visibilitychange',()=>{gesture=null;dirty=true;cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(tick);},{signal});
 measure();enterPhase(0);frame=requestAnimationFrame(tick);
 const cleanup=()=>{stopped=true;abort.abort();observer.disconnect();cancelAnimationFrame(frame);shot=null;for(const e of effects.keys())clearEffect(e);layer.remove();};
 cleanup.setLimit=value=>{const next=Math.max(1,Math.min(4,Number(value)||4));const previous=limit;limit=next;if(next>previous)addFlights(next-previous);else while(targets.length>next)targets.pop().note.remove();if(!frame&&targets.length){last=0;frame=requestAnimationFrame(tick);}};
 return cleanup;
}
