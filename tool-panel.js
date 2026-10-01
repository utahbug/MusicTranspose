// One live tool owns the floating panel; closing never changes its live settings.
let owner=null;
export function claimToolPanel(name,close){if(owner?.name!==name)owner?.close();owner={name,close};}
export function releaseToolPanel(name){if(owner?.name===name)owner=null;}
