'use strict';
window.RecipeReview = (() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const engine=window.SummaryQuiz,marks=window.RecipeMarks;
  const words=[...new Set(window.MENUS.flatMap(m=>m.ingredients.map(i=>i.name.replace(/\(.*?\)/g,''))).concat(['갑오징어','명란','깻잎','실파','고기','달걀','밥','김','팬','냄비','면보','찬물','체','껍질','물기','젓가락','칼','도마']))].filter(x=>x.length>0).sort((a,b)=>b.length-a.length);
  const shuffle=values=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}if(a.length>1&&a.every((v,i)=>v===values[i]))a.push(a.shift());return a;};
  const kindLabel=b=>b.kind==='recall'?'직접 입력':b.kind==='ingredient'?'재료·도구':engine.kindLabel(b)|| (b.kind==='measure'?'계량':window.RecipeBlanks.kindLabel(b));
  function makeQuestions(type,entries){
    return entries.map(item=>{
      const start=item.start??0,end=item.end??item.text.length,part=item.text.slice(start,end);
      let blanks=engine.parse(part,'all').map(b=>({...b,start:b.start+start,end:b.end+start}));
      if(!blanks.length&&start===0&&end===item.text.length){
        const token=words.find(word=>part.includes(word));
        if(token){const at=part.indexOf(token);blanks=[{start:at,end:at+token.length,answer:token,kind:'ingredient'}];}
      }
      // Arbitrary highlighted words remain meaningful even without a known unit or sauce.
      if(!blanks.length)blanks=[{start,end,answer:part,kind:'recall'}];
      return {item,blanks};
    });
  }
  function options(blank){
    if(blank.kind==='ingredient')return shuffle([blank.answer,...shuffle(words.filter(x=>x!==blank.answer&&!x.includes(blank.answer)&&!blank.answer.includes(x))).slice(0,3)]);
    return engine.options(blank);
  }
  const normalize=s=>String(s??'').trim().replace(/\s+/g,'');
  function score(blanks,answers){const results=blanks.map((b,i)=>b.kind==='recall'?normalize(answers[i])===normalize(b.answer):answers[i]===b.answer);return {total:blanks.length,answered:answers.filter(x=>String(x||'').trim()).length,correct:results.filter(Boolean).length,results};}
  let dialog,opener,round;
  function render(){
    const title='형광펜 구절 빈칸 복습';
    const cards=round.questions.map((q,i)=>{
      const {info,index,ref}=marks.locate(q.item);let cursor=0;
      const sentence=q.blanks.map((b,j)=>{const before=esc(q.item.text.slice(cursor,b.start));cursor=b.end;const label=`${i+1}번 문제 ${j+1}번 ${kindLabel(b)} 빈칸`;
        const control=b.kind==='recall'?`<input type="text" autocomplete="off" aria-label="${esc(label)}" placeholder="표시한 구절을 직접 입력" maxlength="10000">`:`<select aria-label="${esc(label)}"><option value="">___ ${kindLabel(b)} ___</option>${options(b).map(choice=>`<option value="${esc(choice)}">${esc(choice)}</option>`).join('')}</select>`;
        return before+`<span class="blank-slot"><span class="blank-number" aria-hidden="true">${j+1}</span>${control}</span>`;
      }).join('')+esc(q.item.text.slice(cursor));
      return `<section class="recipe-review-card" data-review-question="${i}" aria-label="${i+1}번 문제"><h3>${i+1}. ${esc(info.title)} <small>${esc(marks.caption(q.item))}</small></h3><p class="blank-sentence">${sentence}</p>${q.blanks.some(b=>b.kind==='recall')?'<p class="recipe-review-hint">선택한 구절을 그대로 입력해 주세요. 띄어쓰기를 제외한 글자로 비교해요.</p>':''}<p class="recipe-review-feedback" role="status"></p></section>`;
    }).join('');
    dialog.innerHTML=`<div class="blank-heading"><div><span class="eyebrow">내 학습 노트 / 선택한 부분만</span><h2 id="recipe-review-title">${title}</h2><p>${round.questions.length}개 문제 · ${round.questions.reduce((n,q)=>n+q.blanks.length,0)}개 빈칸</p></div><button type="button" data-review-close aria-label="표시한 부분 복습 닫기">닫기</button></div><p class="blank-guide">형광펜으로 표시한 범위 안에서만 빈칸을 만들었어요. 문장 전체를 표시한 단계도 함께 복습해요. T는 큰술, t는 작은술이에요.</p>${round.questions.some(q=>q.item.kind==='comparison-writing')?'<p class="recipe-review-hint">내가 쓴 문장 문제는 저장한 표현을 떠올리는 복습입니다. 수업 정답으로 판정한 내용이 아니므로 레시피와 함께 확인하세요.</p>':''}<form class="recipe-review-form" novalidate>${cards}<div class="blank-result recipe-review-result" role="status" aria-live="polite">모든 빈칸을 채운 뒤 한 번에 확인해 보세요.</div><div class="blank-actions"><button type="button" data-review-retry>다시 섞어 풀기</button><button type="submit" class="primary">전체 정답 확인</button></div></form>`;
  }
  function grade(){
    const fields=[...dialog.querySelectorAll('select,input')],missing=fields.filter(f=>!f.value.trim());
    if(missing.length){dialog.querySelector('.recipe-review-result').textContent=`아직 ${missing.length}개 빈칸이 남았어요.`;missing[0].focus();return;}
    let total=0,correct=0;
    round.questions.forEach((q,i)=>{const node=dialog.querySelector(`[data-review-question="${i}"]`),inputs=[...node.querySelectorAll('select,input')],result=score(q.blanks,inputs.map(f=>f.value));total+=result.total;correct+=result.correct;
      inputs.forEach((f,j)=>{f.classList.toggle('answer-correct',result.results[j]);f.classList.toggle('answer-wrong',!result.results[j]);f.setAttribute('aria-invalid',String(!result.results[j]));});
      node.querySelector('.recipe-review-feedback').textContent=`${result.correct} / ${result.total} 정답${result.correct===result.total?' · 모두 맞혔어요.':' · '+q.blanks.map((b,j)=>result.results[j]?'':`${j+1}번 정답: ${b.answer}`).filter(Boolean).join(' / ')}`;
    });
    dialog.querySelector('.recipe-review-result').textContent=`${correct} / ${total} 정답 · ${correct===total?'표시한 부분을 모두 맞혔어요.':'틀린 빈칸의 정답을 각 문제에서 확인해 주세요.'}`;
  }
  function ensure(){
    if(dialog)return;dialog=document.createElement('dialog');dialog.className='recipe-blank-dialog recipe-review-dialog';dialog.setAttribute('aria-labelledby','recipe-review-title');document.body.append(dialog);
    dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{if(event.target.closest('[data-review-close]'))dialog.close();if(event.target.closest('[data-review-retry]')){round.questions=shuffle(round.questions);render();dialog.querySelector('select,input')?.focus();}});
    dialog.addEventListener('submit',event=>{event.preventDefault();grade();});
    const changed=event=>{if(!event.target.matches('select,input'))return;dialog.querySelectorAll('select,input').forEach(f=>{f.classList.remove('answer-correct','answer-wrong');f.removeAttribute('aria-invalid');});dialog.querySelectorAll('.recipe-review-feedback').forEach(el=>el.textContent='');dialog.querySelector('.recipe-review-result').textContent='수정한 답으로 전체 정답 확인을 눌러 주세요.';};
    dialog.addEventListener('change',changed);dialog.addEventListener('input',changed);
  }
  function open(type,entries,button){
    if(!entries.length)return;ensure();opener=button;round={type,questions:shuffle(makeQuestions(type,entries))};render();dialog.showModal();
  }
  return {open,makeQuestions,score};
})();
