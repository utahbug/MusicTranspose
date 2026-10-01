// Reload/history restoration continues the current document session. A new
// top-level navigation (including a PWA start URL) begins clean browsing.
export function freshLibraryLaunch(type,hasSession){return !hasSession||type==='navigate';}
export function beginLibrarySession(){
 const key='music-transpose-browsing-session-v1';let hasSession=false;
 try{hasSession=sessionStorage.getItem(key)==='1';sessionStorage.setItem(key,'1');}catch{}
 return freshLibraryLaunch(performance.getEntriesByType('navigation')[0]?.type,hasSession);
}
