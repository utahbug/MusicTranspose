// Install UI is user-invoked; it never starts music downloads.
let installPrompt=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;document.dispatchEvent(new Event('home-screen-prompt-ready'));});
export function initHomeScreen({closeMenu,returnFocus}){
 const item=document.getElementById('add-home-screen'),dialog=document.getElementById('home-screen-dialog'),steps=document.getElementById('home-screen-steps'),intro=document.getElementById('home-screen-intro'),install=document.getElementById('home-screen-install'),status=document.getElementById('home-screen-status');
 const display=matchMedia('(display-mode: standalone)');let busy=false;
 const standalone=()=>display.matches||navigator.standalone===true;
 function updateInstalled(){const active=standalone();item.hidden=false;item.disabled=active;item.textContent=active?'App installed on this device':'Add app to your Home Screen';item.setAttribute('aria-disabled',String(active));if(active){item.removeAttribute('aria-haspopup');if(dialog.open)dialog.close();}else item.setAttribute('aria-haspopup','dialog');}
 function guidance(){
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),android=/Android/i.test(navigator.userAgent);
  install.hidden=!installPrompt||ios;install.disabled=busy;steps.replaceChildren();
  const instructions=ios?['Tap Share (you may find it in the page menu).','Choose Add to Home Screen.','Tap Add.']:android?['Open your browser menu.','Choose Install app or Add to Home screen, if offered.','Follow the browser instructions.']:['Look for the install icon in the address bar or an Install app option in the browser menu.','On Mac Safari, choose File → Add to Dock, if available.'];
  intro.textContent=ios?'In Safari, open MusicTranspose and:':installPrompt?'Install MusicTranspose using your browser:':'Add an app icon using your browser:';
  if(install.hidden)for(const text of instructions){const li=document.createElement('li');li.textContent=text;steps.append(li);}
 }
 item.onclick=()=>{closeMenu();updateInstalled();if(item.disabled)return;status.textContent='';guidance();dialog.showModal();document.getElementById('home-screen-close').focus();};
 document.getElementById('home-screen-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>returnFocus());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 install.onclick=async()=>{if(!installPrompt||busy)return;busy=true;const prompt=installPrompt;installPrompt=null;install.disabled=true;try{await prompt.prompt();const choice=await prompt.userChoice;status.textContent=choice?.outcome==='accepted'?'Installation requested. Follow any remaining browser instructions.':'Installation canceled. You can try again from the browser menu.';}catch{status.textContent='The install prompt is unavailable. Use your browser menu instead.';}finally{busy=false;guidance();}};
 window.addEventListener('appinstalled',()=>{installPrompt=null;updateInstalled();});display.addEventListener('change',updateInstalled);window.addEventListener('pageshow',updateInstalled);document.addEventListener('home-screen-prompt-ready',()=>{if(dialog.open)guidance();});updateInstalled();
}
