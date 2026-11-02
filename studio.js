'use strict';
window.StudyStudio = (() => {
  const K=window.KITCHEN_DATA, menus=new Map(window.MENUS.map(m=>[m.id,m]));
  const uid=()=>globalThis.crypto?.randomUUID?.()||`s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const namesFor=s=>new Set(s.pair.flatMap(id=>menus.get(id).ingredients.map(i=>i.name)));
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const entryText=(entry,id)=>entry.kind==='step'?menus.get(id).steps[entry.step]:entry.kind==='hygiene'?K.hygiene.find(h=>h.id===entry.action)?.name:entry.text;
  function clean(s){
    const raw=s.kitchen||{}, names=namesFor(s), active=s.pair.includes(raw.active)?raw.active:s.pair[0];
    const timelines={};
    for(const id of s.pair){
      const old=!s.kitchen&&s.stage===(s.flowVersion===2?1:2)?(s.orders?.[id]||[]).map(step=>({kind:'step',step})):[];
      timelines[id]=(Array.isArray(raw.timelines?.[id])?raw.timelines[id]:old).slice(0,120).filter(e=>e&&(
        e.kind==='step'&&Number.isInteger(e.step)&&e.step>=0&&e.step<menus.get(id).steps.length||
        e.kind==='hygiene'&&K.hygiene.some(h=>h.id===e.action)||
        e.kind==='custom'&&typeof e.text==='string'&&e.text.trim()
      )).map(e=>({key:uid(),kind:e.kind,...(e.kind==='step'?{step:e.step}:e.kind==='hygiene'?{action:e.action}:{text:e.text.slice(0,1200)})}));
    }
    const positions={};
    for(const [savedName,p] of Object.entries(raw.positions||{})){
      const name=window.RecipeBlanks.normalizeSeasoning(savedName);
      if(names.has(name)&&p&&K.tools.some(t=>t.id===p.tool)&&Number.isFinite(p.x)&&Number.isFinite(p.y))positions[name]={tool:p.tool,x:clamp(p.x,3,97),y:clamp(p.y,3,97)};
    }
    const trayOrder=Array.isArray(raw.trayOrder)?[...new Set(raw.trayOrder.map(window.RecipeBlanks.normalizeSeasoning).filter(n=>names.has(n)))]:[];
    return {version:2,active,selected:'',hint:!!raw.hint,toolLabels:raw.toolLabels!==false,timelines,positions,trayOrder};
  }
  function cleanWrong(raw){
    return Array.isArray(raw)?raw.filter(w=>w&&menus.has(w.menu)&&typeof w.text==='string'&&w.text.length<=10000&&Number.isFinite(w.when)).slice(0,100).map(w=>({id:typeof w.id==='string'?w.id:uid(),menu:w.menu,text:w.text,when:w.when})):[];
  }
  function compare(text,steps){
    const normal=s=>window.RecipeBlanks.normalizeSeasoning(s).normalize('NFKC').replace(/[^가-힣a-zA-Z0-9]/g,'').replace(/합니다|습니다|그리고|준비|다음|뒤에|먼저/g,'');
    const grams=s=>{const n=normal(s);return new Set(Array.from({length:Math.max(0,n.length-1)},(_,i)=>n.slice(i,i+2)));};
    const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean), used=new Set(), matches=[];
    steps.forEach((step,stepIndex)=>{
      const target=grams(step);let best=-1,score=0;
      lines.forEach((line,index)=>{if(used.has(index))return;const tokens=grams(line),overlap=[...tokens].filter(t=>target.has(t)).length;
        const value=overlap/Math.sqrt(Math.max(1,tokens.size*target.size));if(value>score){best=index;score=value;}
      });
      if(score<.23)best=-1;else used.add(best);
      matches.push({step:stepIndex,line:best,score});
    });
    const missing=matches.filter(m=>m.line===-1).map(m=>m.step);
    const outOfOrder=new Set();let previous=-1;
    matches.forEach(m=>{if(m.line<0)return;if(m.line<previous)outOfOrder.add(m.line);previous=Math.max(previous,m.line);});
    return {lines,missing,matches,rows:lines.map((text,index)=>({text,status:!used.has(index)?'review':outOfOrder.has(index)?'order':'match',step:matches.find(m=>m.line===index)?.step})),matched:used.size};
  }
  function assess(s){
    let correct=0,total=0;const errors=[];
    for(const id of s.pair){
      const m=menus.get(id), entries=s.kitchen.timelines[id], steps=entries.filter(e=>e.kind==='step').map(e=>e.step);let previous=-1;
      m.steps.forEach((text,step)=>{total++;const index=steps.indexOf(step);
        if(index<0)errors.push(`${m.name} · 빠진 작업: ${text}`);
        else if(index<previous)errors.push(`${m.name} · 예시와 순서가 다른 작업: ${text}`);
        else correct++;
        if(index>=0)previous=Math.max(previous,index);
        if(steps.filter(n=>n===step).length>1)errors.push(`${m.name} · 중복으로 넣은 작업: ${text}`);
      });
    }
    return {correct,total,errors};
  }
  function picture(name,cls=''){
    const asset=K.images[name];
    if(!asset)return `<span class="food-picture ${cls}" aria-hidden="true">${safe(name)}</span>`;
    if(asset.crop){
      const [x,y,width,height]=asset.crop,[sourceWidth,sourceHeight]=asset.size;
      // The inner viewport clips the PNG before outer aspect-ratio fitting, so adjacent ingredients cannot leak into letterboxing.
      return `<svg class="food-picture food-cutout ${cls}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" overflow="hidden"><image href="${safe(asset.file)}" width="${sourceWidth}" height="${sourceHeight}"/></svg></svg>`;
    }
    return `<img class="food-picture ${cls}" src="${safe(asset.file)}" alt="" draggable="false">`;
  }
  let app, drag=null, suppressClickUntil=0;
  const $=s=>document.querySelector(s);
  const session=()=>app.session();
  const state=()=>session().kitchen;
  const button=(op,label,cls='',attrs='')=>`<button type="button" class="${cls}" data-studio="${op}" ${attrs}>${label}</button>`;
  const ingAmount=i=>i.sharedDomi?'1마리 · 공동 지급':app.quantity(i.amounts);
  function orderedItems(){const s=session(),items=app.ingredients(s.pair),order=state().trayOrder;return items.sort((a,b)=>{const x=order.indexOf(a.name),y=order.indexOf(b.name);return (x<0?999:x)-(y<0?999:y);});}
  function foodButton(item,mode,extra=''){
    const selected=state().selected===item.name;
    return button('select-food',`${picture(item.name)}<span class="food-name">${safe(item.name)}</span>${mode==='tray'?`<small>${safe(ingAmount(item))}</small>`:''}`,`food ${mode} ${selected?'selected':''} ${extra}`,`data-food="${safe(item.name)}" data-drag="food" aria-pressed="${selected}" aria-label="${safe(item.name)}${mode==='placed'?' · 누르면 트레이로 돌아가기':''}" title="${safe(item.name)} · ${safe(ingAmount(item))}"`);
  }
  function selectionBar(stage){
    const s=session(),name=state().selected;
    return `<div class="selection-bar" role="status"><span>${name?`<b>${safe(name)}</b> 선택됨 · ${stage==='sort'?'접시':'도구'}를 눌러 놓으세요.`:'재료를 고른 다음 이미지 위의 '+(stage==='sort'?'접시':'도구')+'를 누르거나, 재료를 끌어 놓으세요. 올려놓은 재료를 다시 누르면 트레이로 돌아가요.'}</span>${name?button('unselect','선택 취소','text-button'):''}${name&&s.assignments[name]&&stage==='sort'&&!s.sortChecked?button('return-food','트레이로 돌려놓기','text-button'):''}</div>`;
  }
  function sorting(){
    const s=session(),items=orderedItems(),count=items.filter(i=>s.assignments[i.name]).length;
    const zoneName=z=>z==='both'?'두 메뉴 공통':menus.get(s.pair[z==='A'?0:1]).name;
    const plate=(zone)=>{
      const contents=items.filter(i=>s.assignments[i.name]===zone);
      return `<div class="plate-zone zone-${zone}">${button('place-food',`<span>${zone==='both'?'공통':zone+' 메뉴'}</span><b>${safe(zoneName(zone))}</b><small>${contents.length}종</small>`,'plate-target',`data-drop-zone="${zone}" aria-label="${safe(zoneName(zone))} 접시에 놓기" ${s.sortChecked?'disabled':''}`)}<div class="plate-foods" style="--tile:${Math.min((zone==='both'?26*.8/3:43*.86/4),(zone==='both'?24*.75:31*.79)/Math.max(1,Math.ceil(contents.length/(zone==='both'?3:4))))}">${contents.map(i=>foodButton(i,'placed',s.sortChecked?(i.zone===zone?'correct':'incorrect'):'')).join('')}</div></div>`;
    };
    $('#stage').innerHTML=`<div class="stage-head"><div class="eyebrow">01 / INGREDIENT PREP</div><h1>이 재료, 어디에 쓸까요?</h1><p>양식 연습처럼 재료 이미지를 메뉴별 접시 위로 옮겨 보세요.</p></div><div class="photo-layout"><div class="photo-column"><div class="counter sort-counter ${state().selected?'has-selection':''}"><img class="counter-bg" src="assets/kitchen-counter-bowls.png" alt="스테인리스 조리대 위 왼쪽·오른쪽 메뉴 접시와 아래 공통 접시" draggable="false">${['A','B','both'].map(plate).join('')}<span class="counter-caption">INGREDIENT STATION / 일식</span></div>${selectionBar('sort')}<div class="row between wrap"><span class="small muted">${count} / ${items.length}종 분류</span>${button('hint',state().hint?'힌트 닫기':'재료 용도 힌트','text-button',`aria-pressed="${state().hint}"`)}</div>${state().hint?`<div class="notice">${items.map(i=>`<span class="hint-line"><b>${safe(i.name)}</b> → ${safe(zoneName(i.zone))}</span>`).join('')}</div>`:''}</div><aside class="ingredient-tray"><div class="tray-title"><h2>지급 재료 트레이</h2><span>${items.length-count}종 남음</span></div><p class="small muted">이미지는 식별용 예시입니다. 재료 이름과 지급 상태를 함께 확인하세요.</p><div class="food-grid" data-drop-tray="true">${items.filter(i=>!s.assignments[i.name]).map(i=>foodButton(i,'tray')).join('')||'<div class="tray-done">✓ 모든 재료를 접시에 놓았어요.</div>'}</div></aside></div>${s.sortChecked?`<div class="sort-report"><h3>분류 확인 · ${items.filter(i=>s.assignments[i.name]===i.zone).length} / ${items.length}</h3><p class="small muted">틀린 재료는 접시에 주황색 테두리로 표시됩니다.</p>${items.filter(i=>s.assignments[i.name]!==i.zone).map(i=>`<p><b>${safe(i.name)}</b> → ${safe(zoneName(i.zone))}</p>`).join('')||'<p class="good">모든 재료를 알맞게 나눴어요.</p>'}</div>`:''}<div class="stage-actions">${s.sortChecked?button('sort-again','분류 다시 하기'):button('reset-sort','접시 비우기','text-button')}${app.action(s.sortChecked?'to-order':'check-sort',s.sortChecked?'순서 떠올리기 →':'분류 확인하기','primary')}</div>`;
  }
  function tabs(op){return `<div class="studio-tabs" role="group" aria-label="연습 메뉴">${session().pair.map((id,i)=>button(op,`<span>${i?'B':'A'}</span> ${safe(menus.get(id).name)}`,state().active===id?'active':'',`data-menu="${id}" aria-pressed="${state().active===id}"`)).join('')}</div>`;}
  function comparisonHTML(id,text){
    const m=menus.get(id),result=compare(text,m.steps),labels={match:'연결 후보',order:'순서 확인',review:'직접 확인'},highlight=window.ComparisonHighlights;
    return `<div class="comparison"><div class="row between wrap"><h3>예시와 문장 비교</h3><span class="small">${result.matched} / ${m.steps.length}개 연결 후보</span></div><p class="source-note">문장 속 단어를 비교한 참고 표시입니다. 표현이 다르면 빠진 것으로 보일 수 있어 직접 확인하세요.</p>${highlight.toolbar()}${result.rows.map(r=>`<div class="compare-line ${r.status}"><span>${labels[r.status]}</span>${highlight.writing(m,r.text)}${r.step!==undefined?`<small>예시 ${r.step+1}번과 비교</small>${highlight.step(m,r.step)}`:''}</div>`).join('')}${result.missing.length?`<div class="missing"><b>함께 다시 볼 예시 ${result.missing.length}개</b>${result.missing.map(n=>`<div><small>수업 ${n+1}단계</small>${highlight.step(m,n)}</div>`).join('')}</div>`:''}<details><summary>전체 학습용 예시 보기</summary><ol>${m.steps.map((t,i)=>`<li>${highlight.step(m,i)}</li>`).join('')}</ol></details></div>`;
  }
  function recall(){
    const s=session(),id=state().active,m=menus.get(id);
    $('#stage').innerHTML=`<div class="stage-head"><div class="eyebrow">03 / RECALL</div><h1>기억한 순서를 직접 써 보세요</h1><p>한 줄에 한 작업씩 적고, 예시와 비교해 빠뜨린 흐름을 확인해요.</p></div>${tabs('recall-tab')}<div class="recall-workspace"><div><label for="recall-${id}" class="recall-label">${safe(m.name)} · 내가 떠올린 순서</label><textarea class="recall-writing" id="recall-${id}" data-recall="${id}" maxlength="10000" placeholder="1. 먼저 준비할 재료와 다시는…&#10;2. 재료 손질이 끝나면…&#10;3. 익힌 뒤에는…&#10;4. 마지막으로 담을 때는…">${safe(s.recall[id])}</textarea><span class="small muted">입력한 내용은 자동 저장됩니다.</span><div class="row wrap recall-controls">${button('compare-recall','예시와 비교하기','primary')}${button('save-wrong','오답노트에 저장')}</div></div><aside id="recall-comparison">${s.compare?comparisonHTML(id,s.recall[id]):`<div class="recall-placeholder"><span>03</span><h3>먼저 스스로 떠올려요</h3><p>비교하기를 누르면 내가 쓴 순서 옆에<br>빠진 작업과 순서 확인 항목이 표시됩니다.</p></div>`}</aside></div><div class="stage-actions">${app.action('to-order','← 순서 떠올리기','text-button')}${app.action('finish','연습 마치고 결과 보기 →','primary')}</div>`;
  }
  function toolButton(tool){const [x,y,right,bottom]=tool.rect;return button('tool',`<span>${safe(tool.name)}</span>`,'tool-hotspot',`data-tool="${tool.id}" data-drop-tool="${tool.id}" style="left:${x}%;top:${y}%;width:${right-x}%;height:${bottom-y}%" aria-label="${safe(tool.name)} 작업 선택"`);}
  function ordering(){
    const s=session(),k=state(),items=orderedItems();
    $('#stage').innerHTML=`<div class="stage-head"><div class="eyebrow">02 / KITCHEN PRACTICE</div><h1>조리대 위에서 순서를 만들어요</h1><p>재료를 도구 위에 놓고 작업을 고르면, 메뉴별 조리 순서에 쌓입니다.</p></div><div class="kitchen-layout"><div class="photo-column"><div class="counter cook-counter ${k.selected?'has-selection':''} ${k.toolLabels?'labels-on':''}"><img class="counter-bg" src="assets/kitchen-counter-order.png" alt="팬, 냄비, 싱크대, 준비 볼, 접시, 행주와 도마가 놓인 조리대" draggable="false">${K.tools.map(toolButton).join('')}${Object.entries(k.positions).map(([name,p])=>{const item=items.find(i=>i.name===name);return `<div class="station-food" style="left:${p.x}%;top:${p.y}%">${foodButton(item,'placed')}</div>`;}).join('')}</div>${selectionBar('cook')}<div class="row between wrap station-controls">${button('tool-labels',k.toolLabels?'도구 이름 숨기기':'도구 이름 보기','text-button',`aria-pressed="${k.toolLabels}"`)}${button('clear-station','조리대 재료 정리','text-button')}${button('all-cards','전체 작업 카드','text-button')}</div><div class="cooking-tray"><div class="tray-title"><h3>분류한 재료</h3><span>끌어서 순서도 바꿀 수 있어요</span></div><div class="food-grid" data-drop-tray="true">${items.map(i=>`<div class="cook-food-wrap ${k.positions[i.name]?'on-counter':''}" data-tray-food="${safe(i.name)}">${foodButton(i,'tray')}<span class="tray-menu ${i.zone}">${i.zone==='both'?'공통':i.zone+' 메뉴'}</span></div>`).join('')}</div></div></div><aside class="timeline-panel"><div class="timeline-head"><h2>나의 조리 순서</h2><p class="small muted">카드를 끌거나 화살표로 순서를 바꾸세요.</p></div>${tabs('cook-tab')}<div id="timeline-content">${timelineHTML(k.active)}</div><div class="timeline-footer">${button('add-custom','＋ 나만의 작업 추가','text-button')}${button('hygiene','손 씻기 · 위생 작업','text-button')}</div><details class="learning-example"><summary>학습용 예시 순서 확인</summary><ol>${menus.get(k.active).steps.map((t,i)=>`<li>${window.RecipeBlanks.trigger(t,menus.get(k.active).name+' · '+(i+1)+'번 설명',k.active)}</li>`).join('')}</ol></details><p class="source-note">두 메뉴를 오가며 조립할 수 있습니다. 조리대의 여러 도구는 작업 선택용이며 실제 시험은 화구 1개 기준입니다.</p></aside></div><div class="stage-actions">${button('back-sort','← 재료 다시 보기','text-button')}${app.action('to-recall','순서 완성하기 →','primary')}</div>`;
  }
  function timelineHTML(id){
    const entries=state().timelines[id],stepCount=new Set(entries.filter(e=>e.kind==='step').map(e=>e.step)).size;
    return `<div class="timeline-progress"><span>예시 작업 ${stepCount} / ${menus.get(id).steps.length}개</span><span>${entries.length}개 카드</span></div><ol class="timeline" data-timeline="${id}">${entries.map((e,index)=>`<li class="timeline-card ${e.kind}" data-entry="${e.key}" data-menu="${id}" data-drag="entry"><div class="timeline-card-top"><span>${String(index+1).padStart(2,'0')} <small>${e.kind==='step'?'조리':e.kind==='hygiene'?'위생':'내 작업'}</small></span><div class="card-controls">${button('move-entry','↑','mini',`data-key="${e.key}" data-dir="-1" aria-label="${index+1}번 작업 위로" ${index===0?'disabled':''}`)}${button('move-entry','↓','mini',`data-key="${e.key}" data-dir="1" aria-label="${index+1}번 작업 아래로" ${index===entries.length-1?'disabled':''}`)}${e.kind==='custom'?button('edit-custom','수정','mini',`data-key="${e.key}"`):''}${button('remove-entry','×','mini',`data-key="${e.key}" aria-label="${index+1}번 작업 삭제"`)}</div></div>${window.RecipeCardBlanks.render(entryText(e,id),e.key,menus.get(id).name+' · '+(index+1)+'번 작업')}</li>`).join('')||'<li class="timeline-empty"><span>＋</span><b>첫 작업을 골라 주세요</b><p>왼쪽 조리대에서 재료와 도구를 선택하거나 위생 작업부터 시작해요.</p></li>'}</ol>`;
  }
  function candidates(tool,ingredient){
    return session().pair.flatMap(id=>K.steps[id].map((meta,step)=>({id,step,meta}))).filter(c=>(!tool||c.meta.tools.includes(tool))&&(!ingredient||c.meta.ingredients.includes(ingredient)));
  }
  function showCards(tool='',ingredient=''){
    const k=state(),s=session(),toolName=K.tools.find(t=>t.id===tool)?.name||'전체 도구',cards=candidates(tool,ingredient),actions=K.hygiene.filter(h=>!tool||h.tool===tool);
    app.dialog(ingredient?`${safe(ingredient)} · ${safe(toolName)}`:`${safe(toolName)} 작업`,`${ingredient?`<p class="source-note">이 재료와 도구를 사용하는 작업입니다. 추가할 메뉴를 확인해 주세요.</p>`:'<p class="source-note">메뉴별 작업을 골라 원하는 순서대로 추가하세요.</p>'}<div class="work-choices">${cards.map(c=>{const m=menus.get(c.id),done=k.timelines[c.id].some(e=>e.kind==='step'&&e.step===c.step);if(window.RecipeBlanks.parse(m.steps[c.step]).length)return `<article class="work-choice"><span class="work-menu">${safe(m.name)} ${done?'<em>추가됨 · 다시 추가 가능</em>':''}</span>${window.RecipeBlanks.trigger(m.steps[c.step],m.name+' · 작업 설명',m.id)}<div class="work-choice-add"><small>${c.meta.tools.map(t=>K.tools.find(x=>x.id===t).name).join(' · ')}</small>${button('add-step','＋ 순서에 추가','',`data-menu="${c.id}" data-step="${c.step}"`)}</div></article>`;return button('add-step',`<span class="work-menu">${safe(m.name)} ${done?'<em>추가됨 · 다시 추가 가능</em>':''}</span><p>${window.RecipeReference?.format(m.id,m.steps[c.step])||safe(m.steps[c.step])}</p><small>${c.meta.tools.map(t=>K.tools.find(x=>x.id===t).name).join(' · ')} <b>＋ 순서에 추가</b></small>`,'work-choice',`data-menu="${c.id}" data-step="${c.step}"`);}).join('')||'<div class="empty compact"><h3>이 조합의 예시 작업은 없어요</h3><p>다른 도구를 선택하거나 직접 작업을 적을 수 있어요.</p></div>'}</div>${!ingredient&&actions.length?`<div class="hygiene-choices"><h3>위생 · 정리 작업</h3>${actions.map(h=>button('add-hygiene',h.name,'',`data-hygiene="${h.id}"`)).join('')}<p class="source-note">공통 위생 작업은 두 메뉴 순서에 함께 추가됩니다.</p></div>`:''}`,button('add-custom','직접 작업 입력')+app.action('close','닫기'));
  }
  function saveChange(render){app.save();if(render)render();}
  function place(zone){const s=session(),k=state(),name=k.selected;if(!name){app.toast('트레이의 재료를 먼저 선택하세요.');return;}if(s.sortChecked)return;s.assignments[name]=zone;k.selected='';saveChange(sorting);app.toast(`${name}을 ${zone==='both'?'공통':zone+' 메뉴'} 접시에 놓았어요.`);}
  function putTool(tool,point){
    const k=state(),name=k.selected,t=K.tools.find(t=>t.id===tool);if(!t)return;
    if(name){const [x,y,r,b]=t.rect;k.positions[name]={tool,x:point?clamp(point.x,x+2,r-2):(x+r)/2,y:point?clamp(point.y,y+2,b-2):(y+b)/2};saveChange(ordering);}
    showCards(tool,name);
  }
  function addEntry(id,entry){const a=state().timelines[id];if(a.length>=120){app.toast('메뉴별 카드는 120개까지 저장할 수 있어요.');return false;}a.push({key:uid(),...entry});return true;}
  function customDialog(key){const id=state().active,e=state().timelines[id].find(e=>e.key===key);app.dialog(e?'내 작업 수정':'나만의 작업 추가',`<p class="source-note">${safe(menus.get(id).name)} 순서에 들어갑니다. 직접 쓴 작업은 자동 비교에서 제외됩니다.</p><label class="field">작업 내용<textarea id="custom-step" maxlength="1200" placeholder="예: 도미 손질 후 칼·도마를 세척하고 채소를 손질한다.">${safe(e?.text||'')}</textarea></label>`,app.action('close','취소')+button('save-custom','저장','primary',key?`data-key="${key}"`:''));}
  function renderWrong(wrong){return wrong.length?`<div class="note-list">${wrong.map(w=>`<article class="panel"><div class="row between wrap"><div><h3>${safe(menus.get(w.menu).name)}</h3><span class="small muted">${new Date(w.when).toLocaleString('ko-KR')}</span></div>${button('delete-wrong','삭제','text-button',`data-wrong="${safe(w.id)}"`)}</div><div class="note-entry">${safe(w.text)}</div><details><summary>예시와 다시 비교</summary>${comparisonHTML(w.menu,w.text)}</details></article>`).join('')}</div>`:'<div class="empty"><h2>비교하며 발견한 부분을 모아요</h2><p>순서 완성하기에서 ‘오답노트에 저장’을 누르면 여기에서 다시 볼 수 있어요.</p></div>';}
  function init(controller){app=controller;
    document.addEventListener('click',event=>{
      if(Date.now()<suppressClickUntil&&(event.target.closest('[data-studio]')||event.target.closest('[data-drag]'))){event.preventDefault();return;}
      const b=event.target.closest('[data-studio]');if(!b||b.disabled)return;
      const op=b.dataset.studio;
      if(op==='delete-wrong'){app.removeWrong(b.dataset.wrong);return;}
      if(!session())return;
      const s=session(),k=state(),id=k.active;
      if(op==='select-food'){
        if(b.classList.contains('placed')){
          if(s.stage===0){delete s.assignments[b.dataset.food];s.sortChecked=false;}
          else if(s.stage===1)delete k.positions[b.dataset.food];
          else return;
          k.selected='';suppressClickUntil=Date.now()+400;
          saveChange(s.stage===0?sorting:ordering);
          app.toast(`${b.dataset.food}을 트레이로 돌려놓았어요.`);
          if(event.detail===0)$(`.food.tray[data-food="${b.dataset.food}"]`)?.focus({preventScroll:true});
          return;
        }
        if(s.stage===0&&s.sortChecked){app.toast('분류 다시 하기를 누르면 재료를 옮길 수 있어요.');return;}
        k.selected=k.selected===b.dataset.food?'':b.dataset.food;saveChange(s.stage===0?sorting:ordering);
        if(event.detail===0&&k.selected)$(s.stage===0?'[data-drop-zone]':'[data-drop-tool]')?.focus({preventScroll:true});return;
      }
      if(op==='unselect'){k.selected='';saveChange(s.stage===0?sorting:ordering);return;}
      if(op==='place-food'){place(b.dataset.dropZone);return;}
      if(op==='return-food'){if(s.sortChecked)return;delete s.assignments[k.selected];k.selected='';saveChange(sorting);return;}
      if(op==='hint'){k.hint=!k.hint;saveChange(sorting);return;}
      if(op==='reset-sort'||op==='sort-again'){if(op==='reset-sort')s.assignments={};s.sortChecked=false;saveChange(sorting);return;}
      if(op==='back-sort'){s.stage=0;saveChange(app.render);return;}
      if(op==='recall-tab'||op==='cook-tab'){k.active=b.dataset.menu;saveChange(op==='recall-tab'?recall:ordering);return;}
      if(op==='compare-recall'){if(!s.recall[id]?.trim()){app.toast('먼저 기억한 순서를 적어 주세요.');return;}s.compare=true;saveChange(recall);return;}
      if(op==='save-wrong'){const text=s.recall[id]?.trim();if(!text){app.toast('저장할 순서를 먼저 적어 주세요.');return;}app.addWrong({id:uid(),menu:id,text,when:Date.now()});app.toast('오답노트에 저장했어요. 내 학습 노트에서 다시 볼 수 있습니다.');return;}
      if(op==='tool-labels'){k.toolLabels=!k.toolLabels;saveChange(ordering);return;}
      if(op==='tool'){putTool(b.dataset.tool);return;}
      if(op==='all-cards'){showCards();return;}
      if(op==='clear-station'){k.positions={};k.selected='';saveChange(ordering);return;}
      if(op==='add-step'){const target=b.dataset.menu;if(addEntry(target,{kind:'step',step:Number(b.dataset.step)})){k.active=target;k.selected='';app.close();saveChange(ordering);app.toast(`${menus.get(target).name} 순서에 추가했어요.`);}return;}
      if(op==='hygiene'){app.dialog('위생 · 정리 작업',`<p class="source-note">공통 작업은 두 메뉴의 현재 마지막 순서에 함께 들어갑니다. 필요에 따라 옮기거나 삭제할 수 있어요.</p><div class="hygiene-choices">${K.hygiene.map(h=>button('add-hygiene',h.name,'',`data-hygiene="${h.id}"`)).join('')}</div>`,app.action('close','닫기'));return;}
      if(op==='add-hygiene'){if(s.pair.some(m=>k.timelines[m].length>=120)){app.toast('위생 작업을 추가하려면 카드 수를 줄여 주세요.');return;}s.pair.forEach(m=>addEntry(m,{kind:'hygiene',action:b.dataset.hygiene}));k.selected='';app.close();saveChange(ordering);app.toast('두 메뉴의 순서에 위생 작업을 추가했어요.');return;}
      if(op==='add-custom'||op==='edit-custom'){customDialog(b.dataset.key);return;}
      if(op==='save-custom'){const text=$('#custom-step').value.trim();if(!text){app.toast('작업 내용을 입력해 주세요.');return;}const entry=k.timelines[id].find(e=>e.key===b.dataset.key);if(entry)entry.text=text;else if(!addEntry(id,{kind:'custom',text}))return;app.close();saveChange(ordering);return;}
      if(op==='move-entry'){const a=k.timelines[id],from=a.findIndex(e=>e.key===b.dataset.key),to=from+Number(b.dataset.dir);if(from<0||to<0||to>=a.length)return;[a[from],a[to]]=[a[to],a[from]];saveChange(ordering);$(`[data-key="${b.dataset.key}"][data-dir="${b.dataset.dir}"]`)?.focus({preventScroll:true});return;}
      if(op==='remove-entry'){k.timelines[id]=k.timelines[id].filter(e=>e.key!==b.dataset.key);saveChange(ordering);return;}
    });
    document.addEventListener('input',event=>{if(event.target.dataset.recall&&session()?.compare){$('#recall-comparison').innerHTML='<p class="notice">입력 내용이 바뀌었어요. 비교하기를 눌러 다시 확인하세요.</p>';session().compare=false;app.save();}});
    document.addEventListener('pointerdown',event=>{
      const source=event.target.closest('[data-drag]');if(!source||event.button!==0||!session()||event.target.closest('.card-controls,[data-blank-open],[data-card-blank-key]'))return;
      if(source.dataset.drag==='food'&&session().stage===0&&session().sortChecked)return;
      drag={source,kind:source.dataset.drag,name:source.dataset.food,key:source.dataset.entry,menu:source.dataset.menu,x:event.clientX,y:event.clientY,id:event.pointerId,ghost:null};
    });
    document.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<9)return;
      if(!drag.ghost){drag.ghost=drag.source.cloneNode(true);drag.ghost.classList.add('drag-ghost');drag.ghost.removeAttribute('id');drag.ghost.setAttribute('aria-hidden','true');document.body.append(drag.ghost);drag.source.classList.add('dragging');drag.clientY=event.clientY;drag.frame=requestAnimationFrame(scrollDrag);}
      drag.clientY=event.clientY;
      event.preventDefault();drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
      document.querySelectorAll('.drop-over').forEach(n=>n.classList.remove('drop-over'));
      const under=document.elementFromPoint(event.clientX,event.clientY),target=under?.closest('[data-drop-zone],[data-drop-tool],[data-drop-tray],[data-entry]');target?.classList.add('drop-over');
    },{passive:false});
    document.addEventListener('pointerup',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const d=drag,wasDragging=!!d.ghost,target=document.elementFromPoint(event.clientX,event.clientY);cleanupDrag();if(!wasDragging)return;
      suppressClickUntil=Date.now()+400;if(!session())return;
      if(d.kind==='entry'){
        const hit=target?.closest('[data-entry]');if(!hit||hit.dataset.menu!==d.menu)return;
        const a=state().timelines[d.menu],from=a.findIndex(e=>e.key===d.key),to=a.findIndex(e=>e.key===hit.dataset.entry);if(from<0||to<0||from===to)return;
        a.splice(to,0,a.splice(from,1)[0]);saveChange(ordering);return;
      }
      state().selected=d.name;
      const zone=target?.closest('[data-drop-zone],.plate-zone')?.dataset.dropZone||target?.closest('.plate-zone')?.querySelector('[data-drop-zone]')?.dataset.dropZone;
      if(session().stage===0){if(zone){place(zone);return;}if(target?.closest('[data-drop-tray]')){delete session().assignments[d.name];state().selected='';saveChange(sorting);return;}sorting();return;}
      let tool=target?.closest('[data-drop-tool]')?.dataset.dropTool;
      const surface=$('.cook-counter'),rect=surface.getBoundingClientRect(),point={x:(event.clientX-rect.left)/rect.width*100,y:(event.clientY-rect.top)/rect.height*100};
      if(!tool&&point.x>=0&&point.x<=100&&point.y>=0&&point.y<=100)tool=K.tools.find(t=>point.x>=t.rect[0]&&point.x<=t.rect[2]&&point.y>=t.rect[1]&&point.y<=t.rect[3])?.id;
      if(tool){putTool(tool,point);return;}
      const over=target?.closest('[data-tray-food]')?.dataset.trayFood;
      if(over&&over!==d.name){const all=orderedItems().map(i=>i.name),from=all.indexOf(d.name),to=all.indexOf(over);all.splice(to,0,all.splice(from,1)[0]);state().trayOrder=all;}
      if(target?.closest('[data-drop-tray]'))delete state().positions[d.name];
      state().selected='';saveChange(ordering);
    });
    document.addEventListener('pointercancel',cleanupDrag);
    window.addEventListener('blur',cleanupDrag);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){cleanupDrag();if(session()?.kitchen.selected&&!$('#dialog').open){state().selected='';session().stage===0?sorting():session().stage===1?ordering():null;}}});
  }
  function scrollDrag(){
    if(!drag?.ghost)return;
    const margin=60,y=drag.clientY,height=window.innerHeight;
    const dy=y<margin?-Math.ceil((margin-y)/5):y>height-margin?Math.ceil((y-height+margin)/5):0;
    if(dy)window.scrollBy(0,dy);
    drag.frame=requestAnimationFrame(scrollDrag);
  }
  function cleanupDrag(){if(drag){drag.source.classList.remove('dragging');drag.ghost?.remove();if(drag.frame)cancelAnimationFrame(drag.frame);}drag=null;document.querySelectorAll('.drop-over').forEach(n=>n.classList.remove('drop-over'));}
  return {clean,cleanWrong,compare,assess,picture,init,sorting,recall,ordering,renderWrong,entryText};
})();
