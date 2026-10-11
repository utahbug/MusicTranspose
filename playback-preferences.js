// One engine preference; register rebuilt Lyrics choices and release old nodes.
export function initPlaybackPreferences(playback){
 const groups=new Set();
 const sync=()=>{for(const root of groups)for(const choice of root.querySelectorAll('[data-sound]'))choice.setAttribute('aria-checked',String(choice.dataset.sound===playback.sound));};
 function bind(root){
  groups.add(root);
  for(const choice of root.querySelectorAll('[data-sound]'))choice.onclick=()=>playback.setSound(choice.dataset.sound);
  sync();return ()=>groups.delete(root);
 }
 document.addEventListener('playback-sound-changed',sync);
 bind(document.getElementById('score-sound-options'));
 return {bind};
}
