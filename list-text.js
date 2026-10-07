// Toolbar, range restoration, sizing and toggle-state behavior adapted from PrimarySongs v528.
// Accept only the editor's formatting and embedded raster images, including on reload.
export function cleanTextHTML(html){
 const source=document.createElement('template');source.innerHTML=String(html||'');
 const output=document.createElement('div'),allowed=new Set(['P','DIV','BR','STRONG','B','UL','OL','LI','SPAN']);
 function copy(node,host){
  if(node.nodeType===3){host.append(document.createTextNode(node.textContent));return;}
  if(node.nodeType!==1||['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH'].includes(node.tagName))return;
  if(node.tagName==='IMG'){if(/^data:image[/](png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(node.getAttribute('src')||'')){const image=document.createElement('img');image.src=node.getAttribute('src');image.alt=node.getAttribute('alt')||'Program image';host.append(image);}return;}
  const target=allowed.has(node.tagName)||node.tagName==='FONT'?document.createElement(node.tagName==='FONT'?'span':node.tagName.toLowerCase()):host;
  if(target!==host){const size=node.style.fontSize||({'1':'10px','2':'13px','3':'16px','4':'20px','5':'24px','6':'32px','7':'48px'}[node.getAttribute('size')]);if(['10px','13px','16px','20px','24px','32px','48px'].includes(size))target.style.fontSize=size;if(node.style.fontWeight==='bold'||Number(node.style.fontWeight)>=600)target.style.fontWeight='bold';host.append(target);}
  for(const child of node.childNodes)copy(child,target);
 }
 for(const child of source.content.childNodes)copy(child,output);return output.innerHTML;
}
export function createTextEditor({commit,remove,deleteItem,usage=()=>0}){
 const $=id=>document.getElementById(id),dialog=$('list-text-dialog'),editor=$('list-text-content');let current=null,origin=null,range=null,pending=0,generation=0;
 const error=text=>$('list-text-error').textContent=text;
 function remember(){const selection=getSelection();if(selection.rangeCount&&editor.contains(selection.anchorNode))range=selection.getRangeAt(0).cloneRange();}
 function restore(){editor.focus();if(range&&editor.contains(range.commonAncestorContainer)){const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}else{const end=document.createRange();end.selectNodeContents(editor);end.collapse(false);const selection=getSelection();selection.removeAllRanges();selection.addRange(end);}}
 function updateToolbar(){
  const selection=getSelection(),inside=selection?.rangeCount&&editor.contains(selection.anchorNode);
  if(inside)remember();
  for(const button of dialog.querySelectorAll('[data-command]')){if(button.dataset.command==='photo')continue;let active=false;if(inside){try{active=document.queryCommandState(button.dataset.command);}catch{}}button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));}
 }
 document.addEventListener('selectionchange',()=>{if(dialog.open)updateToolbar();});
 for(const event of ['input','keyup','mouseup'])editor.addEventListener(event,updateToolbar);
 for(const control of dialog.querySelectorAll('[data-command],[data-rich-size]')){
  control.onmousedown=e=>e.preventDefault();control.onclick=()=>{
   if(control.dataset.command==='photo'){remember();$('list-text-image').click();return;}
   restore();
   if(control.dataset.richSize){const selection=getSelection(),node=selection?.anchorNode,element=node?.nodeType===1?node:node?.parentElement,px=parseFloat(element&&getComputedStyle(element).fontSize),sizes=[10,13,16,20,24,32,48];const current=Number(document.queryCommandValue('fontSize'))||Math.max(1,sizes.findIndex(size=>size>=px)+1)||3;document.execCommand('fontSize',false,String(Math.max(1,Math.min(7,current+Number(control.dataset.richSize)))));}
   else document.execCommand(control.dataset.command,false,null);
   remember();updateToolbar();
  };
 }
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
 $('list-text-delete').onclick=()=>{if(deleteItem(current.id))dialog.close();};
 $('list-text-cancel').onclick=()=>dialog.close();$('list-text-remove').onclick=()=>{const item=current;dialog.close();remove(item);};
 dialog.addEventListener('close',()=>{generation++;range=null;origin?.isConnected&&origin.focus({preventScroll:true});});
 return {open(list,id,item){generation++;current={list,id};origin=document.activeElement;range=null;error('');const count=usage(id);$('list-text-shared').hidden=count<2;$('list-text-shared').textContent='Used in '+count+' Lists. Edits update all of them.';$('list-text-heading').textContent=item?'Edit Text':'Add Text';$('list-text-title').value=item?.title||'';editor.innerHTML=cleanTextHTML(item?.html);$('list-text-remove').hidden=!item||!list;$('list-text-delete').hidden=!item||!!list;dialog.showModal();$('list-text-title').focus();}};
}
