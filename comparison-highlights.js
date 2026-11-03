'use strict';
window.ComparisonHighlights = (() => {
  const sources = new Map();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kinds = new Set(['comparison-writing', 'comparison-fact']);
  const PINK_KEY='ilsik-study:comparison-pink:v1';
  const initialized=new WeakSet(),pending=new Map();
  let cachedPink=[];
  const identity=record=>JSON.stringify([record.side,record.menuId,record.text,record.occurrence]);
  function readPink(){
    try{
      const raw=localStorage.getItem(PINK_KEY);if(raw===null){cachedPink=[];return [];}
      const data=JSON.parse(raw),seen=new Set();if(data?.version!==1||!Array.isArray(data.items))throw Error('format');
      for(const record of data.items){
        if(!record||!['writing','step'].includes(record.side)||!window.MENUS.some(m=>m.id===record.menuId)||typeof record.text!=='string'||!record.text.trim()||record.text.length>10000||!Number.isInteger(record.occurrence)||record.occurrence<0||!Array.isArray(record.ranges))throw Error('record');
        const key=identity(record);if(seen.has(key))throw Error('duplicate');seen.add(key);
        let end=-1;for(const range of record.ranges){if(!range||!Number.isInteger(range.start)||!Number.isInteger(range.end)||range.start<0||range.start<end||range.end<=range.start||range.end>record.text.length)throw Error('range');end=range.end;}
      }
      cachedPink=data.items;return cachedPink;
    }catch{return null;}
  }
  function target(root){
    const own=root.dataset.comparisonWriting,reference=own||root.dataset.comparisonStep;
    const menuId=reference?.split(':')[0],occurrence=Number(root.dataset.comparisonOccurrence||0);
    if(!window.MENUS.some(m=>m.id===menuId)||!Number.isInteger(occurrence)||occurrence<0)return null;
    return {side:own?'writing':'step',menuId,text:root.textContent,occurrence};
  }
  function rangesFor(record,records){return pending.get(identity(record))??records.find(x=>identity(x)===identity(record))?.ranges??[];}
  function tell(root,text){const status=root.closest('.menu-writing-pane')?.querySelector('[data-comparison-status]');if(status)status.textContent=text;}
  function savePink(root,ranges){
    const record=target(root);if(!record)return false;
    const key=identity(record),fresh=readPink();let saved=false;
    if(fresh!==null){
      const next=fresh.filter(x=>identity(x)!==key);if(ranges.length)next.push({...record,ranges});
      try{localStorage.setItem(PINK_KEY,JSON.stringify({version:1,items:next}));cachedPink=next;pending.delete(key);saved=true;}catch{}
    }
    if(!saved)pending.set(key,ranges);
    // Keep two visible copies of the same sentence consistent without rebuilding the comparison.
    document.querySelectorAll('[data-comparison-selectable]').forEach(node=>{const value=target(node);if(value&&identity(value)===key){initialized.add(node);paintTemporary(node,ranges);}});
    if(!saved)tell(root,'저장하지 못해 현재 창에서만 표시를 유지합니다. 기존 저장 기록은 그대로 보관합니다.');
    return saved;
  }
  function restore(scope=document){
    const records=readPink()??cachedPink,roots=[...(scope.matches?.('[data-comparison-selectable]')?[scope]:[]),...scope.querySelectorAll('[data-comparison-selectable]')];
    for(const root of roots){if(initialized.has(root))continue;const record=target(root);if(!record)continue;initialized.add(root);const ranges=rangesFor(record,records);if(ranges.length)paintTemporary(root,ranges);}
  }
  // Restore after tab switches/dialog rendering, including the first restored draft after reload.
  if(typeof MutationObserver!=='undefined'){
    const start=()=>{restore();new MutationObserver(events=>{for(const event of events)for(const node of event.addedNodes)if(node.nodeType===1)restore(node);}).observe(document.body,{childList:true,subtree:true});};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  }
  window.addEventListener('storage',event=>{
    if(event.key!==PINK_KEY&&event.key!==null)return;const records=readPink();if(records===null)return;
    document.querySelectorAll('[data-comparison-selectable]').forEach(root=>{const record=target(root);if(record)paintTemporary(root,rangesFor(record,records));});
  });
  let suppressDoubleSelection=false;
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
  function temporaryWriting(menu, text, index, occurrence=0) {
    return `<p data-comparison-selectable data-comparison-writing="${menu.id}:${index}" data-comparison-occurrence="${occurrence}">${esc(text)}</p>`;
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
    return `<p data-comparison-selectable data-comparison-step="${menu.id}:${index}" data-comparison-occurrence="${menu.steps.slice(0,index).filter(step=>step===text).length}">${formatted}</p>`;
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
        const mark=document.createElement('mark');mark.className='comparison-pink';mark.dataset.comparisonRange=String(range.start);mark.textContent=entry.node.data.slice(start,end);fragment.append(mark);cursor=end;
      }
      fragment.append(document.createTextNode(entry.node.data.slice(cursor)));entry.node.replaceWith(fragment);
    }
  }
  function captureTemporary(){
    if(suppressDoubleSelection)return;
    const selected=window.getSelection();if(!selected||selected.isCollapsed||!selected.rangeCount)return;
    const range=selected.getRangeAt(0),element=node=>node.nodeType===1?node:node.parentElement;
    const root=element(range.startContainer)?.closest('[data-comparison-selectable]');
    if(!root||root!==element(range.endContainer)?.closest('[data-comparison-selectable]'))return;
    const before=range.cloneRange();before.selectNodeContents(root);before.setEnd(range.startContainer,range.startOffset);
    const through=range.cloneRange();through.selectNodeContents(root);through.setEnd(range.endContainer,range.endOffset);
    let start=before.toString().length,end=through.toString().length;
    const text=root.textContent.slice(start,end);if(!text.trim())return;
    start+=text.length-text.trimStart().length;end-=text.length-text.trimEnd().length;
    const record=target(root);if(!record)return;
    const previous=rangesFor(record,readPink()??cachedPink),next=window.RecipeMarks.combineRanges([...previous,{start,end}]);
    if(savePink(root,next))tell(root,'분홍 표시를 저장했어요. 내용이 같으면 다시 비교하거나 새로고침해도 유지합니다.');
    selected.removeAllRanges();
  }
  document.addEventListener('mousedown',event=>{suppressDoubleSelection=event.detail>1&&!!event.target.closest('mark.comparison-pink');},true);
  document.addEventListener('pointerup',event=>{if(event.button===0)captureTemporary();});
  document.addEventListener('keyup',event=>{if(event.key==='Shift')captureTemporary();});
  document.addEventListener('dblclick',event=>{
    const mark=event.target.closest('mark.comparison-pink'),root=mark?.closest('[data-comparison-selectable]');if(!root)return;
    event.preventDefault();event.stopImmediatePropagation();suppressDoubleSelection=false;
    const record=target(root);if(!record)return;
    const next=rangesFor(record,readPink()??cachedPink).filter(r=>r.start!==Number(mark.dataset.comparisonRange));
    if(savePink(root,next))tell(root,'이 구절의 분홍 표시를 지웠어요. 다른 표시는 유지합니다.');
    window.getSelection()?.removeAllRanges();
  },true);

  function toolbar(temporaryOwn=false) {
    const note=temporaryOwn?'왼쪽 내가 쓴 글과 오른쪽 전체 수업 단계는 다시 드래그해도 분홍색입니다. 내용이 같은 문장의 표시는 다시 비교하거나 새로고침해도 유지하며, 더블클릭으로 지웁니다. 분홍 표시는 비교 화면에 따로 저장하고, 위쪽 핵심 확인의 노란 형광펜만 학습 노트에 모읍니다.':'비교 결과의 내 문장·수업 문장·핵심 확인 항목을 표시할 수 있어요. 직접 쓴 문장은 수업 정답과 구분해 저장하며, 입력창에서는 글을 편집합니다.';
    const controls=window.RecipeMarks.toolbar();
    return `<div class="comparison-highlight-tools">${temporaryOwn?controls.replace('<p>','<p>위쪽 핵심 확인 항목: '):controls}<p class="source-note">${note}</p></div>`;
  }
  return {restore,source,writing,temporaryWriting,fact,step,missingStep,toolbar};
})();
