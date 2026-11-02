'use strict';
window.RecipeHighlights = (() => {
  const KEY='ilsik-study:recipe-highlights:v2', LEGACY_KEY='ilsik-study:recipe-highlights:v1', marks=window.RecipeMarks;
  // Keep comparison records separate so existing open tabs can still read recipe v2.
  const SUMMARY_KEY='ilsik-study:summary-highlights:v1';
  const COMPARISON_KEY='ilsik-study:comparison-highlights:v1';
  const bucket=kind=>marks.isComparison(kind)?'comparison':marks.isSummary(kind)?'summary':'recipe';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const same=(a,b)=>a.kind===b.kind&&a.sourceId===b.sourceId&&a.text===b.text&&(bucket(a.kind)==='recipe'||a.label===b.label);
  let hooks={},readFailed=false,blockedUntil=0,migration=null,migrationNotice='',readable=[];
  function validate(data,version,group='recipe'){
    if(data?.version!==version||!Array.isArray(data.items))throw Error('format');
    const ids=new Set();
    for(const x of data.items){
      if(!x||typeof x.id!=='string'||!/^[a-z0-9-]{1,100}$/i.test(x.id)||ids.has(x.id)||!marks.source(x.kind,x.sourceId)||typeof x.text!=='string'||!x.text.trim()||x.text.length>10000||!Number.isInteger(x.step)||x.step<1||!Number.isInteger(x.start)||!Number.isInteger(x.end)||x.start<0||x.end<=x.start||x.end>x.text.length||!x.text.slice(x.start,x.end).trim()||!Number.isFinite(x.createdAt)||x.createdAt<=0||!Number.isFinite(new Date(x.createdAt).getTime()))throw Error('entry');
      ids.add(x.id);
      if(bucket(x.kind)!==group)throw Error('source');
      if(group!=='recipe'&&(typeof x.label!=='string'||!x.label.trim()||x.label.length>1000))throw Error('label');
    }
    return data.items.map(marks.normalizeItem);
  }
  function readRecipes(){
    try{
      const raw=localStorage.getItem(KEY);
      if(raw!==null){
        const data=JSON.parse(raw),saved=validate(data,2);
        migration=data.migration||null;readFailed=false;return saved;
      }
      // One atomic v2 write: keep both v1 sources intact as recovery copies.
      // Old tabs only write v1 and cannot overwrite the unified records.
      const old=localStorage.getItem(LEGACY_KEY);
      const highlights=old===null?[]:validate(JSON.parse(old),1);
      readable=highlights;
      const stars=marks.legacy();if(stars===null)throw Error('legacy stars');
      let combined=highlights;
      for(const item of stars)combined=merge(combined,item,0,item.text.length);
      readable=combined;
      migration={completedAt:Date.now(),starCount:stars.length,highlightCount:highlights.length};
      localStorage.setItem(KEY,JSON.stringify({version:2,items:combined,migration}));
      migrationNotice=stars.length?`기존 별표 ${stars.length}개를 문장 전체 형광펜으로 합쳤어요. 겹치는 표시는 하나로 정리했습니다.`:'';
      readFailed=false;return combined;
    }catch{readFailed=true;return null;}
  }
  function read(){
    const recipes=readRecipes();if(recipes===null)return null;
    readable=recipes;
    try{
      const raw=localStorage.getItem(SUMMARY_KEY);
      const summaries=raw===null?[]:validate(JSON.parse(raw),1,'summary');
      readable=[...recipes,...summaries];
      const rawComparison=localStorage.getItem(COMPARISON_KEY);
      const comparisons=rawComparison===null?[]:validate(JSON.parse(rawComparison),1,'comparison');
      readFailed=false;return [...recipes,...summaries,...comparisons];
    }catch{readFailed=true;return null;}
  }
  let items=read()||readable;
  const status=()=>readFailed?'기록을 불러오거나 통합해 저장하지 못했어요. 기존 기록은 보관되어 있으며 덮어쓰지 않습니다.':migrationNotice;
  function message(text){document.querySelectorAll('.recipe-mark-status,.recipe-highlight-status').forEach(el=>el.textContent=text);hooks.toast?.(text);}
  // Only touching or overlapping selections of the same saved sentence merge.
  function merge(fresh,item,start,end){
    let a=start,b=end,overlaps=[];
    for(let changed=true;changed;){changed=false;for(const x of fresh){if(same(x,item)&&x.start<=b&&x.end>=a&&!overlaps.includes(x)){overlaps.push(x);a=Math.min(a,x.start);b=Math.max(b,x.end);changed=true;}}}
    const original=overlaps.sort((x,y)=>x.createdAt-y.createdAt)[0];
    const record={id:original?.id||(globalThis.crypto?.randomUUID?.()||`highlight-${Date.now()}-${Math.random().toString(36).slice(2)}`),kind:item.kind,sourceId:item.sourceId,text:item.text,step:item.step,...(bucket(item.kind)!=='recipe'?{label:item.label}:{}),start:a,end:b,createdAt:Math.min(original?.createdAt||Infinity,item.createdAt||Date.now())};
    return [...fresh.filter(x=>!overlaps.includes(x)),record];
  }
  function commit(next,text,kind){
    const group=bucket(kind),saved=next.filter(x=>bucket(x.kind)===group);
    try{localStorage.setItem(group==='comparison'?COMPARISON_KEY:group==='summary'?SUMMARY_KEY:KEY,JSON.stringify(group!=='recipe'?{version:1,items:saved}:{version:2,items:saved,migration}));}
    catch{message('형광펜을 저장하지 못했어요. 기존 표시는 유지했습니다.');return false;}
    items=next;paint();hooks.changed?.();message(text);return true;
  }
  // Erase only the selected overlap; keep each unselected fragment for review.
  function subtract(fresh,item,start,end){
    return fresh.flatMap(x=>{
      if(!same(x,item)||x.start>=end||x.end<=start)return [x];
      return [[x.start,Math.min(start,x.end)],[Math.max(end,x.start),x.end]].map(([a,b])=>{
        const text=x.text.slice(a,b);return {start:a+text.length-text.trimStart().length,end:b-text.length+text.trimEnd().length};
      }).filter(r=>r.end>r.start).map((range,index)=>({...x,...range,id:index===0?x.id:(globalThis.crypto?.randomUUID?.()||`highlight-${Date.now()}-${Math.random().toString(36).slice(2)}`)}));
    });
  }
  function add(ref,start,end,toggle=false){
    const item=marks.target(ref);if(!item||!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>item.text.length||start>=end)return false;
    const selected=item.text.slice(start,end);if(!selected.trim())return false;
    start+=selected.length-selected.trimStart().length;end-=selected.length-selected.trimEnd().length;
    const fresh=read();if(fresh===null){message('형광펜 기록을 읽지 못했어요. 기존 기록을 덮어쓰지 않았습니다.');return false;}
    if(toggle&&fresh.some(x=>same(x,item)&&x.start<end&&x.end>start))return commit(subtract(fresh,item,start,end),'다시 드래그한 부분의 형광펜을 지웠어요. 복습 목록에도 반영했습니다.',item.kind);
    if(fresh.some(x=>same(x,item)&&x.start<=start&&x.end>=end)){items=fresh;paint();message('이미 형광펜으로 표시한 구절이에요.');return true;}
    return commit(merge(fresh,item,start,end),'형광펜 구절을 내 학습 노트에 저장했어요.',item.kind);
  }
  function remove(id){const fresh=read();if(fresh===null){message('형광펜 기록을 읽지 못했어요. 기존 기록을 유지합니다.');return;}const item=fresh.find(x=>x.id===id);if(item)commit(fresh.filter(x=>x.id!==id),'형광펜 표시를 해제했어요.',item.kind);}
  function decorate(ref,html){
    const item=marks.target(ref);if(!item)return html;
    const template=document.createElement('template');template.innerHTML=html;
    const root=template.content.querySelector('.blank-launch > span')||template.content.querySelector('p');if(!root)return html;
    root.setAttribute('data-recipe-selectable','');
    root.querySelectorAll('mark.recipe-highlight').forEach(el=>el.replaceWith(document.createTextNode(el.textContent)));
    root.normalize();
    if(root.textContent!==item.text)return template.innerHTML;
    const ranges=items.filter(x=>same(x,item)).sort((a,b)=>a.start-b.start);
    if(ranges.length){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node,offset=0;
      while((node=walker.nextNode())){nodes.push({node,start:offset,end:offset+node.data.length});offset+=node.data.length;}
      for(const entry of nodes){
        const segments=ranges.filter(x=>x.start<entry.end&&x.end>entry.start);if(!segments.length)continue;
        const fragment=document.createDocumentFragment();let cursor=0;
        for(const range of segments){const start=Math.max(0,range.start-entry.start),end=Math.min(entry.node.data.length,range.end-entry.start);if(start<cursor)continue;
          fragment.append(document.createTextNode(entry.node.data.slice(cursor,start)));
          const mark=document.createElement('mark');mark.className='recipe-highlight';mark.dataset.highlightId=range.id;mark.textContent=entry.node.data.slice(start,end);fragment.append(mark);cursor=end;
        }
        fragment.append(document.createTextNode(entry.node.data.slice(cursor)));entry.node.replaceWith(fragment);
      }
    }
    return template.innerHTML;
  }
  function paint(){
    document.querySelectorAll('[data-recipe-mark-row]').forEach(row=>{const content=row.querySelector('.recipe-mark-content');if(content)content.innerHTML=decorate(row.dataset.recipeMarkRow,content.innerHTML);});
    document.querySelectorAll('[data-recipe-highlight-count]').forEach(el=>el.textContent=items.length);
  }
  function selection(){
    const selected=window.getSelection();if(!selected||selected.isCollapsed||!selected.rangeCount)return null;
    const range=selected.getRangeAt(0),element=node=>node.nodeType===1?node:node.parentElement;
    const startRoot=element(range.startContainer)?.closest('[data-recipe-selectable]'),endRoot=element(range.endContainer)?.closest('[data-recipe-selectable]');
    if(!startRoot||startRoot!==endRoot)return null;
    const row=startRoot.closest('[data-recipe-mark-row]');if(!row)return null;
    const before=range.cloneRange();before.selectNodeContents(startRoot);before.setEnd(range.startContainer,range.startOffset);
    const through=range.cloneRange();through.selectNodeContents(startRoot);through.setEnd(range.endContainer,range.endOffset);
    return {ref:row.dataset.recipeMarkRow,start:before.toString().length,end:through.toString().length,selected};
  }
  function capture(){
    const value=selection();if(!value)return false;
    blockedUntil=Date.now()+500;
    const saved=add(value.ref,value.start,value.end,true);if(saved)value.selected.removeAllRanges();return true;
  }
  document.addEventListener('pointerup',event=>{if(event.button===0)capture();});
  document.addEventListener('keyup',event=>{if(event.key==='Shift')capture();});
  // A text drag must not also open the sentence's existing blank quiz.
  document.addEventListener('click',event=>{
    if(!event.target.closest('.recipe-mark-content'))return;
    if(Date.now()<blockedUntil||capture()){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  function renderNotes(){
    if(!items.length)return `<section class="empty"><h2>필요한 구절이나 문장 전체를 형광펜으로 표시해요</h2><p>레시피·소스·치수 정리표나 직접 쓴 글의 비교 결과를 드래그하면 선택한 범위가 여기에 저장돼요.<br>표시한 구절을 다시 드래그하면 그 부분만 지워져요.</p><button type="button" class="primary" data-action="guide">레시피에서 형광펜 표시하기</button><p class="recipe-highlight-status" role="status">${esc(status())}</p></section>`;
    const groups=new Map();[...items].sort((a,b)=>b.createdAt-a.createdAt).forEach(x=>{const key=`${x.kind}:${x.sourceId}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);});
    return `<section class="recipe-highlight-notes" aria-label="형광펜 구절"><div class="recipe-review-start"><div><h2>형광펜 구절만 복습하기</h2><p>형광펜으로 표시한 ${items.length}개 범위에서 빈칸을 만들어요. 문장 전체 표시도 함께 모았어요.</p></div><button type="button" class="primary" data-highlight-review>형광펜 전체 빈칸 맞히기 →</button></div><p class="recipe-highlight-status" role="status" aria-live="polite">${esc(status())}</p>${[...groups.values()].map(group=>{
      const first=group[0],info=marks.source(first.kind,first.sourceId);
      return `<article class="panel recipe-mark-group"><div class="panel-head"><div><span class="eyebrow">${info.comparison?(first.kind==='comparison-writing'?'직접 쓰고 비교 · 내가 쓴 문장':'직접 쓰고 비교 · 핵심 확인'):info.summary?'비교하며 외우기 · '+(first.kind==='summary-sauces'?'소스·용량':'치수·제출'):first.kind==='pair'?'함께 만드는 순서':'한 메뉴 레시피'}</span><h2>${esc(info.title)}</h2></div><span class="badge">형광펜 ${group.length}</span></div><ul>${group.map(x=>{const {ref}=marks.locate(x),date=new Date(x.createdAt),caption=marks.caption(x);return `<li class="recipe-mark-note"><div class="recipe-mark-meta"><strong>${esc(caption)}</strong><time datetime="${date.toISOString()}">${date.toLocaleDateString('ko-KR')} 표시</time></div><p class="recipe-highlight-quote">${esc(x.text.slice(0,x.start))}<mark>${esc(x.text.slice(x.start,x.end))}</mark>${esc(x.text.slice(x.end))}</p><div class="recipe-mark-note-actions">${ref?`<button type="button" data-highlight-open="${esc(x.id)}" aria-label="${esc(info.title+' '+caption)} 형광펜 위치 보기">${info.summary?'정리표':'레시피'}에서 보기 ↗</button>`:''}<button type="button" class="text-button" data-highlight-remove="${esc(x.id)}" aria-label="${esc(info.title+' '+caption)} 형광펜 해제">형광펜 해제</button></div></li>`;}).join('')}</ul></article>`;
    }).join('')}</section>`;
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('button');if(!el)return;
    if(el.hasAttribute('data-highlight-remove'))remove(el.dataset.highlightRemove);
    if(el.hasAttribute('data-highlight-review'))window.RecipeReview?.open('highlight',items.map(x=>({...x})),el);
    if(el.hasAttribute('data-highlight-open')){const item=items.find(x=>x.id===el.dataset.highlightOpen);if(!item)return;const row=marks.reveal(item);row?.querySelector(`[data-highlight-id="${item.id}"]`)?.scrollIntoView({block:'center'});}
  });
  window.addEventListener('storage',event=>{if(event.key!==KEY&&event.key!==SUMMARY_KEY&&event.key!==COMPARISON_KEY&&event.key!==null)return;const fresh=read();if(fresh===null){message('다른 창의 형광펜 기록을 읽지 못했어요. 현재 기록을 유지합니다.');return;}items=fresh;paint();hooks.changed?.();});
  return {decorate,renderNotes,add,merge,status,count:()=>items.length,forMenu:id=>items.filter(x=>x.kind==='menu'&&x.sourceId===id).map(x=>({...x})),init:options=>{hooks=options;}};
})();
