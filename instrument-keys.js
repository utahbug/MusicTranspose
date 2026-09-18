import {buildKeys,signature} from './music.js';
const groups=[
 {label:'Concert pitch',examples:'Violin · Viola · Cello · Flute · Oboe · Bassoon · Trombone',semitones:0},
 {label:'B♭ instruments',examples:'Clarinet · Trumpet · Tenor Sax',semitones:2},
 {label:'E♭ instruments',examples:'Alto Sax · Baritone Sax',semitones:9},
 {label:'F instruments',examples:'French Horn',semitones:7}
];
export function instrumentKeys(concert){
 const pc=((7*concert.fifths+(concert.mode==='minor'?9:0))%12+12)%12;
 const keys=buildKeys({...concert,pc});
 return groups.map(group=>({...group,key:keys.find(k=>k.shift===(group.semitones>6?group.semitones-12:group.semitones))}));
}
export const instruments=[...['Violin','Viola','Cello','Flute','Oboe','Bassoon','Trombone'].map(name=>({name,group:0})),...['Clarinet','Trumpet','Tenor Sax'].map(name=>({name,group:1})),...['Alto Sax','Baritone Sax'].map(name=>({name,group:2})),{name:'French Horn',group:3}];
export function rankEnsembleKeys(keys,names){
 const players=instruments.filter(i=>names.includes(i.name));if(!players.length)return [];
 const ranked=keys.map(key=>{const written=instrumentKeys(key),counts=[Math.abs(key.fifths),...players.map(i=>Math.abs(written[i.group].key.fifths))],max=Math.max(...counts),total=counts.reduce((a,b)=>a+b,0),distance=Math.abs(key.shift),penalty=counts.reduce((sum,n)=>sum+(n>=6?20*(n-5)**2:0),0);return {key,max,total,distance,score:4*max+total+1.5*distance+penalty};}).sort((a,b)=>a.score-b.score||a.distance-b.distance||a.max-b.max||a.total-b.total||a.key.shift-b.key.shift);
 const seen=new Set();return ranked.filter(r=>{const pc=((7*r.key.fifths+(r.key.mode==='minor'?9:0))%12+12)%12;if(seen.has(pc))return false;seen.add(pc);return true;});
}
const $=id=>document.getElementById(id);let selected=[];try{const saved=JSON.parse(localStorage.getItem('music-transpose-ensemble-v1')||'[]');if(Array.isArray(saved))selected=instruments.filter(i=>saved.includes(i.name)).map(i=>i.name);}catch{}
let current,choices=[],selectKey;
function persist(){try{localStorage.setItem('music-transpose-ensemble-v1',JSON.stringify(selected));}catch{}}
function render(){if(!current)return;
 const original=choices.find(k=>k.shift===0);$('ensemble-context').textContent=`Original: ${original.name} ${original.mode} · Current: ${current.name} ${current.mode}`;
 $('ensemble-summary').textContent=selected.length?selected.join(' · '):'Piano only';
 const recommendations=rankEnsembleKeys(choices,selected).slice(0,3);$('ensemble-recommendations').hidden=!recommendations.length;
 $('ensemble-choices').replaceChildren(...recommendations.map(({key,max,distance})=>{const b=document.createElement('button');b.className='quiet';b.setAttribute('aria-label',`${key.name} ${key.mode}, ${Math.abs(key.fifths)} accidentals, ${key.shift} semitones from original`);b.setAttribute('aria-pressed',String(key.shift===current.shift));b.textContent=`${key.name} ${signature(key)} · ${key.shift===0?'Original':(key.shift>0?'+':'')+key.shift}`;b.title=`At most ${max} sharps/flats per player; ${distance} semitones from original`;b.onclick=()=>selectKey(key.shift);return b;}));
 $('instrument-concert').textContent=`Concert key: ${current.name} ${current.mode}`;
 const written=instrumentKeys(current),rows=selected.length&&!$('instrument-all').checked?instruments.filter(i=>selected.includes(i.name)).map(i=>({label:i.name,examples:'',key:written[i.group].key})):written;
 $('instrument-rows').replaceChildren(...rows.map(({label,examples,key})=>{const row=document.createElement('div');row.className='instrument-row';const description=document.createElement('div'),heading=document.createElement('strong'),names=document.createElement('small');heading.textContent=label;names.textContent=examples;description.append(heading,names);const value=document.createElement('div');value.className='instrument-written';const name=document.createElement('strong'),sig=document.createElement('span');name.textContent=key.name+' '+key.mode;sig.className='signature';sig.textContent=signature(key);sig.setAttribute('aria-label',`${Math.abs(key.fifths)} ${key.fifths<0?'flats':'sharps'}`);value.append(name,sig);row.append(description,value);return row;}));
}
export function showInstrumentKeys(concert,keys){current=concert;choices=keys;render();}
export function initEnsemble(onSelect){selectKey=onSelect;const dialog=$('key-dialog');let trigger;
 function close(focus=false){$('ensemble-picker').hidden=true;$('instrument-panel').hidden=true;for(const id of ['ensemble-toggle','instrument-toggle'])$(id).setAttribute('aria-expanded','false');if(focus)trigger?.focus();}
 for(const [button,panel] of [['ensemble-toggle','ensemble-picker'],['instrument-toggle','instrument-panel']])$(button).onclick=()=>{const opening=$(panel).hidden;close();if(opening){trigger=$(button);$(panel).hidden=false;trigger.setAttribute('aria-expanded','true');$(panel).querySelector('button,input').focus();}};
 for(const i of instruments){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=i.name;input.checked=selected.includes(i.name);input.onchange=()=>{selected=[...$('ensemble-instruments').querySelectorAll(':checked')].map(e=>e.value);persist();render();};label.append(input,document.createTextNode(i.name));$('ensemble-instruments').append(label);}
 $('ensemble-clear').onclick=()=>{selected=[];for(const input of $('ensemble-instruments').querySelectorAll('input'))input.checked=false;persist();render();};
 $('instrument-all').onchange=render;
 for(const b of dialog.querySelectorAll('[data-close-ensemble]'))b.onclick=()=>close(true);
 dialog.addEventListener('pointerdown',e=>{if(!e.target.closest('.ensemble-overlay,#ensemble-toggle,#instrument-toggle'))close();});
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&(!$('ensemble-picker').hidden||!$('instrument-panel').hidden)){e.preventDefault();e.stopPropagation();close(true);}});
 dialog.addEventListener('focusin',e=>{const panel=[$('ensemble-picker'),$('instrument-panel')].find(p=>!p.hidden);if(panel&&!panel.contains(e.target)&&e.target!==trigger)close();});
 dialog.addEventListener('close',()=>close());return close;
}
