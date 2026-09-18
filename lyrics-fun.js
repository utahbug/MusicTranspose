// Decorative, view-scoped interaction. No lyric data or score dependencies.
export function createLyricsFun(host,paper,initialLimit=1){
 const abort=new AbortController(),signal=abort.signal,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.className='lyrics-fun-layer';layer.setAttribute('aria-hidden','true');host.append(layer);
 let frame=0,timer=0,gesture=null,stopped=false,last=0,bounds=null,shotBusy=false;let limit=Math.max(1,Math.min(4,initialLimit));const targets=[];
 const effects=new Map();
 const clearEffect=e=>{clearTimeout(effects.get(e));effects.delete(e);e.remove();};
 const svgNS='http://www.w3.org/2000/svg';
 const svg=(tag,attrs)=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
 function spawn(){
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
  targets.push({note,phase:Math.random()*Math.PI*2,upper:Math.random()<.8,point:{x:0,y:0}});layer.append(note);scheduleSpawn();
 }
 function scheduleSpawn(){clearTimeout(timer);timer=0;if(!stopped&&targets.length<limit)timer=setTimeout(()=>{timer=0;spawn();},2000+Math.random()*2000);}
 function tick(now){
  if(stopped)return;
  const r=paper.getBoundingClientRect(),body=paper.querySelector('.lyrics-body').getBoundingClientRect();
  const top=Math.max(0,body.top),bottom=Math.min(innerHeight,r.bottom-8),height=Math.max(0,bottom-top);
  bounds={left:r.left+8,top,width:Math.max(0,r.width-16),height};
  Object.assign(layer.style,{left:bounds.left+'px',top:top+'px',width:bounds.width+'px',height:height+'px'});
  layer.hidden=height<64||document.hidden;
  const dt=last?Math.min(now-last,50):0;last=now;
  const h=parseFloat(getComputedStyle(paper.querySelector('.lyrics-body')).fontSize)*1.4,w=h*44/56;
  for(const t of targets){if(!reduced.matches&&!document.hidden&&!t.shot)t.phase+=dt*.00022;
   t.point={x:Math.min(bounds.width/2,42)+(Math.sin(t.phase)+1)/2*Math.max(0,bounds.width-84),y:30+(Math.sin(t.phase*.7)+1)/2*Math.max(0,Math.min(height*(t.upper?.45:.72),t.upper?250:420)-60)};
   Object.assign(t.note.style,{width:w+'px',height:h+'px',left:t.point.x-w/2+'px',top:t.point.y-h/2+'px'});
  }
  frame=requestAnimationFrame(tick);
 }
 function fire(){
  if(layer.hidden||!bounds||shotBusy)return;shotBusy=true;
  const target=targets.length?targets[Math.floor(Math.random()*targets.length)]:null,hit=!!target;
  if(target)target.shot=true;
  const side=Math.random()<.5?'left':'right',origin={x:side==='left'?0:bounds.width,y:30+Math.random()*Math.max(0,bounds.height*.42-60)};
  // Free shots cross the opposite edge; they never stop in the middle of the lyrics.
  const destination=hit?{...target.point}:{x:side==='left'?bounds.width+24:-24,y:20+Math.random()*Math.max(0,bounds.height*.7-40)};
  const effect=svg('svg',{class:'lyrics-fun-effect',width:'100%',height:'100%'});effect.dataset.origin=side;effect.dataset.shot=hit?'hit':'free';
  const line=svg('line',{x1:origin.x,y1:origin.y,x2:destination.x,y2:destination.y,stroke:'var(--fun-beam)','stroke-width':3,'stroke-linecap':'round',class:'lyrics-fun-projectile'}),length=Math.hypot(destination.x-origin.x,destination.y-origin.y);line.style.setProperty('--shot-length',length);line.style.setProperty('--shot-dash',Math.min(38,length*.3));effect.append(line);layer.append(effect);
  effects.set(effect,setTimeout(()=>{
   line.remove();
   if(hit){const i=targets.indexOf(target);if(i>=0){targets.splice(i,1);target.note.remove();scheduleSpawn();}
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
 spawn();frame=requestAnimationFrame(tick);
 const cleanup=()=>{stopped=true;abort.abort();cancelAnimationFrame(frame);clearTimeout(timer);for(const e of effects.keys())clearEffect(e);layer.remove();};
 cleanup.setLimit=value=>{limit=Math.max(1,Math.min(4,Number(value)||1));while(targets.length>limit)targets.pop().note.remove();scheduleSpawn();};
 return cleanup;
}
