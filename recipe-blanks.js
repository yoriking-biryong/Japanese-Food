'use strict';
window.RecipeBlanks=(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalizeSeasoning=text=>String(text??'').replace(/맛술\s*[（(]미림[）)]|미림\s*[（(]맛술[）)]|미림/g,'맛술');
  const groups=[
    ['진간장','간장','국간장'],['소금'],['청주'],['미림','맛술','맛술(미림)'],['설탕','흰설탕'],['식초'],
    ['후추','흑후추','후춧가루','검은후춧가루'],['된장','일본된장'],['고추냉이'],['산초가루'],['고춧가루','고운 고춧가루'],
    ['참기름'],['식용유'],['버터'],['폰즈','초간장','초간장(폰즈)'],['도사스'],
    ['다래','양념간장','양념간장(다래)'],['덴다시'],['초밥초','배합초','초대리'],['간장무즙'],['돈부리다시'],['소바다시']
  ];
  const sauces=new Set(['폰즈','초간장','초간장(폰즈)','도사스','다래','양념간장','양념간장(다래)','덴다시','초밥초','배합초','초대리','간장무즙','돈부리다시','소바다시']);
  const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const seasonings=groups.flat().sort((a,b)=>b.length-a.length).map(escapeRE).join('|');
  const number='\\d+(?:\\.\\d+)?',range=number+'(?:\\s*[~～–-]\\s*'+number+')?';
  const dimensions=range+'(?:\\s*[×xX*]\\s*'+range+')*\\s*cm';
  const shuffle=values=>{const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const durations='(?<![\\d.])'+range+'\\s*(?:시간|분|초)(?=$|[^가-힣]|간|정도|이상|이하|내외|동안|뒤|후|전|쯤|씩)';
  const heatLevels='매우\\s*약불|중불보다\\s*약하게|센불\\s*[~～–-]\\s*중불|중약불|약불|중불|센불';
  const kindLabel=blank=>blank.kind==='size'?'치수':blank.kind==='time'?'시간':blank.kind==='heat'?'불세기':'양념';
  function parse(text){
    const re=new RegExp(`(${dimensions})|(${durations})|(?<![가-힣])(${heatLevels})|(?<![가-힣])(${seasonings})`,'g'),blanks=[];
    for(const match of String(text).matchAll(re))blanks.push({start:match.index,end:match.index+match[0].length,answer:normalizeSeasoning(match[0]),kind:match[1]?'size':match[2]?'time':match[3]?'heat':'seasoning'});
    return blanks;
  }
  function options(blank){
    blank={...blank,answer:normalizeSeasoning(blank.answer)};
    if(blank.kind==='heat'){
      const pool=blank.answer.includes('보다')?['중불로','센불에 가깝게','센불로']
        :/[~～–-]/.test(blank.answer)?['약불~중약불','중약불~중불','매우 약불~약불']
        :['매우 약불','약불','중약불','중불','센불'];
      return shuffle([blank.answer,...shuffle(pool.filter(s=>s.replace(/\s/g,'')!==blank.answer.replace(/\s/g,''))).slice(0,3)]);
    }
    if(blank.kind==='size'||blank.kind==='time'){
      const result=new Set([blank.answer]);
      for(const factor of [.5,2,1.5,3])result.add(blank.answer.replace(/\d+(?:\.\d+)?/g,n=>String(Math.max(.01,Math.round(Number(n)*factor*100)/100))));
      return shuffle([...result].slice(0,4));
    }
    const family=groups.find(g=>g.includes(blank.answer))||[blank.answer];
    const pool=sauces.has(blank.answer)?['폰즈','도사스','다래','덴다시','초밥초','간장무즙']:['진간장','소금','청주','맛술','설탕','식초','후추','된장','참기름','식용유'];
    return shuffle([blank.answer,...shuffle(pool.filter(s=>!family.includes(s))).slice(0,3)]);
  }
  function trigger(text,label='조리 설명',menuIds=[]){
    const html=window.RecipeReference?.format(menuIds,text)||esc(text);
    if(!parse(text).length)return `<p>${html}</p>`;
    return `<button type="button" class="blank-launch" data-blank-open="${esc(text)}" data-blank-label="${esc(label)}"><span>${html}</span><small>양념 · cm · 시간 · 불세기 빈칸 맞히기 ↗</small></button>`;
  }
  function grade(blanks,answers){return {total:blanks.length,answered:answers.filter(Boolean).length,correct:blanks.filter((b,i)=>answers[i]===b.answer).length,results:blanks.map((b,i)=>answers[i]===b.answer)};}
  let dialog,opener,current;
  function ensure(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='recipe-blank-dialog';dialog.setAttribute('aria-labelledby','recipe-blank-title');document.body.append(dialog);
    dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{
      const action=event.target.closest('[data-blank-action]')?.dataset.blankAction;
      if(action==='close')dialog.close();
      if(action==='retry'){render();dialog.querySelector('select')?.focus();}
    });
    dialog.addEventListener('submit',event=>{
      event.preventDefault();
      const selects=[...dialog.querySelectorAll('select')],answers=selects.map(s=>s.value),score=grade(current.blanks,answers);
      if(score.answered!==score.total){dialog.querySelector('.blank-result').textContent='모든 빈칸의 답을 먼저 골라 주세요.';return;}
      selects.forEach((select,i)=>{select.classList.toggle('answer-correct',score.results[i]);select.classList.toggle('answer-wrong',!score.results[i]);select.setAttribute('aria-invalid',String(!score.results[i]));});
      dialog.querySelector('.blank-result').innerHTML=`<strong>${score.correct} / ${score.total} 정답</strong>${score.correct===score.total?'<p>모두 맞혔어요. 양념·치수·시간·불세기를 잘 기억했어요.</p>':`<ul>${current.blanks.map((b,i)=>`<li>${i+1}번 ${kindLabel(b)} · ${score.results[i]?'정답':'다시 확인'}: <b>${esc(b.answer)}</b></li>`).join('')}</ul>`}`;
    });
    dialog.addEventListener('change',event=>{
      if(!event.target.matches('select'))return;
      for(const select of dialog.querySelectorAll('select')){select.classList.remove('answer-correct','answer-wrong');select.removeAttribute('aria-invalid');}
      dialog.querySelector('.blank-result').textContent='답을 골랐어요. 정답 확인을 눌러 비교하세요.';
    });
  }
  function render(){
    let cursor=0;
    const masked=current.blanks.map((blank,index)=>{
      const before=esc(current.text.slice(cursor,blank.start));cursor=blank.end;
      return before+`<span class="blank-slot"><span class="blank-number" aria-hidden="true">${index+1}</span><select required aria-label="${index+1}번 ${kindLabel(blank)} 빈칸"><option value="" selected disabled>___ ${blank.kind==='size'?'cm':kindLabel(blank)} ___</option>${options(blank).map(choice=>`<option value="${esc(choice)}">${esc(choice)}</option>`).join('')}</select></span>`;
    }).join('')+esc(current.text.slice(cursor));
    dialog.innerHTML=`<div class="blank-heading"><div><span class="eyebrow">RECIPE / 빈칸 연습</span><h2 id="recipe-blank-title">${esc(current.label)}</h2></div><button type="button" class="text-button" data-blank-action="close" aria-label="빈칸 연습 닫기">닫기</button></div><p class="blank-guide">문장 속 양념과 cm 치수, 조리 시간, 불세기를 골라 보세요. 보기에는 정답과 오답이 함께 있어요.</p><form><p class="blank-sentence">${masked}</p><div class="blank-result" role="status" aria-live="polite">총 ${current.blanks.length}개 빈칸 · 기존 레시피 기준</div><div class="blank-actions"><button type="button" data-blank-action="retry">다시 풀기</button><button type="submit" class="primary">정답 확인</button></div></form>`;
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-blank-open]');if(!button)return;
    const text=button.dataset.blankOpen,blanks=parse(text);if(!blanks.length)return;
    opener=button;current={text,blanks,label:button.dataset.blankLabel||'조리 설명'};ensure();render();dialog.showModal();
  });
  return {parse,options,grade,trigger,kindLabel,normalizeSeasoning};
})();
