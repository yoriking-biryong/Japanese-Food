'use strict';
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const menus = window.MENUS;
  const byId = new Map(menus.map(m => [m.id,m]));
  const KEY = 'ilsik-study:v1';
  const newId = () => globalThis.crypto?.randomUUID?.() || `jp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const defaults = () => ({version:1,selected:['jp-14','jp-04'],examDate:'',notes:{},reviewed:[],history:[],wrong:[],session:null});
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pairValid = value => Array.isArray(value)&&value.length===2&&value[0]!==value[1]&&value.every(id=>byId.has(id));
  const dateValid = value => {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(value+'T12:00:00');
    return Number.isFinite(date.getTime())&&date.getFullYear()===Number(value.slice(0,4))&&date.getMonth()+1===Number(value.slice(5,7))&&date.getDate()===Number(value.slice(8,10));
  };
  const shuffle = input => {const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const formatTime = seconds => {const n=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
  const practiceIngredients = m => m.ingredients;
  const mergeIngredients = ids => {
    const merged=new Map();
    ids.forEach((id,index)=>practiceIngredients(byId.get(id)).forEach(item=>{
      if(!merged.has(item.name))merged.set(item.name,{name:item.name,slots:[],amounts:[]});
      const entry=merged.get(item.name);entry.slots.push(index===0?'A':'B');entry.amounts.push(item.amount);
    }));
    return [...merged.values()].map(item=>({...item,zone:item.slots.length===2?'both':item.slots[0],sharedDomi:item.name==='도미'&&item.slots.length===2&&ids.includes('jp-02')}));
  };
  const quantity = amounts => {
    if(amounts.length===1)return amounts[0];
    const parts=amounts.map(x=>x.match(/^(\d+(?:\/\d+|\.\d+)?)(g|mL|개|쪽|토막|장|포기|알|마리)$/));
    if(parts.every(Boolean)&&parts[0][2]===parts[1][2]){
      const fractions=parts.map(x=>x[1].includes('/')?x[1].split('/').map(Number):[Number(x[1]),1]);
      if(fractions.every(([n,d])=>Number.isInteger(n)&&Number.isInteger(d))){
        let numerator=fractions[0][0]*fractions[1][1]+fractions[1][0]*fractions[0][1],denominator=fractions[0][1]*fractions[1][1];
        const gcd=(a,b)=>b?gcd(b,a%b):a,divisor=gcd(numerator,denominator);numerator/=divisor;denominator/=divisor;
        const whole=Math.floor(numerator/denominator),remainder=numerator%denominator;
        return `${remainder?(whole?whole+' ':'')+remainder+'/'+denominator:whole}${parts[0][2]}`;
      }
      return amounts.join(' + ');
    }
    return amounts.join(' + ');
  };
  let storageIssue='';
  const sanitizeSession = s => {
    if(!s||!pairValid(s.pair)||!Number.isInteger(s.stage)||s.stage<0||s.stage>2||!Number.isFinite(s.duration)||s.duration<60||s.duration>10800)return null;
    if(!s.orders||!Number.isFinite(s.remaining)||s.remaining<0||s.remaining>s.duration)return null;
    // Reordered steps keep saved cards attached to the same cooking action.
    const reordered=s.pair.filter(id=>{
      const r=byId.get(id).stepReorder;
      return r&&(s.recipeVersions?.[id]||1)===r.fromVersion&&(byId.get(id).recipeVersion||1)===r.toVersion;
    });
    if(reordered.length){
      s=JSON.parse(JSON.stringify(s));
      for(const id of reordered){
        const indices=byId.get(id).stepReorder.indices;
        const remap=n=>Number.isInteger(n)&&n>=0&&n<indices.length?indices[n]:n;
        if(Array.isArray(s.orders[id]))s.orders[id]=s.orders[id].map(remap);
        if(Array.isArray(s.kitchen?.timelines?.[id]))s.kitchen.timelines[id]=s.kitchen.timelines[id].map(e=>e?.kind==='step'?{...e,step:remap(e.step)}:e);
        s.recipeVersions={...(s.recipeVersions||{}),[id]:byId.get(id).recipeVersion};
      }
    }
    const changedRecipes=s.pair.filter(id=>byId.get(id).previousSteps&&(s.recipeVersions?.[id]||1)!==(byId.get(id).recipeVersion||1));
    if(changedRecipes.length){
      s=JSON.parse(JSON.stringify(s));
      const oldKitchen=s.kitchen;
      const timelines=Object.fromEntries(s.pair.map(id=>{
        const entries=Array.isArray(oldKitchen?.timelines?.[id])?oldKitchen.timelines[id]:(!oldKitchen&&s.stage===(s.flowVersion===2?1:2)&&Array.isArray(s.orders[id])?s.orders[id].map(step=>({kind:'step',step})):[]);
        return [id,changedRecipes.includes(id)?entries.map(e=>e?.kind==='step'?{kind:'custom',text:byId.get(id).previousSteps[e.step]||'이전 레시피 작업'}:e):entries];
      }));
      s.kitchen={...(oldKitchen||{}),timelines};
      changedRecipes.forEach(id=>{s.orders[id]=[];});
      storageIssue=changedRecipes.map(id=>byId.get(id).name).join(' · ')+'을 수업 레시피로 갱신했어요. 이전 작업 카드는 직접 쓴 작업으로 보존했습니다.';
    }
    const orders={};
    for(const id of s.pair){const a=s.orders[id],length=byId.get(id).steps.length;
      if(!Array.isArray(a)||(a.length!==0&&a.length!==length)||new Set(a).size!==a.length||!a.every(n=>Number.isInteger(n)&&n>=0&&n<length))return null;
      orders[id]=[...a];
    }
    const ingredients=mergeIngredients(s.pair),validNames=new Set(ingredients.map(x=>x.name));
    const assignments=Object.fromEntries(Object.entries(s.assignments||{}).map(([name,zone])=>[window.RecipeBlanks.normalizeSeasoning(name),zone]).filter(([name,zone])=>validNames.has(name)&&['A','B','both'].includes(zone)));
    const recall=Object.fromEntries(s.pair.map(id=>[id,typeof s.recall?.[id]==='string'?s.recall[id].slice(0,10000):'']));
    const speed=[1,2,4].includes(s.speed)?s.speed:1;
    const remaining=s.running&&Number.isFinite(s.deadline)?Math.max(0,Math.min(s.duration,(s.deadline-Date.now())/1000*speed)):s.remaining;
    const sortChecked=!!s.sortChecked&&ingredients.every(i=>assignments[i.name]);
    return {id:typeof s.id==='string'?s.id:newId(),pair:[...s.pair],flowVersion:2,stage:sortChecked?(s.flowVersion===2?s.stage:s.stage===1?2:s.stage===2?1:0):0,duration:s.duration,remaining,running:false,deadline:0,assignments,recall,orders,sortChecked,compare:!!s.compare,speed,recipeVersions:Object.fromEntries(s.pair.map(id=>[id,byId.get(id).recipeVersion||1])),kitchen:window.StudyStudio.clean(s)};
  };
  const load = () => {
    const clean=defaults();
    try{
      const raw=localStorage.getItem(KEY);if(!raw)return clean;
      const x=JSON.parse(raw);if(!x||x.version!==1)throw Error('version');
      if(pairValid(x.selected))clean.selected=x.selected;
      if(typeof x.examDate==='string'&&dateValid(x.examDate))clean.examDate=x.examDate;
      for(const [id,note] of Object.entries(x.notes||{}))if(byId.has(id)&&typeof note==='string'&&note.trim())clean.notes[id]=note.slice(0,10000);
      clean.reviewed=Array.isArray(x.reviewed)?[...new Set(x.reviewed.filter(id=>byId.has(id)))]:[];
      clean.history=Array.isArray(x.history)?x.history.filter(h=>h&&typeof h.id==='string'&&pairValid(h.pair)&&Number.isFinite(h.when)&&h.when>0&&Number.isFinite(h.elapsed)&&h.elapsed>=0&&h.elapsed<=10800&&Number.isInteger(h.sortCorrect)&&Number.isInteger(h.sortTotal)&&h.sortTotal>0&&h.sortCorrect>=0&&h.sortCorrect<=h.sortTotal&&Number.isInteger(h.orderCorrect)&&Number.isInteger(h.orderTotal)&&h.orderTotal>0&&h.orderCorrect>=0&&h.orderCorrect<=h.orderTotal&&Array.isArray(h.errors)&&h.errors.length<200&&h.errors.every(e=>typeof e==='string'&&e.length<=2000)&&h.recall&&h.pair.every(id=>typeof h.recall[id]==='string'&&h.recall[id].length<=10000)).slice(0,100):[];
      clean.wrong=window.StudyStudio.cleanWrong(x.wrong);
      clean.session=sanitizeSession(x.session);
      if(x.session&&!clean.session)storageIssue='저장된 연습 형식을 읽지 못했습니다. 새 연습을 시작할 수 있어요.';
      return clean;
    }catch{storageIssue='저장된 데이터를 읽지 못했습니다. 이번 화면은 기본 상태로 열었어요.';return clean;}
  };
  let data=load(), view='practice', guideQuery='', guideCategory='전체', noteTab='highlights', toastTimeout, lastFocus;
  let previewMinutes=data.selected.reduce((n,id)=>n+byId.get(id).minutes,0);
  const save = () => {
    try{localStorage.setItem(KEY,JSON.stringify(data));return true;}
    catch{toast('브라우저에 저장할 수 없습니다. 현재 창에서는 계속 연습할 수 있어요.');return false;}
  };
  function toast(message){const box=$('#toast');box.textContent=message;box.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>box.classList.remove('show'),4200);}
  const action = (name,label,cls='',attrs='') => `<button type="button" class="${cls}" data-action="${name}" ${attrs}>${label}</button>`;
  const selectedMenus = () => data.selected.map(id=>byId.get(id));
  const zoneLabel = (zone,pair) => zone==='both'?'공통':zone==='A'?byId.get(pair[0]).name:zone==='B'?byId.get(pair[1]).name:'미분류';
  const list = items => `<ul class="requirements">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  const stepContent = (m,index) => window.RecipeBlanks.trigger(m.steps[index],m.name+' · '+(index+1)+'번 설명');
  const sequence = m => (window.LessonStudy?.render(m)||'<ol class="lesson-sequence">'+m.steps.map((_,index)=>'<li>'+stepContent(m,index)+'</li>').join('')+'</ol>')+(window.ClassroomRecipes?.forMenu(m.id)||'');
  const requirementsContent = m => (window.OfficialRequirements?.render(m)||list(m.requirements))+(window.ClassroomRecipes?.notes(m)||'');
  function openDialog(title,body,actions=''){
    lastFocus=document.activeElement;
    $('#dialog-content').innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${title}</h2>${action('close','×','close','aria-label="닫기"')}</div>${body}${actions?`<div class="dialog-actions">${actions}</div>`:''}`;
    if(!$('#dialog').open)$('#dialog').showModal();
  }
  function closeDialog(){$('#dialog').close();}
  function render(focus=false){
    document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.toggle('active',b.dataset.nav===view);if(b.dataset.nav===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(view==='guide')renderGuide();else if(view==='notes')renderNotes();else if(view==='session'&&data.session)renderSession();else renderHome();
    if(focus){$('#main').focus({preventScroll:true});window.scrollTo({top:0});}
  }
  function renderHome(){
    const [a,b]=selectedMenus();
    let dday='날짜 미설정',dateText='시험일을 정하고 차근차근 준비해요.';
    if(data.examDate){const today=new Date();today.setHours(12,0,0,0);const days=Math.round((new Date(data.examDate+'T12:00:00')-today)/86400000);dday=days===0?'D-DAY':days>0?'D-'+days:'D+'+(-days);dateText=new Date(data.examDate+'T12:00:00').toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});}
    const shared=mergeIngredients(data.selected).filter(i=>i.zone==='both').length;
    const pairCard=(m,index)=>'<article class="dish-card '+(index?'b':'')+'"><div class="row between"><span class="dish-index">MENU '+(index?'B':'A')+'</span><span class="dish-category">'+m.category+'</span></div>'+window.RecipePhotos.card(m)+'<h3>'+m.name+'</h3><p class="category" data-focus-menu="'+m.id+'">'+window.SummaryEditor.html(m)+'</p><div class="time"><strong>'+m.minutes+'</strong><span>분 / 과제 시간</span><button class="text-button" data-action="detail" data-id="'+m.id+'" aria-label="'+m.name+' 핵심 규격 보기">규격 보기 ↗</button></div></article>';
    $('#main').innerHTML=`<div class="page-head"><div><div class="eyebrow">JAPANESE COOKING / PRACTICE NOTE</div><h1>오늘의 실기 연습</h1><p>두 메뉴를 함께 준비하며, 재료와 조리 흐름을 익혀요.</p></div><span class="badge">2026 공개과제 · ${menus.length}품목</span></div>
      ${data.session?`<div class="resume"><div><b>이어서 할 연습이 있어요</b><p class="small muted">${data.session.pair.map(id=>byId.get(id).name).join(' + ')} · ${['재료 분류','순서 떠올리기','순서 완성하기'][data.session.stage]}</p></div>${action('resume','이어서 연습','primary')}</div>`:''}
      <section id="home-summary" class="panel home-summary" aria-labelledby="home-summary-title"></section>
      <section id="qnet-schedule"></section>
      <div class="workspace"><div><section class="panel practice-panel"><div class="panel-head"><div><span class="section-label">01 — 오늘의 조합</span><h2>어떤 메뉴를 연습할까요?</h2></div><div class="row">${action('random','↻','shuffle-button','aria-label="두 메뉴 무작위 선택" title="무작위 선택"')}${action('choose','메뉴 변경','text-button')}</div></div><div class="pair">${pairCard(a,0)}${pairCard(b,1)}</div><div class="session-summary"><span>공통 재료 <strong>${shared}종</strong></span><span>연습 시간 <strong>${previewMinutes}분</strong> ${action('duration','설정','text-button')}</span></div>${action('start','연습 시작하기 <span>요구사항 확인 후 시작 &nbsp; →</span>','primary start-button')}</section>
      <section class="panel flow-panel"><div class="panel-head"><h2>재료부터 완성까지</h2><span class="small muted">3단계 연습</span></div><div class="flow"><div class="flow-item"><div class="number">01</div><h3>재료 나누기</h3><p>이미지 위 접시에 재료 옮기기</p></div><div class="flow-item"><div class="number">02</div><h3>순서 떠올리기</h3><p>도구 선택으로 나만의 순서 만들기</p></div><div class="flow-item"><div class="number">03</div><h3>순서 완성하기</h3><p>직접 입력 · 문장 비교 · 오답노트</p></div></div></section><p class="source-note">큐넷 공개과제의 규격·시간·지급재료를 요약했습니다. 조리 흐름은 학습용 예시이며 연습 결과는 공식 시험 점수가 아닙니다.</p></div>
      <aside class="sidebar"><section class="panel date-block"><div class="row between"><h2>나의 실기 시험일</h2>${action('date','설정','text-button')}</div><div class="date-number">${dday}</div><p class="small muted">${dateText}</p></section><section class="panel"><h2>나의 학습 현황</h2><div class="stats"><div class="stat"><b>${data.reviewed.length}<span> / ${menus.length}</span></b><span>도감 학습 완료</span></div><div class="stat"><b>${data.history.length}</b><span>완료한 연습</span></div></div><div class="progress" role="progressbar" aria-label="도감 학습 완료" aria-valuemin="0" aria-valuemax="${menus.length}" aria-valuenow="${data.reviewed.length}"><span style="width:${data.reviewed.length/menus.length*100}%"></span></div>${action('notes','내 학습 노트 <span>→</span>','quick-link')}</section><section class="panel tip-panel"><span class="eyebrow">비교해서 기억해요</span><h2>같은 김, 다른 개수</h2><p class="tip"><b>김초밥</b>은 8등분.<br><b>참치김초밥</b>은 2줄을 말아 12개.<br>제출 개수를 먼저 떠올려보세요.</p>${action('guide','19가지 메뉴 살펴보기 <span>→</span>','quick-link')}</section></aside></div>`;
    window.HomeSummary?.mount(document.getElementById('home-summary'));
    window.QnetSchedule?.mount(document.getElementById('qnet-schedule'));
  }
  function renderGuide(){
    $('#main').innerHTML=`<div class="page-head"><div><div class="eyebrow">RECIPE INDEX</div><h1>메뉴 도감</h1><p>핵심 규격과 재료를 확인하고 나만의 메모를 남기세요.</p></div><span class="badge">${data.reviewed.length} / ${menus.length} 학습 완료</span></div><div class="toolbar"><label class="screen-reader" for="menu-search">메뉴 또는 재료 검색</label><input type="search" id="menu-search" placeholder="메뉴 또는 재료 검색" value="${esc(guideQuery)}" autocomplete="off"><label class="screen-reader" for="category">조리 분류</label><select id="category">${['전체',...new Set(menus.map(m=>m.category))].map(x=>`<option ${guideCategory===x?'selected':''}>${x}</option>`).join('')}</select></div><div id="catalog"></div>`;
    renderCatalog();
  }
  function renderCatalog(){
    const q=guideQuery.replace(/\s/g,'').toLowerCase();
    const found=menus.filter(m=>(guideCategory==='전체'||m.category===guideCategory)&&(!q||`${m.name} ${m.ingredients.map(x=>x.name).join(' ')}`.replace(/\s/g,'').toLowerCase().includes(q)));
    $('#catalog').innerHTML=found.length?`<div class="catalog">${found.map(m=>`<button class="menu-item" data-action="detail" data-id="${m.id}"><div class="row between"><span class="small muted">${String(m.number).padStart(2,'0')} / ${m.category}</span>${data.reviewed.includes(m.id)?'<span class="tag">학습 완료</span>':''}</div>${window.RecipePhotos.card(m)}<h3>${m.name}</h3><p class="small muted" data-focus-menu="${m.id}">${window.SummaryEditor.html(m)}</p><div class="item-bottom"><span>◷ ${m.minutes}분</span><span>${data.notes[m.id]?'메모 있음':'핵심 정리'} ↗</span></div></button>`).join('')}</div>`:`<div class="empty"><h2>일치하는 메뉴가 없어요</h2><p>다른 이름이나 재료로 검색해 보세요.</p>${action('clear-search','검색 초기화')}</div>`;
  }
  function detail(id){
    const m=byId.get(id);if(!m)return;
    openDialog(esc(m.name),`<div class="detail-meta"><span class="badge">${m.category}</span><span class="badge">과제 시간 ${m.minutes}분</span><span class="badge">공개과제 ${String(m.number).padStart(2,'0')}</span></div>${window.RecipePhotos.section(m)}${window.MenuPractice?.summary(m)||''}${m.recipeSource?`<div class="recipe-source-label">${esc(m.recipeSource)} · 완성 그릇: <b>${esc(m.servingLabel)}</b></div>`:""}<div class="detail-section"><h3>기억할 핵심 규격</h3>${requirementsContent(m)}</div><div class="detail-section"><h3>지급 식재료 ${m.ingredients.length}종</h3><p class="small muted">지급량입니다. 양념 배합량과는 다릅니다.</p><div class="ingredient-reference">${m.ingredients.map(i=>`<div><span><b>${esc(i.name)}</b>${i.note?`<small>${esc(i.note)}</small>`:''}</span><strong>${esc(i.amount)}</strong></div>`).join('')}</div>${m.tools.length?`<p class="source-note">지급 도구: ${m.tools.map(i=>esc(i.name)+' '+esc(i.amount)+(i.note?' ('+esc(i.note)+')':'')).join(' · ')}. 식재료 분류 연습에서는 제외합니다.</p>`:''}</div><div class="detail-section"><h3>${m.recipeSource?"수업 레시피":"학습용 조리 흐름"} · ${m.steps.length}단계</h3>${sequence(m)}<div class="notice">${esc(m.tip)}</div><p class="source-note">${m.recipeSource?"보내주신 수업 레시피를 순서 카드와 받아쓰기에 함께 반영했습니다.":"암기 연습을 위한 예시입니다. 수업에서 배운 배합과 전처리 순서는 아래 메모에 기록하세요."}</p></div><div class="detail-section"><label for="dish-note"><b>나만의 메모</b></label><textarea id="dish-note" data-note="${m.id}" maxlength="10000" placeholder="수업에서 배운 배합, 헷갈리는 규격, 나만의 순서를 적어보세요.">${esc(data.notes[m.id]||'')}</textarea><div class="row between wrap"><span id="note-status" class="saved-indicator">이 브라우저에 저장됩니다</span><label class="small"><input type="checkbox" data-reviewed="${m.id}" ${data.reviewed.includes(m.id)?'checked':''}> 학습 완료</label></div></div>`,action('close','닫기','primary'));
  }
  function renderNotes(){
    const notes=menus.filter(m=>data.notes[m.id]?.trim());
    $('#main').innerHTML=`<div class="page-head"><div><div class="eyebrow">MY STUDY LOG</div><h1>내 학습 노트</h1><p>연습 기록, 나만의 메모, 다시 볼 순서를 차곡차곡 모아요.</p></div>${data.history.length?action('clear-history','연습 기록 비우기','text-button'):''}</div><div class="tabs-small">${action('tab-highlights',`형광펜 구절 ${window.RecipeHighlights?.count()||0}`,`filter-button ${noteTab==='highlights'?'active':''}`)}${action('tab-history',`연습 기록 ${data.history.length}`,`filter-button ${noteTab==='history'?'active':''}`)}${action('tab-notes',`메뉴 메모 ${notes.length}`,`filter-button ${noteTab==='notes'?'active':''}`)}${action('tab-wrong',`오답노트 ${data.wrong.length}`,`filter-button ${noteTab==='wrong'?'active':''}`)}</div><div id="notes-content"></div><p class="source-note">기록은 현재 브라우저에 저장됩니다. 다른 기기와 자동으로 동기화되지 않으며 브라우저 데이터 삭제 시 사라집니다.</p>`;
    if(noteTab==='highlights'){
      $('#notes-content').innerHTML=window.RecipeHighlights?.renderNotes()||'';
    }else if(noteTab==='wrong'){
      $('#notes-content').innerHTML=window.StudyStudio.renderWrong(data.wrong);
    }else if(noteTab==='notes'){
      $('#notes-content').innerHTML=notes.length?`<div class="note-list">${notes.map(m=>`<article class="panel"><div class="panel-head"><h3>${m.name}</h3>${action('detail','메모 수정','text-button',`data-id="${m.id}"`)}</div><div class="note-entry">${esc(data.notes[m.id])}</div></article>`).join('')}</div>`:`<div class="empty"><h2>나만의 레시피 노트를 시작해요</h2><p>메뉴 도감에 남긴 메모가 이곳에 모입니다.</p>${action('guide','도감에서 메모하기','primary')}</div>`;
    }else{
      $('#notes-content').innerHTML=data.history.length?data.history.map(h=>`<article class="panel record"><div class="row between wrap"><div><h3>${h.pair.map(id=>byId.get(id).name).join(' + ')}</h3><span class="small muted">${new Date(h.when).toLocaleString('ko-KR')} · ${formatTime(h.elapsed)} 연습</span></div>${action('retry','이 조합 다시 연습','',`data-record="${esc(h.id)}"`)}</div><div class="record-errors">재료 분류 ${h.sortCorrect}/${h.sortTotal} · 예시 순서 일치 ${h.orderCorrect}/${h.orderTotal}</div>${h.errors.length?`<details><summary>다시 볼 항목 ${h.errors.length}개</summary>${list(h.errors)}</details>`:'<span class="tag">분류와 예시 순서를 모두 확인했어요</span>'}<details><summary>내가 떠올린 순서</summary>${h.pair.map(id=>`<h3>${byId.get(id).name}</h3><div class="note-entry">${esc(h.recall[id]||'작성하지 않았어요.')}</div>`).join('')}</details>${h.work?`<details><summary>내가 만든 조리 순서</summary>${h.pair.map(id=>`<h3>${byId.get(id).name}</h3><ol>${(Array.isArray(h.work[id])?h.work[id]:[]).slice(0,120).map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`).join('')}</details>`:''}</article>`).join(''):`<div class="empty"><h2>첫 연습을 기다리고 있어요</h2><p>연습을 마치면 결과와 다시 볼 항목이 여기에 저장됩니다.</p>${action('home','첫 연습 시작하기','primary')}</div>`;
    }
  }
  function pause(){const s=data.session;if(s?.running){s.remaining=Math.max(0,(s.deadline-Date.now())/1000*(s.speed||1));s.running=false;s.deadline=0;save();}}
  function resumeTimer(){const s=data.session;if(!s||s.remaining<=0)return;s.deadline=Date.now()+s.remaining*1000/(s.speed||1);s.running=true;save();}
  function sessionRemaining(){const s=data.session;return s.running?Math.max(0,(s.deadline-Date.now())/1000*(s.speed||1)):s.remaining;}
  function startSession(){
    if(!$('#ready')?.checked){toast('핵심 규격과 준비사항을 확인해 주세요.');return;}
    const orders=Object.fromEntries(data.selected.map(id=>[id,[]]));
    data.session={id:newId(),pair:[...data.selected],flowVersion:2,stage:0,duration:previewMinutes*60,remaining:previewMinutes*60,running:true,deadline:Date.now()+previewMinutes*60000,assignments:{},recall:Object.fromEntries(data.selected.map(id=>[id,''])),orders,sortChecked:false,compare:false,speed:1,recipeVersions:Object.fromEntries(data.selected.map(id=>[id,byId.get(id).recipeVersion||1]))};
    data.session.kitchen=window.StudyStudio.clean(data.session);
    save();closeDialog();view='session';render(true);
  }
  function showRequirements(){
    openDialog('시작 전, 요구사항 확인',`${data.session?'<div class="notice">새 연습을 시작하면 진행 중인 연습이 바뀝니다. 완료한 기록과 메뉴 메모는 유지됩니다.</div>':''}${selectedMenus().map(m=>`<div class="detail-section"><div class="row between"><h3>${m.name}</h3><span class="badge">${m.minutes}분</span></div>${requirementsContent(m)}</div>`).join('')}<div class="notice">위생복·위생모·앞치마·마스크를 준비하고, 화구는 1개만 사용합니다. 재료 상태는 시험 시작 전에 확인하세요.</div><label class="row small"><input id="ready" type="checkbox"> 두 메뉴의 규격과 준비사항을 확인했어요</label>`,action('close','돌아가기')+action('begin','확인하고 시작','primary'));
  }
  function sortingRequirements(s){
    return `<details class="sorting-requirements"><summary><span class="requirements-when-closed">시험지 지급재료 펼쳐보기</span><span class="requirements-when-open">시험지 지급재료 접기</span><small>두 메뉴 함께 확인</small></summary><div class="sorting-requirements-content"><p class="small muted">시험지의 메뉴별 지급재료와 수량입니다. 목록을 보면서 재료를 나눠 보세요.</p><div class="sorting-requirements-grid">${s.pair.map((id,index)=>{
      const m=byId.get(id);
      const ingredients=m.ingredients.map(i=>`<div><span><b>${esc(i.name)}</b>${i.note?`<small>${esc(i.note)}</small>`:''}</span><strong>${esc(i.amount)}</strong></div>`).join('');
      const tools=m.tools.length?`<p class="source-note">지급 도구: ${m.tools.map(i=>esc(i.name)+' '+esc(i.amount)+(i.note?' ('+esc(i.note)+')':'')).join(' · ')}</p>`:'';
      return `<article class="sorting-requirements-menu"><div class="row between wrap"><span class="dish-index">MENU ${index?'B':'A'}</span><span class="small muted">제한 시간 ${m.minutes}분</span></div><h3>${esc(m.name)}</h3><div class="ingredient-reference"><div class="small muted"><span>재료명 · 비고</span><strong>지급량</strong></div>${ingredients}</div>${tools}</article>`;
    }).join('')}</div></div></details>`;
  }
  function orderingRequirements(s){
    return `<details class="sorting-requirements" id="ordering-requirements"><summary><span class="requirements-when-closed">시험지 요구사항 펼쳐보기</span><span class="requirements-when-open">시험지 요구사항 접기</span><small>두 메뉴 함께 확인</small></summary><div class="sorting-requirements-content"><p class="small muted">선택한 두 메뉴의 요구사항을 보며 조리 순서를 연습하세요.</p><div class="sorting-requirements-grid">${s.pair.map((id,index)=>{
      const m=byId.get(id);
      return `<article class="sorting-requirements-menu"><div class="row between wrap"><span class="dish-index">MENU ${index?'B':'A'}</span><span class="small muted">제한 시간 ${m.minutes}분</span></div><h3>${esc(m.name)}</h3>${window.OfficialRequirements?.render(m,{quiz:true})||`<ul class="requirements">${m.requirements.map(t=>`<li>${window.RecipeBlanks.trigger(t,m.name+' · 요구사항')}</li>`).join('')}</ul>`}</article>`;
    }).join('')}</div></div></details>`;
  }
  function renderSession(){
    const s=data.session;if(!s){view='practice';render();return;}
    const [a,b]=s.pair.map(id=>byId.get(id));
    $('#main').innerHTML=`<div class="session-top"><div>${action('leave','← 연습 홈','text-button')}<h2>${a.name} <span class="muted">+</span> ${b.name}</h2></div><div class="row wrap"><div><span class="small muted">남은 연습 시간</span> <span class="timer" id="timer">${formatTime(sessionRemaining())}</span></div>${action('pause',s.running?'일시정지':'계속','', 'id="pause-button"')}<label class="speed-control">배속 <select id="timer-speed" aria-label="연습 타이머 배속">${[1,2,4].map(n=>`<option value="${n}" ${s.speed===n?'selected':''}>${n}×</option>`).join('')}</select></label>${action('session-req','규격 확인','text-button')}</div></div><ol class="stepper">${['재료 나누기','순서 떠올리기','순서 완성하기'].map((t,i)=>`<li class="${i===s.stage?'active':i<s.stage?'done':''}" ${i===s.stage?'aria-current="step"':''}>0${i+1} &nbsp; ${t}</li>`).join('')}</ol>${s.stage===0?sortingRequirements(s):s.stage===1?orderingRequirements(s):''}${window.ClassroomRecipes?.forPair(s.pair)||''}<section class="panel" id="stage"></section>`;
    if(s.stage===0)renderSorting();if(s.stage===1)renderOrdering();if(s.stage===2)renderRecall();updateTimer();
  }
  function renderSorting(){window.StudyStudio.sorting();}
  function renderRecall(){window.StudyStudio.recall();}
  function renderOrdering(){window.StudyStudio.ordering();}

  function finish(quizResult=null){
    const s=data.session;if(!s||s.stage!==2)return;pause();
    if(!quizResult){window.CookingLab.finalQuiz('jp',s.pair,finish);return;}
    const ingredients=mergeIngredients(s.pair),wrong=ingredients.filter(i=>s.assignments[i.name]!==i.zone);
    const order=window.StudyStudio.assess(s),orderErrors=order.errors;
    const result={id:s.id,pair:[...s.pair],when:Date.now(),elapsed:Math.round(s.duration-s.remaining),sortCorrect:ingredients.length-wrong.length,sortTotal:ingredients.length,orderCorrect:order.correct,orderTotal:order.total,errors:[...wrong.map(i=>`${i.name}: ${zoneLabel(s.assignments[i.name],s.pair)} → ${zoneLabel(i.zone,s.pair)}`),...orderErrors],recall:{...s.recall},work:Object.fromEntries(s.pair.map(id=>[id,s.kitchen.timelines[id].map(e=>window.StudyStudio.entryText(e,id))])),speed:s.speed};
    result.finalQuiz=quizResult;
    data.history=[result,...data.history.filter(h=>h.id!==result.id)].slice(0,100);data.session=null;const saved=save();
    $('#main').innerHTML=`<div class="page-head"><div><div class="eyebrow">PRACTICE COMPLETE</div><h1>한 번 더 익숙해졌어요</h1><p>${result.pair.map(id=>byId.get(id).name).join(' + ')} 연습을 마쳤습니다.</p></div><span class="badge">${saved?'학습 노트에 저장됨':'현재 화면에 결과 표시'}</span></div><section class="panel"><div class="notice success">치수·접시 퀴즈 ${quizResult.correct} / ${quizResult.total} 정답 · 자세한 복습은 상단 공통 연습장의 연습 기록에서 확인할 수 있어요.</div><div class="result-metrics"><div><strong>${result.sortCorrect}<span class="small muted"> / ${result.sortTotal}</span></strong><span>재료 분류 정답</span></div><div><strong>${result.orderCorrect}<span class="small muted"> / ${result.orderTotal}</span></strong><span>예시 순서 일치</span></div><div><strong>${formatTime(result.elapsed)}</strong><span>연습한 시간</span></div></div>${result.errors.length?`<h2>다음 연습에서 다시 볼 부분</h2>${list(result.errors)}`:'<div class="notice success">재료 분류와 학습용 예시 순서가 모두 일치해요. 다음 조합에 도전해 보세요.</div>'}<p class="source-note">이 결과는 암기 연습용입니다. 실제 시험의 맛·위생·숙련도·완성품을 평가하지 않습니다.</p><div class="stage-actions">${action('notes','학습 노트 보기')}${action('home','다음 연습 준비하기','primary')}</div></section>`;
    $('#main').focus({preventScroll:true});window.scrollTo({top:0});
  }
  function updateTimer(){
    if(!data.session||view!=='session')return;
    const remaining=sessionRemaining(),el=$('#timer');if(!el)return;
    el.textContent=formatTime(remaining);el.classList.toggle('low',remaining<60);
    if(data.session.running&&remaining<=0){pause();toast('연습 시간이 끝났어요. 남은 단계는 계속 복습할 수 있습니다.');}
    const button=$('#pause-button');button.textContent=data.session.remaining<=0?'시간 종료':data.session.running?'일시정지':'계속';button.disabled=remaining<=0;
  }
  function navigate(next){if(view==='session')pause();view=next;render(true);}
  window.CookingLab.install({course:'jp',host:'.header-inner nav',onOpen:()=>{if(data.session?.running){pause();updateTimer();}}});
  window.StudyStudio.init({
    session:()=>data.session,ingredients:mergeIngredients,quantity,action,save,toast,
    dialog:openDialog,close:closeDialog,render:()=>render(),
    addWrong:note=>{data.wrong=[note,...data.wrong.filter(w=>w.menu!==note.menu||w.text!==note.text)].slice(0,100);save();},
    removeWrong:id=>{data.wrong=data.wrong.filter(w=>w.id!==id);save();renderNotes();}
  });
  window.MenuPractice?.init({note:id=>data.notes[id]||'',saveNote:note=>{data.wrong=[note,...data.wrong.filter(w=>w.menu!==note.menu||w.text!==note.text)].slice(0,100);return save();}});
  window.RecipeMarks?.init({toast,open:detail,changed:()=>{if(view==='notes')renderNotes();}});
  window.RecipeHighlights?.init({toast,changed:()=>{if(view==='notes')renderNotes();window.MenuPractice?.refreshEvidence();}});
  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}
    if(event.target.closest('.brand')){event.preventDefault();navigate('practice');return;}
    const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
    const type=button.dataset.action;
    if(type==='close'){closeDialog();return;}
    if(type==='highlight-notes'){closeDialog();noteTab='highlights';navigate('notes');return;}
    if(type==='home'||type==='leave'){navigate('practice');return;}
    if(type==='guide'||type==='notes'){navigate(type);return;}
    if(type==='random'){const old=data.selected.join();let pair=shuffle(menus).slice(0,2).map(m=>m.id);if(pair.join()===old)pair.reverse();data.selected=pair;previewMinutes=selectedMenus().reduce((n,m)=>n+m.minutes,0);save();render();return;}
    if(type==='choose'){
      openDialog('연습할 두 메뉴 고르기',`<p class="muted small" style="margin-top:12px">서로 다른 메뉴를 하나씩 선택하세요.</p>${['A','B'].map((slot,i)=>`<div class="field"><label for="choose-${slot}">${slot} 메뉴</label><select id="choose-${slot}">${menus.map(m=>`<option value="${m.id}" ${m.id===data.selected[i]?'selected':''}>${m.name} · ${m.minutes}분</option>`).join('')}</select></div>`).join('')}`,action('close','취소')+action('apply-pair','선택 완료','primary'));return;
    }
    if(type==='apply-pair'){const pair=[$('#choose-A').value,$('#choose-B').value];if(!pairValid(pair)){toast('서로 다른 메뉴 두 가지를 골라 주세요.');return;}data.selected=pair;previewMinutes=selectedMenus().reduce((n,m)=>n+m.minutes,0);save();closeDialog();render();return;}
    if(type==='duration'){openDialog('연습 시간 설정',`<p class="small muted" style="margin-top:14px">기본값은 두 과제 시간의 합계입니다. 실제 시험에서는 시험장 안내를 따르세요.</p><div class="field"><label for="practice-minutes">연습 시간 (1~180분)</label><input type="number" id="practice-minutes" min="1" max="180" step="1" value="${previewMinutes}"></div>`,action('apply-duration','설정 저장','primary'));return;}
    if(type==='apply-duration'){const minutes=Number($('#practice-minutes').value);if(!Number.isInteger(minutes)||minutes<1||minutes>180){toast('1~180 사이의 정수로 입력해 주세요.');return;}previewMinutes=minutes;closeDialog();render();return;}
    if(type==='date'){openDialog('나의 실기 시험일',`<p class="small muted" style="margin-top:14px">접수한 개인 시험일을 입력해 주세요.</p><div class="field"><label for="exam-date">시험일</label><input type="date" id="exam-date" min="2000-01-01" max="2100-12-31" value="${data.examDate}"></div>`,action('clear-date','날짜 지우기')+action('save-date','저장','primary'));return;}
    if(type==='save-date'){const date=$('#exam-date').value;if(!dateValid(date)||date<'2000-01-01'||date>'2100-12-31'){toast('올바른 시험 날짜를 선택해 주세요.');return;}data.examDate=date;save();closeDialog();render();return;}
    if(type==='clear-date'){data.examDate='';save();closeDialog();render();return;}
    if(type==='start'){showRequirements();return;}
    if(type==='begin'){startSession();return;}
    if(type==='resume'){view='session';resumeTimer();render(true);return;}
    if(type==='pause'){data.session.running?pause():resumeTimer();updateTimer();return;}
    if(type==='session-req'){openDialog('현재 메뉴의 핵심 규격',data.session.pair.map(id=>`<div class="detail-section"><h3>${byId.get(id).name}</h3>${requirementsContent(byId.get(id))}</div>`).join(''),action('close','계속 연습','primary'));return;}
    if(type==='detail'){detail(button.dataset.id);return;}
    if(type==='clear-search'){guideQuery='';guideCategory='전체';renderGuide();return;}
    if(type==='check-sort'){const s=data.session,items=mergeIngredients(s.pair);if(items.some(i=>!s.assignments[i.name])){toast('모든 재료를 분류한 뒤 확인해 주세요.');return;}s.sortChecked=true;save();renderSorting();toast('분류 결과를 확인하고 다음 단계로 넘어가세요.');return;}
    if(type==='to-recall'){if(!data.session.sortChecked)return;data.session.stage=2;save();render(true);return;}
    if(type==='to-order'){if(!data.session.sortChecked)return;data.session.stage=1;save();render(true);return;}
    if(type==='finish'){finish();return;}
    if(['tab-highlights','tab-history','tab-notes','tab-wrong'].includes(type)){noteTab=type.slice(4);renderNotes();return;}
    if(type==='retry'){const record=data.history.find(h=>h.id===button.dataset.record);if(!record)return;data.selected=[...record.pair];previewMinutes=selectedMenus().reduce((n,m)=>n+m.minutes,0);save();navigate('practice');showRequirements();return;}
    if(type==='clear-history'){openDialog('연습 기록을 비울까요?',`<p style="margin-top:18px">완료한 연습 ${data.history.length}건을 삭제합니다. 메뉴 메모와 도감 학습 표시는 유지됩니다.</p>`,action('close','취소')+action('confirm-clear','기록 비우기','primary'));return;}
    if(type==='confirm-clear'){data.history=[];save();closeDialog();renderNotes();return;}
    if(type==='sources'){openDialog('학습 자료 안내',`<div class="detail-section"><h3>2026년 일식조리기능사 공개과제</h3><p>${window.STUDY_SOURCE.original}</p><p class="small muted">공고 ${window.STUDY_SOURCE.published} · 원문 확인 ${window.STUDY_SOURCE.checked}</p><p class="source-link"><a href="${window.STUDY_SOURCE.url}" target="_blank" rel="noopener noreferrer">큐넷 공개문제 및 변경 공지 ↗</a></p></div><div class="detail-section"><h3>공식 사실과 학습 예시</h3><p>19개 과제의 메뉴명·시간·재료와 핵심 규격을 원문에서 확인해 요약했습니다. 조리 순서는 암기 연습용 예시이며 공식 채점표나 정해진 유일한 조리 순서가 아닙니다.</p><p>재료 수량은 지급량입니다. 실제 양념 배합량으로 사용하지 마세요. 생문어와 삶은 문어, 국물용과 고명용 가다랑어포를 구분하고 도구는 식재료 분류에서 제외합니다.</p><p>도미머리맑은국과 다른 도미 과제를 함께 선택하면 원문 비고에 따라 도미 1마리를 공동 지급으로 표시합니다. 실제 지급 상태와 대체 재료는 시험장 안내를 확인하세요.</p></div><div class="detail-section"><h3>이미지와 조리대 연습</h3><p>기존 양식 연습의 조리대와 재료 이미지를 재사용하고, 일식 전용 재료는 생성 이미지로 보충했습니다. 이미지는 식별용 예시이며 실제 지급 상태·크기·모양과 다를 수 있습니다. 재료 이름과 공개과제의 지급 조건을 함께 확인하세요.</p><p>싱크대·팬·냄비 등은 작업 선택 영역입니다. 학습용 예시 작업을 순서에 추가하고 직접 쓴 작업·위생 작업을 함께 정리할 수 있습니다. 문장 비교는 단어 기반 참고 표시이며 정확성 판단을 대신하지 않습니다.</p></div><div class="detail-section"><h3>내 기록의 저장</h3><p>일식 기록만 이 브라우저에 저장합니다. 다른 기기·주소와 자동 동기화되지 않으며 브라우저 데이터를 삭제하면 기록도 사라질 수 있습니다.</p></div>`,action('close','확인','primary'));return;}
  
  });
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.id==='menu-search'){guideQuery=el.value;renderCatalog();}
    if(el.dataset.note){if(el.value.trim())data.notes[el.dataset.note]=el.value;else delete data.notes[el.dataset.note];const ok=save();$('#note-status').textContent=ok?'저장됨':'저장 불가 · 내용을 복사해 보관해 주세요';window.MenuPractice?.refreshEvidence();}
    if(el.dataset.recall&&data.session){data.session.recall[el.dataset.recall]=el.value;save();}
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.id==='timer-speed'&&data.session){const running=data.session.running;pause();data.session.speed=[1,2,4].includes(Number(el.value))?Number(el.value):1;if(running)resumeTimer();save();updateTimer();}
    if(el.id==='category'){guideCategory=el.value;renderCatalog();}
    if(el.dataset.reviewed){const set=new Set(data.reviewed);el.checked?set.add(el.dataset.reviewed):set.delete(el.dataset.reviewed);data.reviewed=[...set];save();}
  });
  $('#dialog').addEventListener('close',()=>{
    if(['practice','guide','notes'].includes(view))render();
    if(lastFocus?.isConnected){lastFocus.focus();return;}
    const opener=lastFocus?.dataset;
    if(opener?.highlightOpen){document.querySelector(`[data-highlight-open="${opener.highlightOpen}"]`)?.focus({preventScroll:true});return;}
    if(opener?.recipeMarkOpen){document.querySelector(`[data-recipe-mark-open="${opener.recipeMarkOpen}"]`)?.focus({preventScroll:true});return;}
    if(opener?.action){const match=[...document.querySelectorAll('[data-action]')].find(el=>el.dataset.action===opener.action&&el.dataset.id===opener.id);match?.focus({preventScroll:true});}
  });
  // A paused/background tab must not write its older snapshot over another tab.
  window.addEventListener('pagehide',()=>{if(data.session?.running){data.session.remaining=sessionRemaining();save();}});
  window.addEventListener('storage',event=>{
    if(event.key!==KEY)return;
    const previous=data.selected.join();data=load();
    if(previous!==data.selected.join())previewMinutes=selectedMenus().reduce((n,m)=>n+m.minutes,0);
    if(view==='session'&&!data.session)view='practice';
    render();
  });
  setInterval(updateTimer,500);
  render();
  const linkedMenu=new URLSearchParams(location.search).get('menu');
  if(byId.has(linkedMenu)){view='guide';render();detail(linkedMenu);}
  if(storageIssue)setTimeout(()=>toast(storageIssue),200);
})();
