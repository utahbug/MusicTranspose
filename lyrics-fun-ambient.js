// Small, renderer-independent motion helpers for the existing Lyrics Fun overlay.
export const phaseNames=['notes','variation','notes-return'];
export const phaseDuration=index=>index===0?22000+Math.random()*6000:32000+Math.random()*10000;
export const laserPalette={light:['#526F92','#377F80','#79658E','#A65F66','#997338','#557D60'],dark:['#91AEC9','#80B6B3','#B09BC4','#D2989E','#C9AE78','#96B89D']};
