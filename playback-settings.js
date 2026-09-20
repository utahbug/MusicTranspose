// Compact playback-only controls. No score metadata or notation is modified.
export function initPlaybackSettings(playback,available){
 const $=id=>document.getElementById(id),section=$('playback-settings');let revision=0;
 function update(){const t=playback.tempo;$('tempo-value').textContent=Math.round(t.bpm)+' BPM';$('tempo-original').textContent=(t.fallback?'Default: ':'Original: ')+Math.round(t.original)+' BPM';$('tempo-down').disabled=t.bpm<=t.min;$('tempo-up').disabled=t.bpm>=t.max;$('tempo-reset').disabled=Math.abs(t.rate-1)<.0001;}
 $('settings').addEventListener('click',async()=>{const token=++revision;section.hidden=!available();if(section.hidden)return;$('tempo-value').textContent='…';for(const id of ['tempo-down','tempo-up','tempo-reset'])$(id).disabled=true;try{await playback.prepare();if(token===revision&&available())update();}catch{if(token===revision)section.hidden=true;}});
 $('settings-dialog').addEventListener('close',()=>revision++);
 for(const [id,delta] of [['tempo-down',-4],['tempo-up',4]])$(id).onclick=()=>{playback.setTempo(playback.tempo.bpm+delta);update();};
 $('tempo-reset').onclick=()=>{playback.setTempo(playback.tempo.original);update();};
}
