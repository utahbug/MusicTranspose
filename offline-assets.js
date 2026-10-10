// Same catalog fields used by score loading, independent of filename extensions.
export function requiredOfflineAssets(song){
 if(!song||song.local||song.missing||song.availability==='unavailable'||!song.asset)return [];
 return [...new Map([{url:song.asset,kind:song.scoreType==='pdf'?'pdf':'structured'},...(song.pdfAsset?[{url:song.pdfAsset,kind:'pdf'}]:[]),...(song.performancePdf?[{url:song.performancePdf,kind:'pdf'}]:[])].map(a=>[a.url,a])).values()];
}
