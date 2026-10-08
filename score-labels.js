export const meaningfulNumber=s=>[s?.songNumber,s?.page].map(v=>String(v??'').trim()).find(v=>/^\d+[a-z]?$/i.test(v)&&parseInt(v,10)>0)||'';
export const meaningfulSource=s=>{const v=String(s?.collection??'').trim();return /^(?:<.*>|song|xxx|unknown|undefined|null|default)$/i.test(v)?'':v;};
export const scoreMetadata=s=>[meaningfulSource(s),meaningfulNumber(s)].filter(Boolean).join(' · ');
