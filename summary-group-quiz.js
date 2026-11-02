'use strict';
window.SummaryGroupQuiz = (() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label=b=>window.SummaryQuiz.kindLabel(b)||(b.kind==='measure'?'계량':window.RecipeBlanks.kindLabel(b));
  // Keep ingredient and amount together; never reorder instructions or split a ratio.
  function parts(entry){
    if(entry.mode==='sauces')return entry.text.split(' + ');
    const pieces=entry.text.split(' · ');
    return pieces.length>1&&pieces.every(s=>/^(?:각 )?(?:길이|너비|높이|두께|총|당근 두께|무 두께)/.test(s))?pieces:[entry.text];
  }
  // Every movable part changes position, even when random shuffling gives fixed points.
  function rearrange(previous,random=Math.random){
    if(previous.length<2)return [...previous];
    for(let trial=0;trial<16;trial++){
      const out=[...previous];
      for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
      if(out.every((id,i)=>id!==previous[i]))return out;
    }
    const offset=1+Math.floor(random()*(previous.length-1));
    return previous.slice(offset).concat(previous.slice(0,offset));
  }
  function makeRound(entries,prior=[],random=Math.random){
    const old=new Map(prior.map(row=>[row.entry.key,row]));
    return [...new Map(entries.map(e=>[e.key,e])).values()].map(entry=>{
      const segments=parts(entry),previous=old.get(entry.key)?.order||segments.map((_,i)=>i);
      return {entry,segments,order:rearrange(previous,random)};
    });
  }
  let dialog,opener,current;
  function masked(row){
    row.blanks=[];
    return row.order.map(partIndex=>{
      const text=row.segments[partIndex],engine=window.SummaryQuiz;
      const blanks=engine.parse(text,current.names?'all':'measure');
      // A quantity-free seasoning still gets a name question instead of an invented amount.
      const chosen=blanks.length?blanks:engine.parse(text,'all');
      let cursor=0;
      const html=chosen.map(b=>{
        const before=esc(text.slice(cursor,b.start));cursor=b.end;
        const number=row.blanks.push(b),name=`${row.entry.menu.name} ${row.entry.label} ${number}번 ${label(b)} 빈칸`;
        return before+`<span class="blank-slot"><span class="blank-number" aria-hidden="true">${number}</span><select aria-label="${esc(name)}"><option value="">___ ${label(b)} ___</option>${engine.options(b).map(choice=>`<option value="${esc(choice)}">${esc(choice)}</option>`).join('')}</select></span>`;
      }).join('')+esc(text.slice(cursor));
      return `<span class="group-quiz-part" data-group-part="${partIndex}">${html}</span>`;
    }).join(`<span class="group-quiz-join" aria-hidden="true">${row.entry.mode==='sizes'?'·':'＋'}</span>`);
  }
  function render(){
    const rows=current.rows.map((row,i)=>`<tr data-group-quiz-row="${i}"><th scope="row"><strong>${esc(row.entry.menu.name)}</strong><span>${esc(row.entry.label)}</span><small>수업 ${row.entry.steps.join(' · ')}단계</small></th><td><div class="group-quiz-parts">${masked(row)}</div><p class="group-row-score" aria-live="polite"></p></td></tr>`).join('');
    const count=current.rows.reduce((n,row)=>n+row.blanks.length,0),menuCount=new Set(current.rows.map(row=>row.entry.menu.id)).size;
    dialog.innerHTML=`<div class="blank-heading"><div><span class="eyebrow">묶음 전체 / 비교하며 외우기</span><h2 id="summary-group-title">${esc(current.name)}</h2><p class="group-quiz-count">${menuCount}품목 · ${current.rows.length}항목 · ${count}개 빈칸</p></div><button type="button" data-group-close aria-label="묶음 퀴즈 닫기">닫기</button></div><p class="blank-guide">${current.rows[0].entry.mode==='sizes'?'길이·너비·두께·제출 개수를 품목별로 비교해 보세요.<br>다시 풀면 나눌 수 있는 치수 항목의 위치가 바뀌어요.':'품목별 차이를 비교하며 빈칸을 골라 보세요. <b>T는 큰술, t는 작은술</b>이에요.<br>다시 풀면 여러 재료로 된 배합의 위치가 바뀌어요. 재료와 용량은 함께 움직입니다.'}</p><label class="group-mask-label" ${current.rows[0].entry.mode==='sizes'?'hidden':''}><input type="checkbox" data-group-names ${current.names?'checked':''}> 양념 이름도 가리기</label><form class="summary-group-form" novalidate><div class="group-quiz-table-wrap"><table class="group-quiz-table"><caption class="screen-reader">${esc(current.name)} 묶음 전체 빈칸 퀴즈</caption><thead><tr><th scope="col">품목 · 용도</th><th scope="col">${current.rows[0].entry.mode==='sizes'?'치수 · 제출 규격':'소스 · 용량'} 빈칸</th></tr></thead><tbody>${rows}</tbody></table></div><div class="blank-result group-quiz-result" role="status" aria-live="polite">모든 빈칸을 고르면 묶음 전체를 한 번에 채점해요.</div><section class="group-quiz-comparison" hidden aria-label="묶음 정답 비교"></section><div class="blank-actions group-quiz-actions"><button type="button" data-group-retry>재료 위치 섞어 다시 풀기</button><button type="submit" class="primary">묶음 전체 정답 확인</button></div></form>`;
    dialog.querySelector('#summary-group-title').innerHTML=window.SummaryReference.groupTitle(current.name);
  }
  function compare(){
    const section=dialog.querySelector('.group-quiz-comparison');section.hidden=false;
    section.innerHTML=`<h3>정답 배합 · 규격 나란히 비교</h3><p>정답은 정리표 순서로 모았어요. 같은 재료의 양이 어디서 달라지는지 비교하세요.</p>${window.RecipeMarks.summaryToolbar()}<table><caption class="screen-reader">묶음 정답 배합과 규격 비교</caption><thead><tr><th scope="col">품목 · 용도</th><th scope="col">정답 · 드래그하여 형광펜 표시</th></tr></thead><tbody>${current.rows.map(({entry:e})=>`<tr><th scope="row">${esc(e.menu.name)}<small>${esc(e.label)}</small></th><td>${window.RecipeMarks.summary(e)}</td></tr>`).join('')}</tbody></table>`;
  }
  function grade(){
    const inputs=[...dialog.querySelectorAll('select')],missing=inputs.filter(input=>!input.value);
    if(missing.length){dialog.querySelector('.group-quiz-result').textContent=`아직 ${missing.length}개 빈칸이 남았어요. 모든 답을 고른 뒤 확인해 주세요.`;missing[0].focus();return;}
    let total=0,correct=0;
    current.rows.forEach((row,i)=>{
      const node=dialog.querySelector(`[data-group-quiz-row="${i}"]`),fields=[...node.querySelectorAll('select')];
      const score=window.RecipeBlanks.grade(row.blanks,fields.map(f=>f.value));total+=score.total;correct+=score.correct;
      fields.forEach((field,j)=>{field.classList.toggle('answer-correct',score.results[j]);field.classList.toggle('answer-wrong',!score.results[j]);field.setAttribute('aria-invalid',String(!score.results[j]));});
      const wrong=row.blanks.map((b,j)=>score.results[j]?'':`${j+1}번 ${label(b)}: ${b.answer}`).filter(Boolean);
      node.querySelector('.group-row-score').textContent=`${score.correct} / ${score.total} 정답${wrong.length?' · 다시 확인 — '+wrong.join(' / '):' · 모두 맞혔어요.'}`;
    });
    dialog.querySelector('.group-quiz-result').innerHTML=`<strong>${correct} / ${total} 정답</strong><p>${correct===total?'묶음을 모두 맞혔어요.':'틀린 빈칸을 품목별로 표시했어요.'} 아래 정답표에서 서로 다른 양을 비교해 보세요.</p>`;
    compare();
  }
  function ensure(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='recipe-blank-dialog summary-group-dialog';dialog.setAttribute('aria-labelledby','summary-group-title');document.body.append(dialog);
    dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{
      if(event.target.closest('[data-group-close]'))dialog.close();
      if(event.target.closest('[data-action="highlight-notes"]'))dialog.close();
      if(event.target.closest('[data-group-retry]')){current.rows=makeRound(current.rows.map(row=>row.entry),current.rows);render();dialog.querySelector('select')?.focus();}
    });
    dialog.addEventListener('change',event=>{
      if(event.target.matches('[data-group-names]')){current.names=event.target.checked;render();dialog.querySelector('[data-group-names]').focus();return;}
      if(!event.target.matches('select'))return;
      dialog.querySelectorAll('select').forEach(field=>{field.classList.remove('answer-correct','answer-wrong');field.removeAttribute('aria-invalid');});
      dialog.querySelectorAll('.group-row-score').forEach(node=>node.textContent='');
      dialog.querySelector('.group-quiz-comparison').hidden=true;
      dialog.querySelector('.group-quiz-result').textContent='선택한 답으로 묶음 전체 정답 확인을 눌러 주세요.';
    });
    dialog.addEventListener('submit',event=>{event.preventDefault();grade();});
  }
  function open(group,button){
    if(!group?.rows.length)return;
    ensure();opener=button;current={name:group.name,names:false,rows:makeRound(group.rows)};render();dialog.showModal();
  }
  return {open,parts,rearrange,makeRound};
})();
