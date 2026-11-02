'use strict';
window.RecipeCardBlanks=(()=>{
  const quiz=window.RecipeBlanks,records=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function record(key,text,label){
    let item=records.get(key);
    if(!item||item.text!==text){
      const blanks=quiz.parse(text);
      item={text,label,blanks,choices:blanks.map(quiz.options),answers:blanks.map(()=>''),checked:false};
      records.set(key,item);
    }
    item.label=label;
    return item;
  }
  function content(item){
    let cursor=0;
    const score=quiz.grade(item.blanks,item.answers);
    const sentence=item.blanks.map((blank,index)=>{
      const before=esc(item.text.slice(cursor,blank.start));cursor=blank.end;
      const result=item.checked?` class="${score.results[index]?'answer-correct':'answer-wrong'}" aria-invalid="${!score.results[index]}"`:'';
      return before+`<span class="blank-slot"><span class="blank-number" aria-hidden="true">${index+1}</span><select required data-card-blank-index="${index}" aria-label="${esc(item.label)} · ${index+1}번 ${quiz.kindLabel(blank)} 빈칸"${result}><option value="" disabled ${item.answers[index]?'':'selected'}>___ ${blank.kind==='size'?'cm':quiz.kindLabel(blank)} ___</option>${item.choices[index].map(choice=>`<option value="${esc(choice)}" ${item.answers[index]===choice?'selected':''}>${esc(choice)}</option>`).join('')}</select></span>`;
    }).join('')+esc(item.text.slice(cursor));
    const result=item.checked?`<strong>${score.correct} / ${score.total} 정답</strong>${score.correct===score.total?'<span>모두 맞혔어요.</span>':`<ul>${item.blanks.map((blank,index)=>score.results[index]?'':`<li>${index+1}번 정답: <b>${esc(blank.answer)}</b></li>`).join('')}</ul>`}`:`${score.answered} / ${score.total}개 선택 · 카드 안에서 답을 골라 보세요.`;
    return `<p class="card-blank-sentence">${sentence}</p><div class="card-blank-result" role="status" aria-live="polite">${result}</div><div class="card-blank-actions"><button type="button" data-card-blank-retry>다시 풀기</button><button type="submit">정답 확인</button><button type="button" class="text-button" data-blank-open="${esc(item.text)}" data-blank-label="${esc(item.label)}">크게 풀기 ↗</button></div>`;
  }
  function render(text,key,label){
    if(!quiz.parse(text).length)return `<p>${esc(text)}</p>`;
    return `<form class="card-blank-practice" data-card-blank-key="${esc(key)}" aria-label="${esc(label)} 빈칸 연습">${content(record(key,text,label))}</form>`;
  }
  document.addEventListener('submit',event=>{
    const form=event.target.closest('[data-card-blank-key]');if(!form)return;
    event.preventDefault();
    const item=records.get(form.dataset.cardBlankKey);if(!item)return;
    item.answers=[...form.querySelectorAll('select')].map(s=>s.value);
    if(item.answers.some(answer=>!answer)){form.querySelector('.card-blank-result').textContent='모든 빈칸의 답을 먼저 골라 주세요.';return;}
    item.checked=true;form.innerHTML=content(item);form.querySelector('[type="submit"]').focus({preventScroll:true});
  });
  document.addEventListener('change',event=>{
    const select=event.target.closest('[data-card-blank-index]'),form=select?.closest('[data-card-blank-key]');if(!form)return;
    const item=records.get(form.dataset.cardBlankKey);if(!item)return;
    item.answers[Number(select.dataset.cardBlankIndex)]=select.value;item.checked=false;
    for(const field of form.querySelectorAll('select')){field.classList.remove('answer-correct','answer-wrong');field.removeAttribute('aria-invalid');}
    form.querySelector('.card-blank-result').textContent=`${item.answers.filter(Boolean).length} / ${item.blanks.length}개 선택 · 정답 확인을 눌러 보세요.`;
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-card-blank-retry]'),form=button?.closest('[data-card-blank-key]');if(!form)return;
    const item=records.get(form.dataset.cardBlankKey);if(!item)return;
    item.answers=item.blanks.map(()=>'');item.choices=item.blanks.map(quiz.options);item.checked=false;
    form.innerHTML=content(item);form.querySelector('select')?.focus({preventScroll:true});
  });
  return {render};
})();
