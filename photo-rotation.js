'use strict';
window.PhotoRotation=(()=>{
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function image(src,alt,angle){
  const sourceRatio=4/3,quarter=angle%180,ratio=quarter?1/sourceRatio:sourceRatio;
  const fit=Math.min(1,ratio/(4/3))*100;
  return '<span class="photo-rotation-frame" data-photo-rotation="'+angle+'" style="--photo-ratio:'+ratio+';--photo-fit:'+fit+'%"><span class="photo-rotation-source" style="width:'+(quarter?sourceRatio*100:100)+'%;height:'+(quarter?100/sourceRatio:100)+'%;transform:translate(-50%,-50%) rotate('+angle+'deg)"><img src="'+safe(src)+'" alt="'+safe(alt)+'" loading="lazy" draggable="false"></span></span>';
 }
 return {image};
})();
