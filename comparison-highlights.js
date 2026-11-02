'use strict';
window.ComparisonHighlights = (() => {
  const sources = new Map();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kinds = new Set(['comparison-writing', 'comparison-fact']);
  const temporary = new WeakMap();
  function source(kind, id) {
    const menu = window.MENUS.find(m => m.id === id);
    if (!menu || !kinds.has(kind)) return null;
    const entries = sources.get(`${kind}:${id}`) || [];
    return {title:menu.name, menus:[id], steps:entries.map(x=>x.text), labels:entries.map(x=>x.label), comparison:true};
  }
  function snapshot(kind, menu, text, label) {
    const key = `${kind}:${menu.id}`, entries = sources.get(key) || [];
    let index = entries.findIndex(x => x.text === text && x.label === label);
    if (index < 0) { index = entries.length; entries.push({text,label}); sources.set(key,entries); }
    return window.RecipeMarks.wrap(kind, menu.id, index, `<p>${esc(text)}</p>`);
  }
  function writing(menu, text) {
    return snapshot('comparison-writing', menu, text, '내가 쓴 문장 · 수업 정답 아님');
  }
  function temporaryWriting(menu, text, index) {
    return `<p data-comparison-selectable data-comparison-writing="${menu.id}:${index}">${esc(text)}</p>`;
  }
  function fact(menu, item) {
    return snapshot('comparison-fact', menu, item.yes, `핵심 확인 · ${item.label}`);
  }
  function step(menu, index) {
    const text = menu.steps[index];
    const formatted = window.RecipeReference?.format(menu.id, text) || esc(text);
    return window.RecipeMarks.wrap('menu', menu.id, index, `<p>${formatted}</p>`);
  }
  function missingStep(menu, index) {
    const text = menu.steps[index];
    const formatted = window.RecipeReference?.format(menu.id, text) || esc(text);
    return `<p data-comparison-selectable data-comparison-step="${menu.id}:${index}">${formatted}</p>`;
  }
  function paintTemporary(root, ranges) {
    root.querySelectorAll('mark.comparison-pink').forEach(mark=>mark.replaceWith(document.createTextNode(mark.textContent)));
    root.normalize();
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    let node,offset=0;
    while((node=walker.nextNode())){nodes.push({node,start:offset,end:offset+node.data.length});offset+=node.data.length;}
    for(const entry of nodes){
      const overlaps=ranges.filter(r=>r.start<entry.end&&r.end>entry.start);if(!overlaps.length)continue;
      const fragment=document.createDocumentFragment();let cursor=0;
      for(const range of overlaps){
        const start=Math.max(0,range.start-entry.start),end=Math.min(entry.node.data.length,range.end-entry.start);
        fragment.append(document.createTextNode(entry.node.data.slice(cursor,start)));
        const mark=document.createElement('mark');mark.className='comparison-pink';mark.textContent=entry.node.data.slice(start,end);fragment.append(mark);cursor=end;
      }
      fragment.append(document.createTextNode(entry.node.data.slice(cursor)));entry.node.replaceWith(fragment);
    }
  }
  function captureTemporary(){
    const selected=window.getSelection();if(!selected||selected.isCollapsed||!selected.rangeCount)return;
    const range=selected.getRangeAt(0),element=node=>node.nodeType===1?node:node.parentElement;
    const root=element(range.startContainer)?.closest('[data-comparison-selectable]');
    if(!root||root!==element(range.endContainer)?.closest('[data-comparison-selectable]'))return;
    const before=range.cloneRange();before.selectNodeContents(root);before.setEnd(range.startContainer,range.startOffset);
    const through=range.cloneRange();through.selectNodeContents(root);through.setEnd(range.endContainer,range.endOffset);
    let start=before.toString().length,end=through.toString().length;
    const text=root.textContent.slice(start,end);if(!text.trim())return;
    start+=text.length-text.trimStart().length;end-=text.length-text.trimEnd().length;
    const previous=temporary.get(root)||[],erase=previous.some(r=>r.start<end&&r.end>start);
    let next;
    if(erase)next=previous.flatMap(r=>r.start>=end||r.end<=start?[r]:[{start:r.start,end:Math.min(start,r.end)},{start:Math.max(end,r.start),end:r.end}].filter(x=>x.end>x.start));
    else{
      next=[];
      for(const current of [...previous,{start,end}].sort((a,b)=>a.start-b.start)){
        const last=next.at(-1);if(last&&last.end>=current.start)last.end=Math.max(last.end,current.end);else next.push({...current});
      }
    }
    temporary.set(root,next);paintTemporary(root,next);selected.removeAllRanges();
    const status=root.closest('.menu-writing-pane')?.querySelector('[data-comparison-status]');
    if(status)status.textContent=erase?'선택한 분홍 표시를 지웠어요.':'분홍색 비교 표시를 남겼어요. 학습 노트에는 저장하지 않습니다.';
  }
  document.addEventListener('pointerup',event=>{if(event.button===0)captureTemporary();});
  document.addEventListener('keyup',event=>{if(event.key==='Shift')captureTemporary();});
  function toolbar(temporaryOwn=false) {
    const note=temporaryOwn?'왼쪽 내가 쓴 글과 오른쪽 전체 수업 단계는 모두 분홍색 임시 표시입니다. 위쪽 핵심 확인 항목의 노란 형광펜만 학습 노트에 저장됩니다.':'비교 결과의 내 문장·수업 문장·핵심 확인 항목을 표시할 수 있어요. 직접 쓴 문장은 수업 정답과 구분해 저장하며, 입력창에서는 글을 편집합니다.';
    return `<div class="comparison-highlight-tools">${window.RecipeMarks.toolbar()}<p class="source-note">${note}</p></div>`;
  }
  return {source,writing,temporaryWriting,fact,step,missingStep,toolbar};
})();
