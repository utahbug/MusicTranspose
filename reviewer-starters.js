import {localMetadata,localRecords,bundledFileDetails,saveBundledFileDetails} from './local-music-store.js';
const libraryKey='music-transpose-library-v1';
// Capture prior installation evidence before application initialization writes defaults.
const previouslyUsed=(()=>{try{return Object.keys(localStorage).some(key=>key.startsWith('music-transpose-'));}catch{return true;}})();
export async function initializeReviewerStarters(){
 try{
  if(previouslyUsed||localStorage.getItem(libraryKey)!==null)return false;
  // Be conservative if either index contains imports or storage cannot be inspected.
  if((await localMetadata()).length||(await localRecords()).length)return false;
  if(localStorage.getItem(libraryKey)!==null)return false;
  const state={orderingVersion:1,starterContentVersion:1,favorites:[],recent:[],groups:[
   {id:'starter-primary',name:'PRIMARY SONGS',description:'Included starter List. Edit or delete it freely.',songView:'score',songs:['cs-2','hhc-1004','choose-to-serve-the-lord']},
   {id:'starter-hymns',name:'HYMNS',description:'Included starter List. Edit or delete it freely.',songs:['hhc-1010','hhc-1028','song-00dbf08d-281a-4a99-9a9a-77815f9d9d14','song-95e908ac-a3bd-4000-a45b-6ee588196bdf']},
   {id:'starter-events',name:'HOLIDAYS / EVENTS',description:'Included starter List. Edit or delete it freely.',songView:'score',songs:['song-5e5bc70a-2e08-4411-999d-628bf6079d88','hhc-1206','hhc-1208']}
  ],textItems:{'text:starter-primary-plan':{type:'text',title:'Primary Program Plan',example:true,html:'<p>Intro: by ______</p><p><br></p><p>Song 1: I Am a Child of God<br>Song 2: Search, Ponder, and Pray</p><p><br></p><p>Talks</p><p><br></p><p>Song 3: ______<br>Song 4: ______</p>'}}};
  // One atomic write includes the marker, Lists and Note: interruption cannot leave
  // a partly seeded library. Deterministic IDs also prevent duplicate starter entries.
  localStorage.setItem(libraryKey,JSON.stringify(state));return true;
 }catch{return false;}
}
export function includedFileVisible(song){
 if(song.local)return true;
 const hidden=bundledFileDetails()[song.id]?.hiddenInFiles;
 if(typeof hidden==='boolean')return !hidden;
 try{return song.id!=='scripture-power'||JSON.parse(localStorage.getItem(libraryKey)||'{}').starterContentVersion!==1;}catch{return true;}
}
export function hideIncludedFile(id){saveBundledFileDetails(id,{hiddenInFiles:true});}
export function restoreIncludedFiles(){for(const id of ['choose-to-serve-the-lord','scripture-power'])saveBundledFileDetails(id,{hiddenInFiles:false});}
