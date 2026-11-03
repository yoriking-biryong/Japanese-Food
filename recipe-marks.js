'use strict';
window.RecipeMarks = (() => {
  const KEY = 'ilsik-study:recipe-marks:v1';
  const menus = new Map(window.MENUS.map(m => [m.id, m]));
  const pairs = new Map((window.CLASSROOM_PAIR_RECIPES || []).map(p => [p.id, p]));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let hooks = {};
  const isSummary = kind => kind === 'summary-sauces' || kind === 'summary-sizes';
  const isComparison = kind => kind === 'comparison-writing' || kind === 'comparison-fact';

  function source(kind, id) {
    if (isComparison(kind)) return window.ComparisonHighlights?.source(kind,id);
    if (isSummary(kind)) {
      const m = menus.get(id), entries = window.LESSON_STUDY_NOTES?.[id]?.[kind.slice(8)];
      return m && entries && {title:m.name, menus:[id], steps:entries.map(row=>row[1]), labels:entries.map(row=>row[0]), summary:true};
    }
    if (kind === 'menu') {
      const m = menus.get(id);
      return m && {title:m.name, menus:[id], steps:m.steps};
    }
    if (kind === 'pair') {
      const p = pairs.get(id);
      return p && {title:p.title, menus:p.pair, steps:p.steps.map(s => s.text)};
    }
  }
  // The two-character rename keeps saved selection offsets intact.
  // Only reconnect snapshots that still match the current recipe exactly.
  function normalizeItem(item) {
    if (isComparison(item.kind)) return item;
    const text=item.text.replaceAll('미림','맛술'),info=source(item.kind,item.sourceId);
    return text!==item.text&&info?.steps.some((step,i)=>step===text&&(!info.summary||info.labels[i]===item.label))?{...item,text}:item;
  }
  function legacy() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) { return []; }
      const saved = JSON.parse(raw);
      if (saved?.version !== 1 || !Array.isArray(saved.items)) throw Error('format');
      const ids = new Set(), identities = new Set();
      for (const item of saved.items) {
        const identity = JSON.stringify([item?.kind,item?.sourceId,item?.text]);
        if (!item || typeof item.id !== 'string' || !/^[a-z0-9-]{1,100}$/i.test(item.id) || ids.has(item.id) || identities.has(identity) || !source(item.kind,item.sourceId) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 10000 || !Number.isInteger(item.step) || item.step < 1 || !Number.isFinite(item.createdAt) || item.createdAt <= 0 || !Number.isFinite(new Date(item.createdAt).getTime())) throw Error('entry');
        ids.add(item.id); identities.add(identity);
      }
      return saved.items.map(normalizeItem);
    } catch { return null; }
  }
  function target(ref) {
    const [kind,id,rawIndex] = String(ref).split(':');
    if (!/^\d+$/.test(rawIndex || '')) return null;
    const info = source(kind,id), index = Number(rawIndex);
    return info && index < info.steps.length ? {kind,sourceId:id,text:info.steps[index],step:index+1,title:info.title,...(info.labels?{label:info.labels[index]}:{})} : null;
  }
  function wrap(kind,id,index,content) {
    const ref = `${kind}:${id}:${index}`;
    content = window.RecipeHighlights?.decorate(ref,content) || content;
    return `<div class="recipe-mark-row" data-recipe-mark-row="${esc(ref)}"><div class="recipe-mark-content">${content}</div></div>`;
  }
  // One base range can carry a second, stronger layer without duplicating review notes.
  function combineRanges(ranges) {
    const result=[];
    for(const range of ranges.map(r=>({start:r.start,end:r.end})).sort((a,b)=>a.start-b.start)){
      const last=result.at(-1);
      if(last&&last.end>=range.start)last.end=Math.max(last.end,range.end);else result.push(range);
    }
    return result;
  }
  function layerSegments(records) {
    return records.flatMap(record=>{
      const layers=record.emphasis||[],edges=[...new Set([record.start,record.end,...layers.flatMap(r=>[r.start,r.end])])].sort((a,b)=>a-b);
      return edges.slice(0,-1).map((start,i)=>({...record,start,end:edges[i+1],rangeStart:record.start,rangeEnd:record.end,emphasized:layers.some(r=>r.start<=start&&r.end>=edges[i+1])}));
    });
  }
  function toolbar() {
    return `<div class="recipe-mark-toolbar"><p>필요한 구절이나 문장 전체를 드래그해 형광펜으로 표시하세요. 표시 위를 다시 드래그하면 더 넓고 진한 보라색으로 강조해요. 표시를 더블클릭하면 그 구절의 겹친 표시를 모두 지워요.</p><div class="recipe-mark-links"><button type="button" class="text-button" data-action="highlight-notes">형광펜 모아보기 <span data-recipe-highlight-count>${window.RecipeHighlights?.count()||0}</span> →</button></div><p class="recipe-mark-status" role="status" aria-live="polite">${esc(window.RecipeHighlights?.status()||'')}</p></div>`;
  }
  function summary(entry, content) {
    const formatted = window.SummaryReference.format(entry.menu.id,entry.mode,entry.index,entry.text);
    return `<div class="summary-highlight-row">${wrap('summary-'+entry.mode,entry.menu.id,entry.index,content||`<p>${formatted}</p>`)}</div>`;
  }
  function summaryToolbar() {
    return `<div class="recipe-mark-toolbar summary-highlight-toolbar"><p>헷갈리는 소스·용량·치수를 드래그하면 내 학습 노트에 저장돼요. 표시 위를 다시 드래그하면 보라색으로 더 강조하고, 표시를 더블클릭하면 그 구절의 겹친 표시를 모두 지워요.</p><div class="recipe-mark-links"><button type="button" class="text-button" data-action="highlight-notes">형광펜 모아보기 <span data-recipe-highlight-count>${window.RecipeHighlights?.count()||0}</span> →</button></div><p class="recipe-highlight-status" role="status" aria-live="polite">${esc(window.RecipeHighlights?.status()||'')}</p></div>`;
  }
  function caption(item) {
    if (isComparison(item.kind)) return item.label;
    const {info,index,ref} = locate(item);
    return info?.summary ? (info.labels[index]||item.label||`${item.step}번째 항목`) + (ref?'':' · 저장 당시 내용') : `${ref?index+1:item.step}단계${ref?'':' · 저장 당시 문장'}`;
  }
  function locate(item) {
    const info = source(item.kind,item.sourceId);
    // Keep the saved comparison text even after the draft or checklist changes.
    if (isComparison(item.kind)) return {info,index:-1,ref:null};
    const index = info?.summary ? info.steps.findIndex((text,i)=>text===item.text&&info.labels[i]===item.label) : info?.steps.indexOf(item.text) ?? -1;
    return {info,index,ref:index < 0 ? null : `${item.kind}:${item.sourceId}:${index}`};
  }
  function reveal(item) {
    const {ref} = locate(item); if (!ref) return;
    hooks.open?.(source(item.kind,item.sourceId).menus[0]);
    if (item.kind === 'menu') document.querySelector(`[data-lesson-menu="${item.sourceId}"] [data-lesson-mode="read"]`)?.click();
    if (isSummary(item.kind)) document.querySelector(`[data-lesson-menu="${item.sourceId}"] [data-lesson-mode="summary"]`)?.click();
    const scope = isSummary(item.kind) ? document.querySelector(`[data-lesson-menu="${item.sourceId}"] [data-lesson-panel="summary"]`) : document;
    const row = [...(scope?.querySelectorAll('[data-recipe-mark-row]')||[])].find(el => el.dataset.recipeMarkRow === ref);
    if (!row) return;
    const pair = row.closest('details.classroom-pair'); if (pair) pair.open = true;
    row.scrollIntoView({block:'center'});
    row.setAttribute('tabindex','-1');
    row.focus({preventScroll:true});
    return row;
  }
  return {combineRanges,layerSegments,wrap,toolbar,summary,summaryToolbar,caption,isSummary,isComparison,reveal,source,target,locate,legacy,normalizeItem,init:options=>{hooks=options;}};
})();
