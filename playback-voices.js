// Piano recipes adapted from PrimarySongs script-v528.js, commit
// 610a1eb02cd3b68941919c2e30c0c2de07461827: createPianoVoice/releasePianoVoice.
// Scheduled note ends replace keyboard pointer release; no pedal or extra clock.
export const playbackSounds={'grand-piano':'Grand piano','electric-piano':'Electric piano','simple-tone':'Simple tone'};
export function configurePlaybackOutput(master,compressor,sound){
 master.gain.value=.35;
 const values=sound==='simple-tone'?[-24,30,12,.003,.25]:[-18,16,5,.004,.2];
 ['threshold','knee','ratio','attack','release'].forEach((name,i)=>compressor[name].value=values[i]);
}
const noiseBuffers=new WeakMap();
export function createScoreVoice(context,destination,midi,start,duration,sound,onEnd=()=>{}){
 const sources=[],nodes=[];let ended=0,disposed=false;
 const frequency=440*2**((midi-69)/12),off=start+duration;
 const dispose=()=>{if(disposed)return;disposed=true;for(const source of sources){source.onended=null;try{source.stop();}catch{}}for(const node of nodes)node.disconnect();onEnd();};
 const track=(source,...other)=>{sources.push(source);nodes.push(source,...other);source.onended=()=>{if(++ended===sources.length)dispose();};};
 if(sound==='simple-tone'){
  const osc=context.createOscillator(),gain=context.createGain();osc.type='triangle';osc.frequency.value=frequency;osc.connect(gain);gain.connect(destination);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.13,start+.008);gain.gain.exponentialRampToValueAtTime(.035,start+Math.max(.02,duration*.8));gain.gain.linearRampToValueAtTime(0,off+.025);
  track(osc,gain);osc.start(start);osc.stop(off+.03);return {dispose};
 }
 // Balance the richer partial sums against the legacy single oscillator for chords.
 const scale=.22,release=sound==='electric-piano'?.11:.055;
 const addTone=(ratio,type,level,attack,decay,sustain=.0001,detune=0)=>{
  const osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.value=frequency*ratio;osc.detune.value=detune;
  const a=Math.max(.004,attack),d=Math.max(attack+.02,decay),end=Math.min(duration,d);
  const levelAt=t=>t<a?.0001*(level/.0001)**(t/a):level*(sustain/level)**(Math.min(1,(t-a)/(d-a)));
  gain.gain.setValueAtTime(.0001*scale,start);
  gain.gain.exponentialRampToValueAtTime(levelAt(Math.min(duration,a))*scale,start+Math.min(duration,a));
  if(end>a)gain.gain.exponentialRampToValueAtTime(levelAt(end)*scale,start+end);
  gain.gain.setValueAtTime(levelAt(duration)*scale,off);
  gain.gain.setTargetAtTime(.0001*scale,off,release);
  osc.connect(gain);gain.connect(destination);track(osc,gain);osc.start(start);osc.stop(off+release*5);
 };
 if(sound==='electric-piano'){
  addTone(1,'sine',.31,.004,2.1,.0001,-7);addTone(1,'sine',.22,.004,1.8,.0001,7);
  addTone(2.01,'sine',.17,.002,1.15);addTone(3.98,'sine',.075,.001,.55);addTone(7.96,'sine',.025,.001,.22);
 }else{
  // Primary's held-chord envelope supports long/tied written notes, not pedal sustain.
  const held=duration>1.35;
  addTone(1,'triangle',.36,.003,held?2.4:1.35,held?.035:.0001,-3);
  addTone(1,'sine',.2,.002,held?2.1:1.05,held?.025:.0001,3);
  addTone(2,'sine',.11,.001,held?1.25:.5,held?.008:.0001,-4);addTone(3,'sine',.04,.001,.24,.0001,5);
  if(!noiseBuffers.has(context)){const n=Math.ceil(context.sampleRate*.035),buffer=context.createBuffer(1,n,context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n);noiseBuffers.set(context,buffer);}
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noiseBuffers.get(context);filter.type='lowpass';filter.frequency.value=4200;
  gain.gain.setValueAtTime(.035*scale,start);gain.gain.exponentialRampToValueAtTime(.0001*scale,start+.035);
  source.connect(filter);filter.connect(gain);gain.connect(destination);track(source,filter,gain);source.start(start);source.stop(start+.035);
 }
 return {dispose};
}
