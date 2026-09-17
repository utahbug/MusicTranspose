// Assets are self-contained. Provenance paths are documentation, never runtime inputs.
export const songs = [
 {id:'nativity',title:'The Nativity Song',collection:'Children’s Songbook',page:'52',tags:['Christmas','Primary'],aliases:[],collectionMemberships:[],asset:'./assets/nativity.mxl',tonic:'G',mode:'major',fifths:1},
 {id:'shepherd',title:'The Shepherd’s Carol',collection:'Children’s Songbook',page:'40b',tags:['Christmas','Primary'],aliases:[],collectionMemberships:[],asset:'./assets/shepherd.mxl',tonic:'D',mode:'minor',fifths:-1,modeOverride:'minor',evidence:'Source mode says major, but D-minor tonic chords, A7 cadences, C-sharp leading tones and final D establish D minor.'},
 {id:'faithful',title:'Oh, Come, All Ye Faithful',collection:'Hymns (1985)',page:'202',tags:['Christmas'],aliases:[],collectionMemberships:[],asset:'./assets/faithful.mxl',tonic:'G',mode:'major',fifths:1},
 {id:'silent-night',title:'Silent Night',collection:'Hymns (1985)',page:'204',tags:['Christmas'],aliases:[],collectionMemberships:[],asset:'./assets/silent-night.mxl',tonic:'B♭',mode:'major',fifths:-2}
];

// Collection membership is factual metadata, separate from personal lists.
// Additional memberships can later record {collection, page} from authoritative sources.
export const collectionNames=['Hymns for Home and Church','Hymns (1985)','Children’s Songbook'];
export function songSearchText(song){return [song.title,song.collection,song.page,...song.tags,...song.aliases,...song.collectionMemberships.flatMap(m=>[m.collection,m.page]),song.firstLine,song.composer,song.lyricist].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();}
