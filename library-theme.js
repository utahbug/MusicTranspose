import {themeIcon} from './icons.js';
// Library-only appearance. Never change Score/Lyrics classes or their preferences.
export function initLibraryTheme(){
 const key='music-transpose-library-theme-v1',buttons=[...document.querySelectorAll('.library-theme-toggle')];
 let dark=false;try{dark=localStorage.getItem(key)==='dark';}catch{}
 for(const button of buttons){const swatch=button.querySelector('.pdf-mobile-theme-swatch');if(swatch)swatch.outerHTML=themeIcon;}
 function apply(){
  document.documentElement.dataset.libraryTheme=dark?'dark':'light';
  for(const button of buttons){button.title=dark?'Use light Library theme':'Use dark Library theme';button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(dark));const label=button.querySelector('[data-theme-label]');if(label)label.textContent=dark?'Use light background':'Use dark background';}
 }
 for(const button of buttons)button.onclick=()=>{dark=!dark;apply();try{localStorage.setItem(key,dark?'dark':'light');}catch{}};
 apply();
}
