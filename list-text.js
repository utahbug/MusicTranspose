import {textBulletsIcon,textNumberedIcon,textImageIcon} from './icons.js';
// Accept only the editor's formatting and embedded raster images, including on reload.
export function cleanTextHTML(html){
 const source=document.createElement('template');source.innerHTML=String(html||'');
 const output=document.createElement('div'),allowed=new Set(['P','DIV','BR','STRONG','B','UL','OL','LI','SPAN']);
 function copy(node,host){
  if(node.nodeType===3){host.append(document.createTextNode(node.textContent));return;}
  if(node.nodeType!==1||['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH'].includes(node.tagName))return;
  if(node.tagName==='IMG'){if(/^data:image[/](png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(node.getAttribute('src')||'')){const image=document.createElement('img');image.src=node.getAttribute('src');image.alt=node.getAttribute('alt')||'Program image';host.append(image);}return;}
  const target=allowed.has(node.tagName)||node.tagName==='FONT'?document.createElement(node.tagName==='FONT'?'span':node.tagName.toLowerCase()):host;
  if(target!==host){const size=node.style.fontSize||({'3':'16px','4':'20px','5':'24px','6':'32px'}[node.getAttribute('size')]);if(['16px','20px','24px','32px'].includes(size))target.style.fontSize=size;if(node.style.fontWeight==='bold'||Number(node.style.fontWeight)>=600)target.style.fontWeight='bold';host.append(target);}
  for(const child of node.childNodes)copy(child,target);
 }
 for(const child of source.content.childNodes)copy(child,output);return output.innerHTML;
}
export function createTextEditor({commit,remove,usage=()=>0}){
 const $=id=>document.getElementById(id),dialog=$('list-text-dialog'),editor=$('list-text-content');let current=null,origin=null,range=null,pending=0,generation=0;
 dialog.querySelector('[data-command="insertUnorderedList"]').innerHTML=textBulletsIcon;
 dialog.querySelector('[data-command="insertOrderedList"]').innerHTML=textNumberedIcon;
 $('list-image-icon').innerHTML=textImageIcon;
 const error=text=>$('list-text-error').textContent=text;
 function remember(){const selection=getSelection();if(selection.rangeCount&&editor.contains(selection.anchorNode))range=selection.getRangeAt(0).cloneRange();}
 function restore(){editor.focus();if(range&&editor.contains(range.commonAncestorContainer)){const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}}
 document.addEventListener('selectionchange',()=>{if(dialog.open)remember();});
 for(const control of dialog.querySelectorAll('[data-command]')){control.onmousedown=e=>e.preventDefault();control.onclick=()=>{restore();document.execCommand(control.dataset.command);remember();};}
 $('list-text-size').onchange=e=>{restore();document.execCommand('fontSize',false,e.target.value);remember();};
 async function addImage(file){const token=generation;pending++;$('list-text-save').disabled=true;error('');try{
  if(!/^image[/](png|jpeg|webp|gif)$/.test(file.type))throw Error('Choose a PNG, JPEG, WebP or GIF image.');
  if(file.size>20*1024*1024)throw Error('Choose an image smaller than 20 MB.');
  const image=await createImageBitmap(file);
  const scale=Math.min(1,1600/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();
  const data=canvas.toDataURL('image/webp',.85);if(token!==generation||!dialog.open)return;
  if(editor.innerHTML.length+data.length>1800000)throw Error('This Text item has too many large images. Use a smaller image or another Text item.');
  restore();document.execCommand('insertHTML',false,'<img src="'+data+'" alt="Program image"><p><br></p>');remember();
 }catch(e){if(token===generation)error(e.message);}finally{pending--;if(!pending)$('list-text-save').disabled=false;}}
 $('list-text-image').onchange=e=>{const file=e.target.files[0];if(file)addImage(file);e.target.value='';};
 editor.addEventListener('paste',e=>{e.preventDefault();const files=[...e.clipboardData.files];if(files.length){for(const file of files)addImage(file);return;}const html=e.clipboardData.getData('text/html');if(html)document.execCommand('insertHTML',false,cleanTextHTML(html));else document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));remember();});
 editor.addEventListener('drop',e=>e.preventDefault());
 $('list-text-form').onsubmit=e=>{e.preventDefault();if(pending)return;const title=$('list-text-title').value.trim();if(!title){error('Enter a title.');return;}const html=cleanTextHTML(editor.innerHTML);if(html.length>1800000){error('This Text item is too large. Remove an image or split it into two items.');return;}if(commit(current,{type:'text',title,html}))dialog.close();else error('Could not save to device storage. Your draft is still open. Free storage or use fewer images, then retry.');};
 $('list-text-cancel').onclick=()=>dialog.close();$('list-text-remove').onclick=()=>{const item=current;dialog.close();remove(item);};
 dialog.addEventListener('close',()=>{generation++;range=null;origin?.isConnected&&origin.focus({preventScroll:true});});
 return {open(list,id,item){generation++;current={list,id};origin=document.activeElement;range=null;error('');const count=usage(id);$('list-text-shared').hidden=count<2;$('list-text-shared').textContent='Used in '+count+' Lists. Edits update all of them.';$('list-text-heading').textContent=item?'Edit Text':'Add Text';$('list-text-title').value=item?.title||'';editor.innerHTML=cleanTextHTML(item?.html);$('list-text-size').value='3';$('list-text-remove').hidden=!item;dialog.showModal();$('list-text-title').focus();}};
}
