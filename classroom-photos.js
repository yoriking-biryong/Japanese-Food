'use strict';
window.ClassroomPhotos=(()=>{
 const base=window.RecipePhotos, data=window.CLASSROOM_PHOTO_DATA;
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const photos=new Map(data.photos.map(p=>[p.id,p]));
 const get=id=>{const entry=data.menus[id];if(!entry)return null;const p={...entry,...photos.get(entry.photo)};return p;};
 const date=p=>p.date.replaceAll('-','.');
 function photoRatio(p,cropped){
  const ratio=cropped?p.crop[2]*p.width/(p.crop[3]*p.height):p.width/p.height;
  return (p.rotation||0)%180?1/ratio:ratio;
 }
 function oriented(m,p,cropped,extra=''){
  const [x,y,w,h]=cropped?p.crop:[0,0,1,1],sourceRatio=w*p.width/(h*p.height),quarter=(p.rotation||0)%180;
  const width=quarter?sourceRatio*100:100,height=quarter?100/sourceRatio:100;
  return '<span class="classroom-photo-turned" data-photo-rotation="'+p.rotation+'" style="--photo-ratio:'+photoRatio(p,cropped)+';'+extra+'"><span class="classroom-photo-turn-source" style="width:'+width+'%;height:'+height+'%;transform:translate(-50%,-50%) rotate('+p.rotation+'deg)"><img src="'+safe(p.src)+'" alt="'+safe(cropped?m.name:p.title)+' 완성 사진" loading="lazy" draggable="false" style="width:'+(100/w)+'%;left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%"></span></span>';
 }
 function crop(m,p){
  if(p.rotation){const ratio=photoRatio(p,true),frame=4/3;return '<span class="classroom-photo-thumb">'+oriented(m,p,true,'width:'+(ratio>=frame?100:ratio/frame*100)+'%;height:'+(ratio>=frame?frame/ratio*100:100)+'%;')+'</span>';}
  const [x,y,w,h]=p.crop,ratio=w*p.width/(h*p.height),frame=4/3;
  const boxWidth=ratio>=frame?100:ratio/frame*100,boxHeight=ratio>=frame?frame/ratio*100:100;
  return '<span class="classroom-photo-thumb"><span class="classroom-photo-crop" style="width:'+boxWidth+'%;height:'+boxHeight+'%"><img src="'+safe(p.src)+'" alt="'+safe(m.name)+' · 사용자 제공 완성 사진" loading="lazy" draggable="false" style="width:'+(100/w)+'%;left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%"></span></span>';
 }
 function focused(m,p){
  if(p.rotation)return oriented(m,p,true);
  const [x,y,w,h]=p.crop,ratio=w*p.width/(h*p.height);
  return '<div class="classroom-photo-focus" style="--photo-ratio:'+ratio+'"><img src="'+safe(p.src)+'" alt="'+safe(m.name)+' 완성 사진" draggable="false" style="width:'+(100/w)+'%;left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%"></div>';
 }
 function card(m){const p=get(m.id);return p?'<span data-classroom-photo-card="'+m.id+'">'+crop(m,p)+'<span class="classroom-photo-label">완성 사진 · '+date(p)+'</span></span>':base.card(m);}
 function section(m){
  const p=get(m.id);if(!p)return base.section(m);
  if(p.individual)return '<section class="classroom-photo-section" data-classroom-photo-section="'+m.id+'"><div class="row between wrap"><div><h3>완성 사진</h3><p class="small muted">'+date(p)+' · 사용자 제공 사진</p></div><button type="button" data-classroom-photo="'+m.id+'">사진 크게 보기 ↗</button></div>'+'<figure>'+focused(m,p)+'<figcaption>'+safe(m.name)+' 완성 사진</figcaption></figure></section>';
  return '<section class="classroom-photo-section" data-classroom-photo-section="'+m.id+'"><div class="row between wrap"><div><h3>완성 사진</h3><p class="small muted">'+date(p)+' · 사용자 제공 사진</p></div><button type="button" data-classroom-photo="'+m.id+'">전체 사진 크게 보기 ↗</button></div>'+'<figure>'+(p.rotation?oriented(m,p,false):'<img class="classroom-photo-full" src="'+safe(p.src)+'" alt="'+safe(p.title)+' 완성 사진" loading="lazy">')+'<figcaption>사진 속 메뉴 · '+safe(p.title)+'</figcaption></figure><p class="small muted">전체 사진에서 음식의 모양과 그릇, 곁들임 배치를 살펴보세요.</p></section>';
 }
 let dialog,opener;
 function reset(){dialog.style.setProperty('--classroom-photo-zoom',1);dialog.querySelector('input').value=100;dialog.querySelector('output').value='100%';const view=dialog.querySelector('.classroom-photo-viewport');view.scrollLeft=0;view.scrollTop=0;}
 function zoom(value){
  const view=dialog.querySelector('.classroom-photo-viewport'),x=(view.scrollLeft+view.clientWidth/2)/view.scrollWidth,y=(view.scrollTop+view.clientHeight/2)/view.scrollHeight;
  dialog.style.setProperty('--classroom-photo-zoom',value/100);dialog.querySelector('output').value=value+'%';
  view.scrollLeft=x*view.scrollWidth-view.clientWidth/2;view.scrollTop=y*view.scrollHeight-view.clientHeight/2;
 }
 function open(id){
  const p=get(id),m=window.MENUS.find(m=>m.id===id);if(!p)return base.open(id);if(!m)return;
  if(!dialog){
   dialog=document.createElement('dialog');dialog.className='classroom-photo-dialog';dialog.setAttribute('aria-labelledby','classroom-photo-title');document.body.append(dialog);
   dialog.addEventListener('close',()=>{const target=opener?.isConnected?opener:document.querySelector('[data-classroom-photo="'+dialog.dataset.menuId+'"]');target?.focus({preventScroll:true});});
   dialog.addEventListener('click',event=>{if(event.target.closest('[data-classroom-photo-close]'))dialog.close();if(event.target.closest('[data-classroom-photo-reset]'))reset();});
   dialog.addEventListener('input',event=>{if(event.target.id==='classroom-photo-zoom')zoom(Number(event.target.value));});
  }
  if(!dialog.open)opener=document.activeElement;dialog.dataset.menuId=id;
  const photoTitle=p.individual?m.name:p.title,ratio=photoRatio(p,p.individual);
  const canvas=(p.individual||p.rotation)?'<div class="classroom-photo-canvas classroom-photo-canvas--focused" style="--photo-ratio:'+ratio+'">'+(p.individual?focused(m,p):oriented(m,p,false))+'</div>':'<div class="classroom-photo-canvas"><img src="'+safe(p.src)+'" alt="'+safe(p.title)+' 전체 완성 사진" draggable="false"></div>';
  dialog.innerHTML='<div class="dialog-head"><div><h2 id="classroom-photo-title">'+safe(m.name)+' · 완성 사진</h2><p class="small muted">'+date(p)+' · '+safe(photoTitle)+'</p></div><button type="button" class="close" data-classroom-photo-close aria-label="완성 사진 닫기">×</button></div><div class="classroom-photo-controls"><label for="classroom-photo-zoom">사진 확대 <output>100%</output></label><input id="classroom-photo-zoom" type="range" min="100" max="250" step="10" value="100"><button type="button" data-classroom-photo-reset>'+(p.individual?'사진 맞추기':'전체 사진')+'</button></div>'+'<div class="classroom-photo-viewport" tabindex="0" aria-label="확대한 완성 사진 영역">'+canvas+'</div><p class="small muted">확대한 사진은 스크롤하거나 끌어서 살펴볼 수 있어요.</p>';
  const view=dialog.querySelector('.classroom-photo-viewport');let drag=null;
  view.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,left:view.scrollLeft,top:view.scrollTop};view.setPointerCapture(event.pointerId);});
  view.addEventListener('pointermove',event=>{if(drag){view.scrollLeft=drag.left+drag.x-event.clientX;view.scrollTop=drag.top+drag.y-event.clientY;}});
  view.addEventListener('pointerup',()=>drag=null);view.addEventListener('pointercancel',()=>drag=null);
  reset();if(!dialog.open)dialog.showModal();
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-classroom-photo]');if(button)open(button.dataset.classroomPhoto);});
 window.RecipePhotos={...base,card,section,open};
 return {get,card,section,open};
})();
