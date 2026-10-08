// One document-local paint server avoids duplicate IDs in reused SVG strings.
// Keep it rendered at zero size (not display:none) for Safari SVG references.
if(typeof document!=='undefined'&&!document.getElementById('music-transpose-icon-paint')){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.id='music-transpose-icon-paint';svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
 svg.innerHTML='<defs><linearGradient id="mt-icon-blue-teal" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24"><stop stop-color="#225ca9"/><stop offset="1" stop-color="#087d76"/></linearGradient><linearGradient id="mt-icon-blue-teal-dark" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24"><stop stop-color="#85b8ff"/><stop offset="1" stop-color="#55d9bd"/></linearGradient></defs>';
 document.body.prepend(svg);
}
