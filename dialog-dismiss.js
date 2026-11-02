'use strict';
(() => {
  let pressedOutside=null;
  const outside=(dialog,event)=>{
    const box=dialog.getBoundingClientRect();
    return event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom;
  };
  document.addEventListener('pointerdown',event=>{
    const dialog=event.target;
    pressedOutside=event.button===0&&dialog instanceof HTMLDialogElement&&dialog.open&&outside(dialog,event)?dialog:null;
  },true);
  document.addEventListener('pointercancel',()=>{pressedOutside=null;},true);
  document.addEventListener('click',event=>{
    const dialog=pressedOutside;pressedOutside=null;
    // Close only the top dialog actually clicked. Padding and drags from inside stay open.
    if(!dialog||!dialog.open||event.target!==dialog||!outside(dialog,event))return;
    event.preventDefault();event.stopPropagation();dialog.close();
  },true);
})();
