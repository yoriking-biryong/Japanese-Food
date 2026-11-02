'use strict';
window.MenuPractice = (() => {
  const KEY='ilsik-study:menu-writing:v1:', facts=window.MENU_PRACTICE_FACTS;
  const menus=new Map(window.MENUS.map(m=>[m.id,m])), writing=new Map(), rounds=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let hooks={};
  function shuffle(input,previous=[]){
    const result=[...input];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    if(result.length>1&&result.every((x,i)=>x.id===previous[i]?.id))result.push(result.shift());
    return result;
  }
  function makeRound(id,mode='yes',previous=[]){
    const pool=facts[id].flatMap(f=>[{id:f.id+'-yes',fact:f,truth:true,text:f.yes},{id:f.id+'-no',fact:f,truth:false,text:f.no}]);
    // 학습 포인트가 늘어나도 한 판은 여섯 장. 두 설명을 각각 2~4장 섞는다.
    const trueCount=2+Math.floor(Math.random()*3);
    const cards=shuffle([...shuffle(pool.filter(c=>c.truth)).slice(0,trueCount),...shuffle(pool.filter(c=>!c.truth)).slice(0,6-trueCount)],previous);
    return {mode,cards,selected:[],checked:false};
  }
  function round(id){if(!rounds.has(id))rounds.set(id,makeRound(id));return rounds.get(id);}
  function gradeRound(r){
    const target=r.cards.filter(c=>c.truth===(r.mode==='yes')).map(c=>c.id);
    const correct=r.cards.filter(c=>r.selected.includes(c.id)===target.includes(c.id)).length;
    return {target,correct,total:r.cards.length,perfect:correct===r.cards.length};
  }
  function readDraft(id){
    try{const raw=localStorage.getItem(KEY+id);if(raw===null)return {text:'',checked:false,status:'이 메뉴의 글은 입력할 때마다 이 브라우저에 저장됩니다.'};
      const value=JSON.parse(raw);if(value.version!==1||typeof value.text!=='string'||value.text.length>10000)throw Error('format');
      return {text:value.text,checked:false,status:'이 메뉴에 저장한 글을 불러왔습니다.'};
    }catch{return {text:'',checked:false,status:'저장한 글을 읽지 못했습니다. 기존 저장 내용은 그대로 두었습니다.'};}
  }
  function draft(id){if(!writing.has(id))writing.set(id,readDraft(id));return writing.get(id);}
  function saveDraft(id,text){
    const s=draft(id);s.text=String(text).slice(0,10000);s.checked=false;
    try{localStorage.setItem(KEY+id,JSON.stringify({version:1,text:s.text,updatedAt:Date.now()}));s.status='저장됨 · 이 메뉴의 직접 쓴 글';return true;}
    catch{s.status='저장하지 못했습니다. 입력한 글을 복사해 보관해 주세요.';return false;}
  }
  function mentions(text,id){
    const normal=s=>String(s).normalize('NFKC').replace(/[^가-힣a-zA-Z0-9]/g,'');
    const value=normal(text);
    return facts[id].map(f=>({fact:f,mentioned:f.cues.every(group=>group.split('|').some(cue=>value.includes(normal(cue))))}));
  }
  function personalEvidence(menu){
    const note=hooks.note?.(menu.id)||'', highlights=window.RecipeHighlights?.forMenu(menu.id)||[];
    if(!note&&!highlights.length)return '';
    return `<details class="menu-practice-evidence"><summary>내가 남긴 메모·형광펜 함께 보기${note?' · 메모':''}${highlights.length?' · 형광펜 '+highlights.length+'개':''}</summary>${note?`<h4>나만의 메모</h4><p class="menu-practice-note">${esc(note)}</p>`:''}${highlights.length?`<h4>형광펜 · 문장과 함께</h4><ul>${highlights.map(h=>`<li>${esc(h.text.slice(0,h.start))}<mark>${esc(h.text.slice(h.start,h.end))}</mark>${esc(h.text.slice(h.end))}</li>`).join('')}</ul>`:''}</details>`;
  }
  function summary(menu){
    return `<section class="menu-practice-summary" data-menu-practice-summary="${menu.id}" aria-label="먼저 떠올릴 준비와 타이밍"><span class="eyebrow">시험장에서 먼저 떠올리기</span><h3>준비 → 다음 작업의 타이밍 → 마무리</h3>${window.SummaryEditor.controls(menu)}<p class="menu-practice-flow" data-focus-menu="${menu.id}">${window.SummaryEditor.html(menu)}</p><div class="menu-practice-shortcuts"><button type="button" class="primary" data-menu-practice-start="write">직접 쓰고 비교하기 →</button><button type="button" data-menu-practice-start="keywords">핵심 카드게임 →</button></div><div data-menu-personal-evidence>${personalEvidence(menu)}</div></section>`;
  }
  function refreshEvidence(){document.querySelectorAll('[data-menu-practice-summary]').forEach(root=>{const menu=menus.get(root.dataset.menuPracticeSummary);if(!menu)return;const target=root.querySelector('[data-menu-personal-evidence]'),open=!!target.querySelector('details[open]');target.innerHTML=personalEvidence(menu);if(open)target.querySelector('details')?.setAttribute('open','');});}
  function splitWriting(text){
    return String(text).replace(/→|⇒|\s+-\s+|\s*>\s*/g,(separator,index,source)=>{
      // 띄어 쓴 숫자 범위(예: 4 - 5cm)는 조리 단계 경계로 나누지 않는다.
      if(separator.includes('-')&&/\d$/.test(source.slice(0,index).trimEnd())&&/^\d/.test(source.slice(index+separator.length).trimStart()))return separator;
      return '\n';
    });
  }
  function compareWriting(text,steps){
    const lines=splitWriting(text).split(/\n+/).map(s=>s.trim()).filter(Boolean),candidates=[];
    // 기존 비교 점수를 재사용하되 앞 단계의 약한 일치가 더 좋은 연결을 빼앗지 않게 한다.
    steps.forEach((step,stepIndex)=>lines.forEach((line,lineIndex)=>{
      const match=window.StudyStudio.compare(line,[step]).matches[0];
      if(match.line===0)candidates.push({step:stepIndex,line:lineIndex,score:match.score});
    }));
    candidates.sort((a,b)=>b.score-a.score||a.step-b.step||a.line-b.line);
    const usedSteps=new Set(),usedLines=new Set(),matches=steps.map((_,step)=>({step,line:-1,score:0}));
    for(const match of candidates){if(usedSteps.has(match.step)||usedLines.has(match.line))continue;matches[match.step]=match;usedSteps.add(match.step);usedLines.add(match.line);}
    const outOfOrder=new Set();let previous=-1;
    matches.forEach(m=>{if(m.line<0)return;if(m.line<previous)outOfOrder.add(m.line);previous=Math.max(previous,m.line);});
    return {lines,matches,matched:usedLines.size,missing:matches.filter(m=>m.line<0).map(m=>m.step),rows:lines.map((text,line)=>({text,step:matches.find(m=>m.line===line)?.step,status:!usedLines.has(line)?'review':outOfOrder.has(line)?'order':'match'}))};
  }
  function comparison(menu,text){
    const result=compareWriting(text,menu.steps),checks=mentions(text,menu.id);
    const highlight=window.ComparisonHighlights;
    const ownWriting=result.rows.map((row,line)=>`<li class="menu-writing-step" data-comparison-own-row="${line}"><header class="menu-writing-step-head"><strong>내가 쓴 ${line+1}번째 문장</strong><span class="menu-writing-state">${Number.isInteger(row.step)?`수업 ${row.step+1}단계와 연결`:'연결 단계 확인 필요'}</span>${row.status==='order'?'<span class="menu-writing-order">내 글 순서 확인</span>':''}</header>${highlight.temporaryWriting(menu,row.text,line)}</li>`).join('');
    const sequence=result.matches.map(match=>{
      const i=match.step,row=match.line>=0?result.rows[match.line]:null;
      return `<li class="menu-writing-step ${row?'is-linked':'is-unlinked'}" data-comparison-row="${i}">
        <header class="menu-writing-step-head"><strong>수업 ${i+1}단계</strong><span class="menu-writing-state">${row?'내 글과 연결됨':'내 글에서 연결하지 못한 단계'}</span>${row?.status==='order'?'<span class="menu-writing-order">내 글 순서 확인</span>':''}</header>
        ${row?`<span class="menu-practice-kicker">왼쪽의 ${match.line+1}번째 문장과 비교</span>${highlight.missingStep(menu,i)}`:`<span class="menu-practice-kicker">빠뜨렸는지, 다른 문장에 합쳐 썼는지 확인하세요.</span>${highlight.missingStep(menu,i)}`}
      </li>`;
    }).join('');
    return `<div class="menu-writing-result" tabindex="-1">
      <h4>내 글과 수업 레시피 비교</h4><p class="menu-practice-muted">${result.matched} / ${menu.steps.length}단계와 비슷한 표현을 찾았습니다. 단어 기반 참고 비교이며, 조리의 정답 판정은 아닙니다. 동시에 할 수 있는 준비는 순서가 달라도 괜찮습니다.</p>
      ${highlight.toolbar(true)}<h5>먼저 확인할 핵심</h5><p class="menu-practice-muted">관련 단어의 언급 여부만 확인합니다. ‘언급 찾음’이어도 용량·순서·부정 표현은 아래 수업 문장과 비교해 주세요.</p>
      <ul class="menu-writing-checklist">${checks.map(c=>`<li class="${c.mentioned?'is-mentioned':'needs-review'}"><span>${c.mentioned?'언급 찾음':'다시 확인'}</span><div><strong>${esc(c.fact.label)}</strong>${highlight.fact(menu,c.fact)}</div></li>`).join('')}</ul>
      <div class="menu-writing-split" aria-label="내 글과 전체 수업 단계 나란히 비교">
        <section class="menu-writing-pane" aria-labelledby="writing-own-title-${menu.id}">
          <header class="menu-writing-pane-head"><h5 id="writing-own-title-${menu.id}">내가 쓴 글</h5><p>작성한 순서 그대로 · ${result.lines.length}문장</p><p>드래그하면 분홍색 비교 표시 · 다시 드래그하면 지우기<br>새로 비교하면 초기화되며 학습 노트에는 저장하지 않습니다.</p><span class="screen-reader" data-comparison-status role="status" aria-live="polite"></span></header>
          <div class="menu-writing-pane-body" role="region" aria-labelledby="writing-own-title-${menu.id}" tabindex="0"><ol class="menu-writing-sequence">${ownWriting}</ol></div>
        </section>
        <section class="menu-writing-pane menu-writing-flow" aria-labelledby="writing-flow-title-${menu.id}">
          <header class="menu-writing-pane-head"><h5 id="writing-flow-title-${menu.id}">전체 수업 단계</h5><p class="menu-writing-legend"><span>내 글과 연결됨 ${result.matched}개</span><span class="is-unlinked">연결하지 못함 ${result.missing.length}개</span></p><p>모든 단계에서 드래그하면 분홍색 비교 표시가 생깁니다. 다시 드래그하면 지워지고, 새로 비교하면 초기화됩니다. 학습 노트에는 저장하지 않습니다.</p><span class="screen-reader" data-comparison-status role="status" aria-live="polite"></span></header>
          <div class="menu-writing-pane-body" role="region" aria-labelledby="writing-flow-title-${menu.id}" tabindex="0">${result.missing.length?'':'<p class="menu-writing-complete">모든 수업 단계와 비슷한 문장을 찾았습니다. 양념·분량과 마무리도 확인해 주세요.</p>'}<ol class="menu-writing-sequence">${sequence}</ol></div>
        </section>
      </div>
    </div>`;
  }
  function renderWrite(menu){
    const s=draft(menu.id);
    return `<div class="menu-writing"><h4>이 메뉴만 직접 쓰고 비교하기</h4><p>처음 올릴 냄비부터 마지막 곁들임까지 써 보세요. 줄바꿈, 화살표(→, &gt;), 띄어 쓴 하이픈( - )으로 작업을 나눌 수 있습니다.</p><label class="menu-writing-label" for="menu-writing-${menu.id}">${esc(menu.name)} · 내가 떠올린 순서</label><textarea id="menu-writing-${menu.id}" data-menu-writing="${menu.id}" maxlength="10000" rows="9" placeholder="1. 먼저 준비할 물·재료는…&#10;2. 기다리는 동안 할 일은…&#10;3. 다음 재료를 넣을 타이밍은…&#10;4. 마지막 고명·소스·곁들임은…">${esc(s.text)}</textarea><p class="menu-practice-muted" data-menu-writing-status role="status">${esc(s.status)}</p><div class="menu-practice-actions"><button type="button" class="primary" data-menu-writing-compare>내 글과 수업 레시피 비교</button><button type="button" data-menu-writing-save>내 학습 노트에 저장</button></div><p class="menu-practice-muted">‘내 학습 노트에 저장’을 누르면 기존 오답노트에서 다시 볼 수 있습니다. 나만의 메모와는 따로 저장됩니다.</p><div data-menu-writing-result aria-live="polite">${s.checked?comparison(menu,s.text):'<p class="menu-writing-placeholder">비교하면 왼쪽에 내가 쓴 글, 오른쪽에 전체 수업 단계가 나란히 나타납니다.</p>'}</div></div>`;
  }
  function renderGame(menu){
    const r=round(menu.id),g=gradeRound(r),positive=r.mode==='yes';
    return `<div class="menu-keyword-game"><div class="menu-game-heading"><span class="eyebrow">${esc(menu.name)} / 핵심 카드게임</span><h4>${positive?'이 메뉴에 맞는 설명은?':'이 메뉴에 맞지 않는 설명은?'}</h4><p>해당하는 카드를 <strong>모두</strong> 고르세요. 준비·타이밍·마무리를 생각해 보세요.</p></div><div class="menu-game-modes" role="group" aria-label="핵심 카드 문제 방식"><button type="button" data-menu-game-mode="yes" aria-pressed="${positive}">맞는 요소 고르기</button><button type="button" data-menu-game-mode="no" aria-pressed="${!positive}">아닌 요소 고르기</button></div><div class="menu-game-score" role="status" aria-live="polite">${r.checked?`<strong>${g.perfect?'모두 맞혔어요!':`${g.correct} / ${g.total}장 판단 일치`}</strong> · 선택한 카드와 놓친 카드를 아래에서 비교하세요.`:`${r.selected.length}장 선택 · 정답 확인 전에는 선택을 바꿀 수 있어요.`}</div><div class="menu-game-grid">${r.cards.map((c,i)=>{const chosen=r.selected.includes(c.id),target=g.target.includes(c.id),matched=chosen===target;return `<div class="menu-game-item ${r.checked?(matched?'is-correct':'is-wrong'):''}"><button type="button" class="menu-game-card" data-menu-game-card="${c.id}" aria-pressed="${chosen}" ${r.checked?'disabled':''}><span class="menu-game-number">${String(i+1).padStart(2,'0')}</span><span>${esc(c.text)}</span><small>${chosen?'✓ 선택함':'선택하기'}</small></button>${r.checked?`<div class="menu-game-feedback"><strong>${target?(chosen?'✓ 잘 골랐어요':'놓친 카드 · 골라야 해요'):(chosen?'다시 확인 · 고르지 않는 카드':'✓ 고르지 않은 판단이 맞아요')}</strong><p><b>이 메뉴의 핵심 · ${esc(c.fact.label)}</b><br>${esc(c.fact.yes)}</p></div>`:''}</div>`;}).join('')}</div><div class="menu-practice-actions"><button type="button" class="primary" data-menu-game-check ${r.checked?'disabled':''}>선택한 카드 정답 확인</button><button type="button" data-menu-game-retry>다시 섞어서 풀기 ↻</button></div><p class="menu-practice-muted">보내주신 수업 레시피 기준입니다. 다시 풀 때 카드의 조합과 위치가 바뀝니다.</p></div>`;
  }
  function refreshGame(root,menu,focus){root.querySelector('[data-lesson-panel="keywords"]').innerHTML=renderGame(menu);if(focus)root.querySelector(focus)?.focus({preventScroll:true});}
  document.addEventListener('input',event=>{
    const el=event.target;if(!el.matches('[data-menu-writing]'))return;
    const id=el.dataset.menuWriting;if(!menus.has(id))return;
    saveDraft(id,el.value);const root=el.closest('.menu-writing');root.querySelector('[data-menu-writing-status]').textContent=draft(id).status;
    root.querySelector('[data-menu-writing-result]').innerHTML='<p class="menu-writing-placeholder">글이 바뀌었습니다. 비교 버튼을 눌러 다시 확인해 주세요.</p>';
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.hasAttribute('data-menu-practice-start')){
      const scope=button.closest('dialog'),target=scope?.querySelector(`[data-lesson-mode="${button.dataset.menuPracticeStart}"]`);
      target?.click();target?.scrollIntoView({block:'start',behavior:'smooth'});target?.focus({preventScroll:true});return;
    }
    const root=button.closest('[data-lesson-menu]');if(!root)return;const menu=menus.get(root.dataset.lessonMenu);if(!menu)return;
    if(button.hasAttribute('data-menu-writing-compare')||button.hasAttribute('data-menu-writing-save')){
      const text=root.querySelector('[data-menu-writing]').value,s=draft(menu.id),status=root.querySelector('[data-menu-writing-status]');
      if(!text.trim()){status.textContent='떠올린 순서를 먼저 적어 주세요.';root.querySelector('[data-menu-writing]').focus();return;}
      if(button.hasAttribute('data-menu-writing-save')){
        const ok=hooks.saveNote?.({id:'menu-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),menu:menu.id,text:text.trim(),when:Date.now()});
        status.textContent=ok?'내 학습 노트 > 오답노트에 저장했습니다.':'노트에 저장하지 못했습니다. 입력한 글을 복사해 보관해 주세요.';return;
      }
      s.text=text;s.checked=true;root.querySelector('[data-menu-writing-result]').innerHTML=comparison(menu,text);return;
    }
    if(button.hasAttribute('data-menu-game-mode')||button.hasAttribute('data-menu-game-retry')){
      const old=round(menu.id),mode=button.dataset.menuGameMode||old.mode;rounds.set(menu.id,makeRound(menu.id,mode,old.cards));
      refreshGame(root,menu,button.hasAttribute('data-menu-game-mode')?`[data-menu-game-mode="${mode}"]`:'[data-menu-game-retry]');return;
    }
    const r=round(menu.id);
    if(button.hasAttribute('data-menu-game-card')&&!r.checked){const id=button.dataset.menuGameCard;if(!r.cards.some(c=>c.id===id))return;r.selected=r.selected.includes(id)?r.selected.filter(x=>x!==id):[...r.selected,id];refreshGame(root,menu,`[data-menu-game-card="${id}"]`);return;}
    if(button.hasAttribute('data-menu-game-check')){r.checked=true;refreshGame(root,menu,'[data-menu-game-retry]');}
  });
  return {summary,renderWrite,renderGame,refreshEvidence,makeRound,gradeRound,mentions,splitWriting,compareWriting,comparison,saveDraft,readDraft,init:options=>{hooks=options;}};
})();
