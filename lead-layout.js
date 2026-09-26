// Lead-only engraving policy. Restore every touched rule when the shared
// engraver returns to Score, including values cached by the engine on load.
const originals=new WeakMap();
const profile={MinimumDistanceBetweenSystems:3,MinSkyBottomDistBetweenSystems:2.5,VoiceSpacingAddendVexflow:2,VoiceSpacingMultiplierVexflow:.75,MinNoteDistance:1.7};
export function applyLeadLayout(engraver,enabled,{print=false}={}){
 const rules=engraver.EngravingRules;
 if(!originals.has(engraver))originals.set(engraver,Object.fromEntries([...Object.keys(profile),'PageLeftMargin','PageRightMargin','PageTopMargin','PageBottomMargin','NewSystemAtXMLNewSystemAttribute'].map(k=>[k,rules[k]])));
 Object.assign(rules,originals.get(engraver));
 if(enabled)Object.assign(rules,profile,{PageLeftMargin:print?2:.6,PageRightMargin:print?2:.6,...(print?{PageTopMargin:3,PageBottomMargin:3}:{})});
}

// Rebalance only a genuinely sparse final line. Costs come from the engine's
// lyric/chord-aware minimum measure widths, not a fixed measures-per-line rule.
export function balanceLeadTail(engraver){
 const systems=engraver.GraphicSheet.MusicPages.flatMap(p=>p.MusicSystems),source=engraver.Sheet.SourceMeasures;
 if(systems.length<2)return false;
 const measures=s=>s.GraphicalMeasures.map(row=>row[0]);
 const width=m=>m.minimumStaffEntriesWidth+m.beginInstructionsWidth+m.endInstructionsWidth;
 const left=measures(systems.at(-2)),right=measures(systems.at(-1)),all=[...left,...right];
 const sum=ms=>ms.reduce((n,m)=>n+width(m),0),oldLeft=sum(left),oldRight=sum(right);
 if(!Number.isFinite(oldLeft+oldRight)||oldRight>=oldLeft*.7||left.length<2)return false;
 let cut=left.length,cost=Math.abs(oldLeft-oldRight);
 for(let i=1;i<left.length;i++){const a=sum(all.slice(0,i)),b=sum(all.slice(i));if(b<=oldLeft&&Math.abs(a-b)<cost){cost=Math.abs(a-b);cut=i;}}
 if(cut===left.length)return false;
 const starts=systems.slice(1,-1).map(s=>measures(s)[0].parentSourceMeasure);
 starts.push(all[cut].parentSourceMeasure);
 for(const m of source)m.printNewSystemXml=starts.includes(m);
 engraver.EngravingRules.NewSystemAtXMLNewSystemAttribute=true;engraver.render();
 const count=engraver.GraphicSheet.MusicPages.reduce((n,p)=>n+p.MusicSystems.length,0);
 // A new clef/key or ending may need more room than estimated. Retain the
 // original automatic wrap if balancing would introduce another system.
 if(count!==systems.length){for(const m of source)m.printNewSystemXml=false;engraver.EngravingRules.NewSystemAtXMLNewSystemAttribute=false;engraver.render();return false;}
 return true;
}

// The catalog identity supplies the print heading even when an imported XML
// omits its work title. This modifies only the disposable printing copy.
export function leadPrintXML(xml,title){
 const doc=new DOMParser().parseFromString(xml,'application/xml'),root=doc.documentElement;
 let work=root.querySelector(':scope > work');if(!work){work=doc.createElement('work');root.prepend(work);}
 let name=work.querySelector('work-title');if(!name){name=doc.createElement('work-title');work.append(name);}name.textContent=title;
 root.querySelector(':scope > movement-title')?.remove();
 return new XMLSerializer().serializeToString(doc);
}
