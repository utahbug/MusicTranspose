// Small, renderer-independent motion helpers for the existing Lyrics Fun overlay.
export const phaseNames=['notes','worm','variation','notes-return'];
export const phaseDuration=index=>index===0?22000+Math.random()*6000:32000+Math.random()*10000;
export const laserPalette={light:['#526F92','#377F80','#79658E','#A65F66','#997338','#557D60'],dark:['#91AEC9','#80B6B3','#B09BC4','#D2989E','#C9AE78','#96B89D']};
const range=(a,b)=>a+Math.random()*(b-a),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function createWorm(width,height,font){
 const size=font*.3,spacing=font*.55,margin=Math.max(12,size*1.5),count=clamp(Math.round(width*.8/spacing)+1,4,96);
 const w={width,height,size,spacing,count,x:range(margin,width-margin),y:range(margin,height-margin),angle:range(-Math.PI,Math.PI),speed:font*range(1.1,1.8),font,fullCount:count,age:0,turnIn:0,exitAfter:range(16,24),trail:[],margin,escaped:false};
 // A short randomized prehistory makes the initial chain coherent, not piled up.
 let x=w.x,y=w.y,a=w.angle+Math.PI;
 for(let i=0;i<Math.ceil((count-1)*spacing/2)+3;i++){
  w.trail.push({x,y});if(i%8===0)a+=range(-.35,.35);
  let nx=x+Math.cos(a)*2,ny=y+Math.sin(a)*2;
  if(nx<margin||nx>width-margin){a=Math.PI-a;nx=clamp(nx,margin,width-margin);}
  if(ny<margin||ny>height-margin){a=-a;ny=clamp(ny,margin,height-margin);}x=nx;y=ny;
 }
 return w;
}
export function wormPoints(w){
 const path=[{x:w.x,y:w.y},...w.trail],points=[path[0]];let traversed=0,next=w.spacing;
 for(let i=1;i<path.length&&points.length<w.count;i++){
  const a=path[i-1],b=path[i],distance=Math.hypot(b.x-a.x,b.y-a.y);
  while(distance>0&&next<=traversed+distance&&points.length<w.count){const f=(next-traversed)/distance;points.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f});next+=w.spacing;}traversed+=distance;
 }
 return points;
}
export function stepWorm(w,dt,reduced=false){
 if(reduced)return;
 w.age+=dt;w.turnIn-=dt;
 if(w.turnIn<=0||!w.target||Math.hypot(w.target.x-w.x,w.target.y-w.y)<20){
  w.turnIn=range(1.5,3.5);w.target={x:range(w.margin,w.width-w.margin),y:range(w.margin,w.height-w.margin)};
  w.turnRate=Math.random()<.2?4:range(1.1,2.4);w.speed=w.font*range(1.1,1.8);
 }
 if(w.age>=w.exitAfter&&!w.exit){const side=Math.floor(Math.random()*4);w.exit={x:side===0?-60:side===1?w.width+60:range(0,w.width),y:side===2?-60:side===3?w.height+60:range(0,w.height)};}
 const target=w.exit||w.target,desired=Math.atan2(target.y-w.y,target.x-w.x),difference=Math.atan2(Math.sin(desired-w.angle),Math.cos(desired-w.angle));
 w.angle+=clamp(difference,-w.turnRate*dt,w.turnRate*dt);w.x+=Math.cos(w.angle)*w.speed*dt;w.y+=Math.sin(w.angle)*w.speed*dt;
 if(!w.exit){if(w.x<w.margin||w.x>w.width-w.margin){w.x=clamp(w.x,w.margin,w.width-w.margin);w.angle=Math.PI-w.angle;w.turnIn=0;}if(w.y<w.margin||w.y>w.height-w.margin){w.y=clamp(w.y,w.margin,w.height-w.margin);w.angle=-w.angle;w.turnIn=0;}}
 if(Math.hypot(w.x-w.trail[0].x,w.y-w.trail[0].y)>=2)w.trail.unshift({x:w.x,y:w.y});
 w.trail.length=Math.min(w.trail.length,Math.ceil(w.count*w.spacing/2)+8,1024);
 w.escaped=w.x< -w.size||w.x>w.width+w.size||w.y< -w.size||w.y>w.height+w.size;
}
export function wormHit(w,point){
 const points=wormPoints(w);let index=-1,distance=Math.max(12,w.size*1.5);
 points.forEach((p,i)=>{const d=Math.hypot(point.x-p.x,point.y-p.y);if(d<distance){index=i;distance=d;}});
 return index<0?null:{index,point:points[index]};
}
export function shortenWorm(w){w.count=Math.max(1,w.count-1);}

export function resizeWorm(w,width,height,font){
 const sx=width/w.width,sy=height/w.height,scale=p=>{p.x*=sx;p.y*=sy;};
 scale(w);for(const p of w.trail)scale(p);if(w.target)scale(w.target);if(w.exit)scale(w.exit);
 const headOnly=w.count===1,fraction=w.count/w.fullCount;
 w.width=width;w.height=height;w.font=font;w.size=font*.3;w.spacing=font*.55;w.margin=Math.max(12,w.size*1.5);
 w.fullCount=clamp(Math.round(width*.8/w.spacing)+1,4,96);w.count=headOnly?1:Math.max(1,Math.round(w.fullCount*fraction));
}
