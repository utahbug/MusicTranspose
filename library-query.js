// Source views use factual collection memberships and explicit status, never IDs/titles/pages.
export const sourceChoices=[['all','All Sources'],['hymnal','Hymnal'],['children','Children’s Songbook'],['home-church','Hymns for Home and Church'],['legacy','Legacy'],['other','Other'],['my-music','My Music']];
export const activeHymnalCollections=['Hymns (1985)']; // Update only when authoritative edition metadata is available.
const memberships=s=>[{collection:s.collection},...(s.collectionMemberships||[])];
export function matchesSource(song,source){
 if(song.local)return source==='all'||source==='my-music';
 const records=memberships(song),has=name=>records.some(m=>m.collection===name);
 const legacy=song.status==='legacy';
 const hymnal=records.some(m=>m.role==='hymnal'&&m.status==='active'||activeHymnalCollections.includes(m.collection));
 switch(source){case 'my-music':return false;case 'hymnal':return hymnal&&!legacy;case 'children':return has('Children’s Songbook');case 'home-church':return has('Hymns for Home and Church');case 'legacy':return legacy;case 'other':return !hymnal&&!has('Children’s Songbook')&&!has('Hymns for Home and Church');default:return true;}
}
const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
// A–Z presentation only: preserve internal punctuation and original catalog order on ties.
export const titleSortKey=title=>String(title??'').replace(/^[\p{P}\s]+/u,'');
export const compareAlphabeticalTitles=(a,b)=>collator.compare(titleSortKey(a.title),titleSortKey(b.title));
export const compareTitles=(a,b)=>collator.compare(a.title,b.title)||collator.compare(a.id,b.id);
export function compareNumbers(a,b){
 const value=s=>String(s.songNumber??s.page??'').trim(),number=s=>{const m=value(s).match(/^(\d+)(?:[a-z])?$/i);return m?Number(m[1]):Infinity;};
 const x=number(a),y=number(b);return (x===y?0:x<y?-1:1)||(Number.isFinite(x)?collator.compare(value(a),value(b)):0)||compareTitles(a,b);
}

// A source-specific Library presentation of an existing identity, never a new song.
export function songForSource(song,source){
 const collection={children:'Children’s Songbook',hymnal:'Hymns (1985)','home-church':'Hymns for Home and Church'}[source];
 const member=collection&&song.collection!==collection&&(song.collectionMemberships||[]).find(m=>m.collection===collection);
 return member?{...song,collection:member.collection,page:member.page??member.songNumber??song.page,songNumber:member.songNumber??member.page??song.songNumber,title:member.title||song.title}:song;
}
