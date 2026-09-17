import {importedSongs} from './imported-songs.js';
// Assets are self-contained. Provenance paths are documentation, never runtime inputs.
export const songs = [
 {id:'nativity',title:'The Nativity Song',collection:'Children’s Songbook',page:'52',tags:['Christmas','Primary'],aliases:[],collectionMemberships:[],asset:'./assets/nativity.mxl',tonic:'G',mode:'major',fifths:1},
 {id:'shepherd',title:'The Shepherd’s Carol',collection:'Children’s Songbook',page:'40b',tags:['Christmas','Primary'],aliases:[],collectionMemberships:[],asset:'./assets/shepherd.mxl',tonic:'D',mode:'minor',fifths:-1,modeOverride:'minor',evidence:'Source mode says major, but D-minor tonic chords, A7 cadences, C-sharp leading tones and final D establish D minor.'},
 {id:'faithful',title:'Oh, Come, All Ye Faithful',collection:'Hymns (1985)',page:'202',tags:['Christmas'],aliases:[],collectionMemberships:[],asset:'./assets/faithful.mxl',tonic:'G',mode:'major',fifths:1},
 {id:'silent-night',title:'Silent Night',collection:'Hymns (1985)',page:'204',tags:['Christmas'],aliases:[],collectionMemberships:[],asset:'./assets/silent-night.mxl',tonic:'B♭',mode:'major',fifths:-2},
 {id:'scripture-power',title:'Scripture Power',collection:'Music from the Friend',page:'',scoreType:'pdf',transpositionAvailable:false,asset:'./assets/pdfs/scripture-power.pdf',tags:['Primary'],aliases:[],collectionMemberships:[]},
 {id:'choose-to-serve-the-lord',title:'Choose to Serve the Lord',collection:'Primary-use music',page:'',scoreType:'pdf',transpositionAvailable:false,asset:'./assets/pdfs/choose-to-serve-the-lord.pdf',tags:['Primary'],aliases:[],collectionMemberships:[]},
 ...importedSongs
];

// Collection membership is factual metadata, separate from personal lists.
// Additional memberships can later record {collection, page} from authoritative sources.
export const collectionNames=['Hymns for Home and Church','Hymns (1985)','Children’s Songbook'];
// The same normalization is used for queries and every score type.
export function normalizeSearch(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘'`]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
export function songSearchText(song){return normalizeSearch([song.title,song.collection,song.page,...(song.tags||[]),...(song.aliases||[]),...(song.collectionMemberships||[]).flatMap(m=>[m.collection,m.page]),song.firstLine,song.composer,song.lyricist].filter(v=>v!=null).join(' '));}
