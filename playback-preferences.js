// Contextual sound choices use the existing playback preference and engine.
export function initPlaybackPreferences(playback){
 const choices=[...document.querySelectorAll('[data-sound]')];
 const sync=()=>{for(const choice of choices)choice.setAttribute('aria-checked',String(choice.dataset.sound===playback.sound));};
 for(const choice of choices)choice.onclick=()=>{playback.setSound(choice.dataset.sound);sync();};
 sync();
}
