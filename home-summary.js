'use strict';
window.HomeSummary = (() => {
  const ref=window.SummaryReference, menus=window.MENUS;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=value=>String(value).replace(/\s/g,'').toLowerCase();
  const state={menu:'all',query:'',mode:'sauces',by:'kind',group:null};
  const currentGroups=new WeakMap();
  const menuButton=e=>`<button type="button" class="text-button" data-action="detail" data-id="${e.menu.id}" aria-label="${esc(e.menu.name)} 수업 레시피 보기">${esc(e.menu.name)} <span aria-hidden="true">↗</span></button>`;
  const row=e=>`<tr><th scope="row" class="summary-menu-name">${menuButton(e)}</th><td>${esc(e.label)}</td><td>${window.RecipeMarks.summary(e)}<small>수업 ${e.steps.join(' · ')}단계</small></td></tr>`;
  function memoryNotes(){
    return `<section class="summary-memory" aria-labelledby="summary-memory-title"><div class="summary-memory-heading"><h3 id="summary-memory-title">먼저 기억할 공통점 · 차이점</h3><span>내 암기 메모</span></div><div class="summary-memory-grid"><div><h4>공통 양념 · 설탕 유무</h4><ul><li><b>도미머리맑은국 · 대합맑은국 · 된장국</b><br>모두 <strong>청주 1T</strong></li><li><b>달걀 간</b> → 모두 <strong>소금 0.5t</strong></li><li><b>초간장</b> → 문어초회는 <strong>설탕 있음</strong><br>해삼초회 · 도미술찜은 <strong>설탕 없음</strong></li></ul></div><div><h4>국물 양 · 만드는 양과 쓰는 양 구분</h4><dl><div><dt>된장국</dt><dd>다시 만들기 <strong>물 3컵</strong><br>→ 된장 풀기 <strong>다시물 2컵</strong></dd></div><div><dt>도미머리맑은국</dt><dd><strong>물 3컵</strong></dd></div><div><dt>대합맑은국</dt><dd><strong>물 2컵</strong></dd></div><div><dt>나머지</dt><dd><strong>물 1컵</strong></dd></div></dl></div></div></section>`;
  }
  function finishingNotes(){
    const lemons=ref.entries('sizes').filter(e=>/레몬/.test(e.label));
    const shapes=['오리발 모양','반달 모양','웨지 모양'];
    const lemonRows=shapes.map(shape=>`<li><strong>${shape}</strong>${shape==='오리발 모양'?' · 껍질만':''}<br>${lemons.filter(e=>e.text.includes(shape)).map(menuButton).join(' · ')}</li>`).join('');
    return `<section class="summary-memory summary-finishing" aria-labelledby="summary-finishing-title"><div class="summary-memory-heading"><h3 id="summary-finishing-title">레몬 모양 · 따로 내는 곁들임</h3><span>수업 레시피 기준</span></div><div class="summary-memory-grid"><div><h4>레몬은 어떤 모양?</h4><ul>${lemonRows}</ul><div class="summary-finish-actions"><button type="button" data-summary-shortcut="레몬 모양" data-shortcut-mode="sizes">레몬 모양 비교·빈칸 공부 →</button></div></div><div><h4>소스도 곁들임으로 확인</h4><ul><li><b>도미술찜 → 폰즈</b><br>빨간 무즙·실파·반달 레몬은 사라다 그릇, <strong>폰즈는 별도 그릇</strong></li><li><b>메밀국수 → 소바다시</b><br>소바다시는 미리 끓여 <strong>차게 식혀 별도 그릇</strong><br>무즙·실파·고추냉이도 면과 따로 담기</li><li><b>생선초밥·참치김초밥·김초밥 → 간장</b><br><strong>간장 별도 그릇</strong> 빠뜨리지 않기</li></ul><div class="summary-finish-actions"><button type="button" data-summary-shortcut="곁들이기 · 고명" data-shortcut-mode="sauces">곁들임 비교·빈칸 공부 →</button></div></div></div></section>`;
  }
  function update(root) {
    const query=normalize(state.query),isSauce=state.mode==='sauces';
    const entries=ref.entries(state.mode).filter(e=>(state.menu==='all'||e.menu.id===state.menu)&&(!query||normalize(`${e.menu.name} ${e.label} ${e.text}`).includes(query)));
    const allGroups=ref.group(entries,state.by);
    currentGroups.set(root,new Map(allGroups.map(group=>[group.name,group])));
    if(state.group===null||(state.group&&!allGroups.some(g=>g.name===state.group)))state.group=allGroups[0]?.name||'';
    const activeGroup=allGroups.find(g=>g.name===state.group);
    const quizButton=root.querySelector('[data-summary-group-quiz]');
    quizButton.dataset.summaryGroupQuiz=activeGroup?.name||'';
    quizButton.disabled=!activeGroup;
    quizButton.setAttribute('aria-label',activeGroup?activeGroup.name+' 묶음 전체 풀기':'묶음 전체 풀기');
    root.querySelector('[data-summary-quiz-context]').textContent=activeGroup?`${new Set(activeGroup.rows.map(e=>e.menu.id)).size}품목 · ${activeGroup.rows.length}항목을 함께 풀어요.`:allGroups.length?'연습할 묶음을 선택하면 퀴즈를 시작할 수 있어요.':'검색 결과가 없어요. 검색어나 품목을 바꿔 주세요.';
    const groupSelect=root.querySelector('[data-summary-group]');
    groupSelect.innerHTML=`<option value="" ${state.group===''?'selected':''}>전체 묶음 보기</option>${allGroups.map(g=>`<option value="${esc(g.name)}" ${ref.isEmphasizedGroup(g.name)?'class="summary-group-highlight"':''} ${state.group===g.name?'selected':''}>${esc(g.name)} (${g.rows.length})</option>`).join('')}`;
    groupSelect.classList.toggle('summary-group-highlight',ref.isEmphasizedGroup(state.group));
    const shown=state.group?allGroups.filter(g=>g.name===state.group):allGroups;
    const shownEntries=[...new Map(shown.flatMap(g=>g.rows).map(e=>[e.key,e])).values()];
    root.querySelector('[data-summary-count]').textContent=`${new Set(shownEntries.map(e=>e.menu.id)).size}품목 · ${shownEntries.length}항목 · ${shown.length}묶음`;
    root.querySelector('[data-summary-reset]').hidden=state.menu==='all'&&!state.query;
    root.querySelectorAll('[data-summary-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.summaryMode===state.mode)));
    root.querySelector('[data-summary-by]').innerHTML=(isSauce?[['kind','소스별로 묶기'],['amount','같은 용량끼리'],['menu','품목별로 보기']]:[['kind','같은 치수끼리'],['menu','품목별로 보기']]).map(([value,label])=>`<option value="${value}" ${state.by===value?'selected':''}>${label}</option>`).join('');
    root.querySelector('[data-summary-hint]').textContent=state.by==='menu'?'품목별 전체 정리입니다.':isSauce&&state.by==='kind'?'같은 소스와 비슷한 쓰임을 모았어요. 배합이 다른 부분은 각 품목에서 확인하세요.':isSauce?'T와 t는 따로 묶어요. 여러 용량이 들어간 배합은 해당 용량의 묶음마다 나와요.':'같은 수치를 모았어요. 길이·너비·두께·모양을 함께 확인하세요. 여러 치수는 각 묶음에 함께 나와요.';
    root.querySelector('[data-summary-results]').innerHTML=shown.length?`<table><caption class="screen-reader">${isSauce?'소스와 용량':'치수와 제출 규격'} 묶음 정리</caption><colgroup><col class="summary-menu-col"><col class="summary-use-col"><col></colgroup><thead><tr><th scope="col">품목</th><th scope="col">${isSauce?'소스 · 용도':'재료 · 용도'}</th><th scope="col">${isSauce?'넣는 양 · 배합':'길이 · 크기 · 개수'}</th></tr></thead>${shown.map(g=>`<tbody data-summary-group-name="${esc(g.name)}"><tr class="summary-group-heading"><th colspan="3" scope="rowgroup"><span>${ref.groupTitle(g.name)}</span><small>${g.rows.length}항목</small>${g.description?`<p>${esc(g.description)}</p>`:''}</th></tr>${g.rows.map(row).join('')}</tbody>`).join('')}</table>`:'<p class="summary-empty">일치하는 항목이 없어요. 품목이나 검색어를 바꿔 보세요.</p>';
    root.querySelector('[data-summary-results]').scrollTop=0;
  }
  function mount(root) {
    if(!root)return;
    root.innerHTML=`<div class="summary-heading"><div><span class="section-label">함께 묶어서 기억하기</span><h2 id="home-summary-title">품목별 소스·용량 한눈에</h2><p>묶음을 고르고, 함께 비교하며 외워 보세요. 아래 버튼으로 한 번에 연습할 수 있어요.</p></div><a class="summary-print" href="lesson-summary.html" target="_blank" rel="noopener">전체 정리본 · 인쇄 ↗</a></div><div class="summary-controls"><div class="summary-modes" role="group" aria-label="정리 항목"><button type="button" data-summary-mode="sauces">소스·용량</button><button type="button" data-summary-mode="sizes">치수·제출</button></div><label class="summary-menu-filter">묶는 기준<select data-summary-by aria-label="정리본 묶는 기준"></select></label><label class="summary-menu-filter">품목<select data-summary-menu aria-label="정리본 품목 선택"><option value="all">전체 19품목</option>${menus.map(m=>`<option value="${m.id}" ${state.menu===m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><label class="summary-search"><span class="screen-reader">소스·용량 정리 검색</span><input type="search" data-summary-search aria-label="소스·용량 정리 검색" value="${esc(state.query)}" placeholder="품목, 소스, 재료 검색 · 예: 폰즈" autocomplete="off"></label><button type="button" class="text-button" data-summary-reset>검색 초기화</button></div><div class="summary-group-controls"><label>공부할 묶음<select data-summary-group aria-label="정리본 묶음 선택"></select></label><button type="button" class="primary summary-start-quiz" data-summary-group-quiz aria-haspopup="dialog" aria-describedby="summary-quiz-context">묶음 전체 풀기 <span aria-hidden="true">→</span></button><p id="summary-quiz-context" data-summary-quiz-context></p></div><p class="summary-browse-hint" data-summary-hint></p>${ref.legend()}<div class="summary-legend"><p><b>T = 큰술</b><span>·</span><b>t = 작은술</b><span>·</span>소스 배합량은 수업 기준</p><span data-summary-count role="status" aria-live="polite"></span></div><div class="summary-table-scroll" data-summary-results tabindex="0" role="region" aria-label="품목별 정리 표 · 스크롤하여 전체 보기"></div><p class="summary-footnote">같은 배합은 비교하기 쉽게 재료 순서를 맞췄어요. 실제 조리 순서는 수업 레시피에서 확인하세요. 수업 배합량은 지급량과 달라요. 요구사항 색상은 같은 숫자가 아닌, 해당 재료·용도에 명시된 규격만 표시합니다.</p>`;
    root.querySelector('.summary-heading').insertAdjacentHTML('afterend',memoryNotes()+finishingNotes()+(window.StockSummary?.render()||''));
    root.querySelector('[data-summary-results]').insertAdjacentHTML('beforebegin',window.RecipeMarks.summaryToolbar());
    root.querySelector('[data-summary-search]').addEventListener('input',e=>{state.query=e.target.value;state.group=null;update(root);});
    root.querySelector('[data-summary-menu]').addEventListener('change',e=>{state.menu=e.target.value;state.group=null;update(root);});
    root.querySelector('[data-summary-by]').addEventListener('change',e=>{state.by=e.target.value;state.group=null;update(root);});
    root.querySelector('[data-summary-group]').addEventListener('change',e=>{state.group=e.target.value;update(root);});
    root.addEventListener('click',e=>{
      const shortcut=e.target.closest('[data-summary-shortcut]');
      if(shortcut){
        state.mode=shortcut.dataset.shortcutMode;state.by='kind';state.menu='all';state.query='';state.group=shortcut.dataset.summaryShortcut;
        root.querySelector('[data-summary-search]').value='';root.querySelector('[data-summary-menu]').value='all';update(root);
        root.querySelector('[data-summary-group]').focus({preventScroll:true});root.querySelector('.summary-group-controls').scrollIntoView({block:'start'});return;
      }
      const groupButton=e.target.closest('[data-summary-group-quiz]');
      if(groupButton){window.SummaryGroupQuiz.open(currentGroups.get(root)?.get(groupButton.dataset.summaryGroupQuiz),groupButton);return;}
      const mode=e.target.closest('[data-summary-mode]');
      if(mode){state.mode=mode.dataset.summaryMode;state.group=null;if(state.mode==='sizes'&&state.by==='amount')state.by='kind';update(root);}
      if(e.target.closest('[data-summary-reset]')){state.menu='all';state.query='';state.group=null;root.querySelector('[data-summary-search]').value='';root.querySelector('[data-summary-menu]').value='all';update(root);}
    });
    update(root);
  }
  return {mount};
})();
