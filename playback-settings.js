// Settings edits stay in form controls until Apply dispatches their existing handlers.
export function initPlaybackSettings(playback){
 const $=id=>document.getElementById(id),panel=$('settings-dialog'),styleKey='music-transpose-metronome-style-v1';
 let snapshot=null,applying=false;
 $('playback-sound').value=playback.sound;
 $('playback-sound').onchange=()=>playback.setSound($('playback-sound').value);
 const styles=['side-pulse'];let style='side-pulse';try{const saved=localStorage.getItem(styleKey);if(styles.includes(saved))style=saved;}catch{}
 $('metronome-style').value=style;$('metronome-style').onchange=()=>{style=$('metronome-style').value;try{localStorage.setItem(styleKey,style);}catch{}};
 const fields=()=>[...panel.querySelectorAll('input,select')];
 const value=e=>e.type==='checkbox'||e.type==='radio'?e.checked:e.value;
 const put=(e,v)=>{if(e.type==='checkbox'||e.type==='radio')e.checked=v;else e.value=v;};
 function preview(){const mode=panel.querySelector('input[name=navigation]:checked')?.value;$('auto-options').hidden=mode!=='auto';$('speed-value').textContent=$('scroll-speed').value+' px/s';}
 // Observe showModal after the existing opener has refreshed committed navigation values.
 new MutationObserver(()=>{if(!panel.open)return;$('playback-sound').value=playback.sound;$('metronome-style').value=style;snapshot=fields().map(e=>[e,value(e)]);preview();}).observe(panel,{attributes:true,attributeFilter:['open']});
 for(const event of ['input','change'])panel.addEventListener(event,e=>{if(!panel.open||applying||!e.target.matches('input,select'))return;e.stopImmediatePropagation();preview();},true);
 function discard(){if(snapshot)for(const [e,v] of snapshot)put(e,v);snapshot=null;preview();}
 panel.addEventListener('close',discard);
 panel.addEventListener('cancel',()=>discard());
 panel.addEventListener('click',e=>{if(e.target!==panel)return;const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){discard();panel.close();}});
 $('close-settings').onclick=()=>{discard();panel.close();};
 $('apply-settings').onclick=()=>{
  const draft=fields().map(e=>[e,value(e)]),changed=draft.filter(([e,v])=>snapshot?.find(([field])=>field===e)?.[1]!==v);
  applying=true;
  try{for(const [e,v] of changed){put(e,v);if(e.type==='radio'&&!v)continue;e.dispatchEvent(new Event(e.type==='range'?'input':'change',{bubbles:true}));}
   // Navigation sync may refresh other controls while its change handler runs.
   for(const [e,v] of draft)put(e,v);$('metronome-style').onchange();snapshot=null;panel.close();
  }finally{applying=false;}
 };
}
