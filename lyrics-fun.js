// Decorative, view-scoped interaction. No lyric data or score dependencies.
export function createLyricsFun(host,paper){
 const abort=new AbortController(),signal=abort.signal,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('div');layer.className='lyrics-fun-layer';layer.setAttribute('aria-hidden','true');host.append(layer);
 let frame=0,timer=0,effectTimer=0,note=null,gesture=null,stopped=false,phase=0,last=0,point={x:0,y:0},bounds=null;
 const svgNS='http://www.w3.org/2000/svg';
 const svg=(tag,attrs)=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
 function spawn(){
  if(stopped||note)return;
  const type=['half','quarter','eighth','sixteenth','beamed-eighth','beamed-sixteenth'][Math.floor(Math.random()*6)];
  note=svg('svg',{viewBox:'0 0 44 56',class:'lyrics-fun-note','data-note-type':type});
  if(type.startsWith('beamed-')){
   for(const [x,y] of [[10,43],[33,38]])note.append(svg('ellipse',{cx:x,cy:y,rx:7,ry:5,transform:`rotate(-20 ${x} ${y})`,fill:'currentColor'}));
   note.append(svg('path',{d:'M16 42V10L39 5V37',fill:'none',stroke:'currentColor','stroke-width':2.5}),svg('path',{d:'M16 10L39 5V10L16 15Z',fill:'currentColor'}));
   if(type==='beamed-sixteenth')note.append(svg('path',{d:'M16 19L39 14V18L16 23Z',fill:'currentColor'}));
  }else{
  note.append(svg('ellipse',{cx:15,cy:43,rx:9,ry:6,transform:'rotate(-20 15 43)',fill:type==='half'?'none':'currentColor',stroke:'currentColor','stroke-width':3}),svg('path',{d:'M23 42V7',fill:'none',stroke:'currentColor','stroke-width':3}));
  if(type==='eighth'||type==='sixteenth')note.append(svg('path',{d:'M24 8 Q43 18 30 29 Q35 20 24 18Z',fill:'currentColor'}));
  if(type==='sixteenth')note.append(svg('path',{d:'M24 19 Q43 29 30 40 Q35 31 24 29Z',fill:'currentColor'}));
  }
  phase=Math.random()*Math.PI*2;layer.append(note);
 }
 function tick(now){
  if(stopped)return;
  const r=paper.getBoundingClientRect(),body=paper.querySelector('.lyrics-body').getBoundingClientRect();
  const top=Math.max(0,body.top),bottom=Math.min(innerHeight,r.bottom-8),height=Math.max(0,bottom-top);
  bounds={left:r.left+8,top,width:Math.max(0,r.width-16),height};
  Object.assign(layer.style,{left:bounds.left+'px',top:top+'px',width:bounds.width+'px',height:height+'px'});
  layer.hidden=height<64||document.hidden;
  if(last&&!reduced.matches&&!document.hidden)phase+=Math.min(now-last,50)*0.00022;
  last=now;
  point={x:24+(Math.sin(phase)+1)/2*Math.max(0,bounds.width-48),y:30+(Math.sin(phase*.7)+1)/2*Math.max(0,Math.min(height*.45,230)-60)};
  if(note)Object.assign(note.style,{left:point.x-22+'px',top:point.y-28+'px'});
  frame=requestAnimationFrame(tick);
 }
 function fire(){
  if(!note||layer.hidden||!bounds)return;
  note.remove();note=null;
  const effect=svg('svg',{class:'lyrics-fun-effect',width:'100%',height:'100%'}),side=Math.random()<.5?'left':'right';effect.dataset.origin=side;
  effect.append(svg('line',{x1:side==='left'?0:bounds.width,y1:point.y+25,x2:point.x,y2:point.y,stroke:'var(--fun-beam)','stroke-width':3,'stroke-linecap':'round',class:'lyrics-fun-beam'}));
  for(let i=0;i<8;i++){const angle=i*Math.PI/4,spark=svg('circle',{cx:point.x,cy:point.y,r:4,fill:['#E078A2','#48B8C3','#D2A536','#9876DD'][i%4]});spark.style.setProperty('--dx',Math.cos(angle)*25+'px');spark.style.setProperty('--dy',Math.sin(angle)*25+'px');spark.classList.add('lyrics-fun-spark');effect.append(spark);}
  layer.append(effect);effectTimer=setTimeout(()=>effect.remove(),400);
  timer=setTimeout(spawn,5000+Math.random()*5000);
 }
 const safe=e=>e.target instanceof Element&&paper.contains(e.target)&&!e.target.closest('button,a,input,select,textarea,[role=button]');
 host.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0){gesture=null;return;}gesture=safe(e)?{id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),scroll:scrollY}:null;},{signal,passive:true});
 host.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8)gesture=null;},{signal,passive:true});
 host.addEventListener('pointerup',e=>{const g=gesture;gesture=null;if(g&&g.id===e.pointerId&&safe(e)&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<=8&&performance.now()-g.time<450&&Math.abs(scrollY-g.scroll)<2)fire();},{signal,passive:true});
 host.addEventListener('pointercancel',()=>{gesture=null;},{signal,passive:true});
 window.addEventListener('scroll',()=>{gesture=null;},{signal,passive:true,capture:true});
 document.addEventListener('visibilitychange',()=>{gesture=null;cancelAnimationFrame(frame);last=0;if(!document.hidden)frame=requestAnimationFrame(tick);},{signal});
 spawn();frame=requestAnimationFrame(tick);
 return ()=>{stopped=true;abort.abort();cancelAnimationFrame(frame);clearTimeout(timer);clearTimeout(effectTimer);layer.remove();};
}
