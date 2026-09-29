// Display-only ink occupancy. Never edit the PDF canvas, crop, scale or page count.
const maps=new WeakMap(),cell=4;
function inkMap(canvas){
 let map=maps.get(canvas);if(map)return map;
 const width=Math.ceil(canvas.width/cell),height=Math.ceil(canvas.height/cell),stride=width+1;
 const occupied=new Uint8Array(width*height),data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const i=(y*canvas.width+x)*4;
  if(data[i+3]&&(data[i]<255||data[i+1]<255||data[i+2]<255))occupied[Math.floor(y/cell)*width+Math.floor(x/cell)]=1;
 }
 const sums=new Uint32Array(stride*(height+1));
 for(let y=1;y<=height;y++){let row=0;for(let x=1;x<=width;x++){row+=occupied[(y-1)*width+x-1];sums[y*stride+x]=sums[(y-1)*stride+x]+row;}}
 map={width,height,stride,sums};maps.set(canvas,map);return map;
}
export function clearPdfCounterPosition(canvas,frame,size,blocked){
 if(frame.width<size.width+16||frame.height<size.height+16)return null;
 const map=inkMap(canvas),r=canvas.getBoundingClientRect(),sx=canvas.width/r.width,sy=canvas.height/r.height,pad=3;
 const clear=(x,y)=>{
  if(blocked&&x+size.width+pad>blocked.left&&x-pad<blocked.right&&y+size.height+pad>blocked.top&&y-pad<blocked.bottom)return false;
  const x0=Math.max(0,Math.floor((x-pad-r.left)*sx/cell)),y0=Math.max(0,Math.floor((y-pad-r.top)*sy/cell));
  const x1=Math.min(map.width,Math.ceil((x+size.width+pad-r.left)*sx/cell)),y1=Math.min(map.height,Math.ceil((y+size.height+pad-r.top)*sy/cell));
  const {sums:s,stride:w}=map;return s[y1*w+x1]-s[y0*w+x1]-s[y1*w+x0]+s[y0*w+x0]===0;
 };
 // Nearest clear rectangle to bottom-right. Prefer a small upward move to a large inward move.
 if(clear(frame.right-8-size.width,frame.bottom-8-size.height))return {right:8,bottom:8};
 const maxRight=frame.width-size.width-8,maxBottom=frame.height-size.height-8;
 for(let cost=2;cost<=2*(maxRight-8)+maxBottom-8;cost+=2){
  for(let right=8;right<=Math.min(maxRight,8+cost/2);right+=2){
   const bottom=8+cost-2*(right-8);if(bottom>maxBottom)continue;
   if(clear(frame.right-right-size.width,frame.bottom-bottom-size.height))return {right,bottom};
  }
 }
 // An entirely occupied page must not get an overlay that obscures its content.
 return null;
}
