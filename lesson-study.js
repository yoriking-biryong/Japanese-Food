'use strict';
window.LessonStudy = (() => {
 const base=window.RecipeBlanks;
 const menus=new Map(window.MENUS.map(m=>[m.id,m]));
 const notes=window.LESSON_STUDY_NOTES;
 const states=new Map();
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffle=a=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}if(out.length>1&&out.every((n,i)=>n===a[i]))out.push(out.shift());return out;};
 const numeric='(?:\\d+(?:\\.\\d+|/\\d+)?[½¼¾]?|[½¼¾])';
 const amountRE=new RegExp('(?<![\\d.])(?:'+numeric+'(?:\\s*[~～–-]\\s*'+numeric+')?\\s*(?:[Tt](?![A-Za-z])|큰술|작은술|mL|ml|컵(?:\\s*반)?)|(?:한|두|세|반)\\s*컵(?:\\s*반)?)','g');
 function parse(text,mode='measure'){
  const words=base.parse(text).filter(b=>mode==='all'||b.kind==='size'||b.kind==='time'||b.kind==='heat');
  for(const match of String(text).matchAll(amountRE))words.push({start:match.index,end:match.index+match[0].length,answer:match[0],kind:'measure'});
  return words.sort((a,b)=>a.start-b.start).filter((b,i,a)=>!i||b.start>=a[i-1].end);
 }
 function options(blank){
  if(blank.kind!=='measure')return base.options(blank);
  const answer=blank.answer,unit=answer.match(/T|t|큰술|작은술|mL|ml|컵/)?.[0]||'컵';
  const values=[answer];
  if(unit==='T'||unit==='t')values.push(answer.replace(unit,unit==='T'?'t':'T'));
  const v=Number(answer.match(/^\d+(?:\.\d+)?/)?.[0])||1;
  for(const n of [v*2,v*.5,v+1,3,4,5])values.push(`${Math.round(n*100)/100}${unit}`);
  // Avoid equivalent cup spellings (e.g. 반 컵 and 0.5컵) as distractors.
  const cupValue=s=>{const t=s.replace(/\s/g,'').replace(/한/g,'1').replace(/두/g,'2').replace(/세/g,'3');if(t==='반컵')return .5;if(/^\d+컵반$/.test(t))return Number(t.match(/^\d+/)[0])+.5;if(t.includes('~'))return null;return Number(t.replace('컵','').replace('½','.5'));};
  return shuffle([...new Set(values)].filter((s,i)=>!i||unit!=='컵'||cupValue(s)!==cupValue(answer)).slice(0,4));
 }
 function trigger(text,label='수업 레시피',menuIds=[]){
  const html=window.RecipeReference?.format(menuIds,text)||esc(text);
  if(!parse(text,'all').length)return `<p>${html}</p>`;
  return `<button type="button" class="blank-launch lesson-blank-launch" data-lesson-blank="${esc(text)}" data-lesson-label="${esc(label)}"><span>${html}</span><small>계량 T·t · 치수 · 시간 · 불세기 · 양념 빈칸 맞히기 ↗</small></button>`;
 }
 function rows(items,menu,kind,interactive){return items.map(([label,text,steps],index)=>{
  let content=interactive&&window.SummaryQuiz?window.SummaryQuiz.trigger(menu,kind,index,text,label):`<p><strong>${window.SummaryReference?.format(menu.id,kind,index,text)||esc(text)}</strong></p>`;
  if(!content.startsWith('<button')&&!content.startsWith('<p>'))content=`<p>${content}</p>`;
  if(window.RecipeMarks)content=window.RecipeMarks.summary({menu,mode:kind,index,text},content);
  return `<tr><th scope="row">${esc(label)}</th><td>${content}<small>수업 ${steps.join(' · ')}단계</small></td></tr>`;
 }).join('');}
 function summary(menu,{interactive=false}={}){const n=notes[menu.id];return `<div class="lesson-reference">${window.SummaryReference?.legend()||''}<div class="lesson-reference-grid"><section><h4>소스 · 계량</h4><table><caption class="screen-reader">${esc(menu.name)} 소스와 계량 정리</caption><colgroup><col><col></colgroup><tbody>${rows(n.sauces,menu,'sauces',interactive)}</tbody></table></section><section><h4>길이 · 크기 · 제출</h4>${n.sizes.length?`<table><caption class="screen-reader">${esc(menu.name)} 치수 정리</caption><colgroup><col><col></colgroup><tbody>${rows(n.sizes,menu,'sizes',interactive)}</tbody></table>`:'<p class="lesson-no-size">수업 레시피에 지정된 cm 치수가 없어요.</p>'}</section></div><p class="lesson-small">T = 큰술 · t = 작은술. 수업에서 사용한 배합량이며 지급량과 달라요. 수치가 없는 분량은 임의로 정하지 않았어요.</p></div>`;}
 function makeOrder(menu,range='all'){
  const start=range==='all'?0:Number(range),end=range==='all'?menu.steps.length:Math.min(start+5,menu.steps.length);
  const expected=Array.from({length:end-start},(_,i)=>start+i);
  return {range,expected,pool:shuffle(expected),picked:[],checked:false,message:''};
 }
 function state(menu){if(!states.has(menu.id))states.set(menu.id,{mode:'read',order:makeOrder(menu)});return states.get(menu.id);}
 function gradeOrder(expected,picked){const results=picked.map((id,i)=>id===expected[i]);return {complete:picked.length===expected.length&&new Set(picked).size===expected.length,correct:results.filter(Boolean).length,total:expected.length,results};}
 function orderContent(menu,item){
  const score=gradeOrder(item.expected,item.picked);
  const ranges=Array.from({length:Math.ceil(menu.steps.length/5)},(_,i)=>i*5);
  return `<div class="lesson-order-head"><div><h4>한 메뉴 순서 맞히기</h4><p>${item.range==='all'?`수업 레시피 전체 ${menu.steps.length}단계를 연습합니다.`:`전체 ${menu.steps.length}단계 중 ${item.expected[0]+1}–${item.expected.at(-1)+1}단계만 연습 중입니다.`} 먼저 할 작업부터 눌러 아래에 놓으세요.</p></div><label>연습 범위 <select data-lesson-range aria-label="순서 연습 범위"><option value="all" ${item.range==='all'?'selected':''}>전체 ${menu.steps.length}단계</option>${ranges.map(start=>`<option value="${start}" ${item.range===String(start)?'selected':''}>부분 연습 · ${start+1}–${Math.min(start+5,menu.steps.length)}단계</option>`).join('')}</select></label></div><p class="lesson-small">수업에 기록된 순서와 비교해요. 동시에 가능한 준비 작업에는 다른 순서도 있을 수 있어요.</p><div class="lesson-order-status" role="status" aria-live="polite">${item.checked?`<strong>${score.correct} / ${score.total}개 위치 일치</strong> · ${score.correct===score.total?'수업 순서를 모두 맞혔어요.':'다른 위치의 문장 바로 아래에서 수업 순서를 비교해 보세요.'}`:esc(item.message||`${item.picked.length} / ${item.expected.length}개 배치`)}</div><h5>섞인 작업 카드</h5><div class="lesson-order-bank">${item.pool.length?item.pool.map(id=>`<button type="button" data-lesson-add="${id}"><span>${window.RecipeReference?.format(menu.id,menu.steps[id])||esc(menu.steps[id])}</span><small>이 작업 놓기 ＋</small></button>`).join(''):'<p class="lesson-small">카드를 모두 놓았어요. 순서를 확인해 보세요.</p>'}</div><h5>내가 놓은 순서</h5><ol class="lesson-order-picked">${item.picked.map((id,i)=>`<li class="${item.checked?(score.results[i]?'is-correct':'is-wrong'):''}"><span class="lesson-position">${i+1}</span><div><p>${window.RecipeReference?.format(menu.id,menu.steps[id])||esc(menu.steps[id])}</p>${item.checked?`<small>${score.results[i]?'수업 순서와 일치':'이 위치는 수업 순서와 달라요'}</small>${!score.results[i]?`<div class="lesson-order-comparison"><strong>이 위치의 수업 순서 · ${item.expected[i]+1}단계</strong><p>${window.RecipeReference?.format(menu.id,menu.steps[item.expected[i]])||esc(menu.steps[item.expected[i]])}</p></div>`:''}`:''}<div class="lesson-move-actions"><button type="button" data-lesson-move="${i}" data-direction="-1" ${i===0?'disabled':''} aria-label="${i+1}번째 작업 위로">↑ 위로</button><button type="button" data-lesson-move="${i}" data-direction="1" ${i===item.picked.length-1?'disabled':''} aria-label="${i+1}번째 작업 아래로">↓ 아래로</button><button type="button" data-lesson-remove="${i}" aria-label="${i+1}번째 작업 되돌리기">되돌리기</button></div></div></li>`).join('')}</ol>${!item.picked.length?'<p class="lesson-small">위의 카드부터 선택해 주세요.</p>':''}<div class="lesson-order-actions"><button type="button" data-lesson-reset>다시 섞기</button><button type="button" class="primary" data-lesson-check>순서 확인</button>${item.checked&&item.range!=='all'&&Number(item.range)+5<menu.steps.length?'<button type="button" data-lesson-next>다음 5단계 →</button>':''}</div>`;
 }
 function plateSummary(menu){
  const result=state(menu).plateResult;
  return '<div class="lesson-plate-finish" data-lesson-plate-finish><div><span class="eyebrow">마지막 단계 · 담음새</span><h4>어떤 그릇에 담아 낼까요?</h4><p class="lesson-small">완성한 '+esc(menu.name)+'에 맞는 그릇을 골라 보세요.</p></div><p class="lesson-plate-result" role="status">'+(result?esc('최근 결과: '+result.correct+' / '+result.total+' 정답 · '+result.answers[0].displayAnswer):'')+'</p><button type="button" class="primary" data-lesson-plate>마지막 그릇 퀴즈'+(result?' 다시 풀기':'')+' →</button></div>';
 }
 function openPlateQuiz(menu,root){
  window.CookingLab.finalQuiz('jp',[menu.id],result=>{
   state(menu).plateResult=result;
   if(root.isConnected){root.querySelector('[data-lesson-plate-finish]').outerHTML=plateSummary(menu);root.querySelector('[data-lesson-plate]').focus({preventScroll:true});}
  },{dimensions:0,completeLabel:'한 메뉴 공부로 돌아가기'});
 }
 function render(menu){const s=state(menu);return `<section class="lesson-study" data-lesson-menu="${menu.id}" aria-label="${esc(menu.name)} 한 메뉴 공부"><p class="lesson-intro">한 메뉴씩 읽고, 순서를 맞히거나 직접 써서 비교하세요. 핵심 카드게임으로 준비·타이밍·마무리도 확인할 수 있어요.</p><div class="lesson-mode-buttons" role="group" aria-label="한 메뉴 공부 방식">${[['read','레시피 읽기'],['summary','소스·치수 한눈에'],['order','순서 맞히기'],['write','직접 쓰고 비교'],['keywords','핵심 카드게임']].map(([key,label])=>`<button type="button" data-lesson-mode="${key}" aria-pressed="${s.mode===key}">${label}</button>`).join('')}</div><div class="lesson-panel" data-lesson-panel="read" ${s.mode==='read'?'':'hidden'}><p class="lesson-small">설명을 누르면 계량·cm·시간·불세기가 빈칸으로 나와요. 양념 이름도 함께 가릴 수 있어요.</p>${window.SummaryReference?.legend()||''}${window.RecipeMarks?.toolbar()||''}<ol class="lesson-sequence">${menu.steps.map((text,i)=>`<li>${window.RecipeMarks?window.RecipeMarks.wrap('menu',menu.id,i,trigger(text,menu.name+' · '+(i+1)+'번 설명',menu.id)):trigger(text,menu.name+' · '+(i+1)+'번 설명',menu.id)}</li>`).join('')}</ol></div><div class="lesson-panel" data-lesson-panel="summary" ${s.mode==='summary'?'':'hidden'}>${summary(menu,{interactive:true})}<a class="lesson-sheet-link" href="lesson-summary.html" target="_blank" rel="noopener">19개 메뉴 전체 정리본 · 인쇄 보기 ↗</a></div><div class="lesson-panel" data-lesson-panel="order" ${s.mode==='order'?'':'hidden'}>${orderContent(menu,s.order)}</div><div class="lesson-panel" data-lesson-panel="write" ${s.mode==='write'?'':'hidden'}>${window.MenuPractice?.renderWrite(menu)||''}</div><div class="lesson-panel" data-lesson-panel="keywords" ${s.mode==='keywords'?'':'hidden'}>${window.MenuPractice?.renderGame(menu)||''}</div>${plateSummary(menu)}</section>`;}
 let dialog,quiz,opener;
 const kindLabel=b=>window.SummaryQuiz?.kindLabel(b)||(b.kind==='measure'?'계량':base.kindLabel(b));
 function quizBody(){
  const engine=quiz.summary?window.SummaryQuiz:{parse,options};quiz.blanks=engine.parse(quiz.text,quiz.mode);let cursor=0;
  const masked=quiz.blanks.map((b,i)=>{const before=esc(quiz.text.slice(cursor,b.start));cursor=b.end;return before+`<span class="blank-slot"><span class="blank-number" aria-hidden="true">${i+1}</span><select aria-label="${i+1}번 ${kindLabel(b)} 빈칸"><option value="">___ ${kindLabel(b)} ___</option>${engine.options(b).map(choice=>`<option value="${esc(choice)}">${esc(choice)}</option>`).join('')}</select></span>`;}).join('')+esc(quiz.text.slice(cursor));
  dialog.innerHTML=`<div class="blank-heading"><div><span class="eyebrow">${quiz.summary?'묶음 정리':'수업 레시피'} / 빈칸 연습</span><h2 id="lesson-quiz-title">${esc(quiz.label)}</h2></div><button type="button" data-lesson-quiz-close aria-label="수업 빈칸 연습 닫기">닫기</button></div><p class="blank-guide">${quiz.summary?'표에서 본 용량·치수·비율·개수를 골라 보세요. T는 큰술, t는 작은술이에요.':'T는 큰술, t는 작은술이에요. 계량·치수, 초·분 단위의 조리 시간과 불세기를 골라 보세요.'}</p><label class="lesson-quiz-mode"><input type="checkbox" data-lesson-mask-names ${quiz.mode==='all'?'checked':''}> 양념 이름도 가리기</label><form class="lesson-quiz-form" novalidate><p class="blank-sentence">${masked}</p><div class="blank-result" role="status" aria-live="polite">${quiz.blanks.length?`총 ${quiz.blanks.length}개 빈칸 · 수업 레시피 기준`:'이 설명에는 계량·cm·시간·불세기 빈칸이 없어요. 양념 이름도 가리기를 켜 보세요.'}</div><div class="blank-actions"><button type="button" data-lesson-quiz-retry>다시 풀기</button><button type="submit" class="primary" ${quiz.blanks.length?'':'disabled'}>정답 확인</button></div></form>`;
 }
 function openQuiz(text,label,button){
  const summary=button.hasAttribute('data-lesson-summary'),engine=summary?window.SummaryQuiz:{parse};
  if(!dialog){dialog=document.createElement('dialog');dialog.className='recipe-blank-dialog lesson-quiz-dialog';dialog.setAttribute('aria-labelledby','lesson-quiz-title');document.body.append(dialog);dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});}
  opener=button;quiz={text,label,summary,mode:engine.parse(text).length?'measure':'all'};quizBody();dialog.showModal();
 }
 function refreshOrder(root,menu,focusSelector){root.querySelector('[data-lesson-panel="order"]').innerHTML=orderContent(menu,state(menu).order);if(focusSelector)root.querySelector(focusSelector)?.focus({preventScroll:true});}
 document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.hasAttribute('data-lesson-blank')){openQuiz(button.dataset.lessonBlank,button.dataset.lessonLabel,button);return;}
  if(button.hasAttribute('data-lesson-quiz-close')){dialog.close();return;}
  if(button.hasAttribute('data-lesson-quiz-retry')){quizBody();dialog.querySelector('select')?.focus();return;}
  const root=button.closest('[data-lesson-menu]');if(!root)return;
  const menu=menus.get(root.dataset.lessonMenu),s=state(menu),o=s.order;
  if(button.dataset.lessonMode){s.mode=button.dataset.lessonMode;root.querySelectorAll('[data-lesson-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lessonMode===s.mode)));root.querySelectorAll('[data-lesson-panel]').forEach(p=>p.hidden=p.dataset.lessonPanel!==s.mode);return;}
  if(button.hasAttribute('data-lesson-plate')){openPlateQuiz(menu,root);return;}
  let focus='[data-lesson-check]',changed=false;
  if(button.hasAttribute('data-lesson-add')){const id=Number(button.dataset.lessonAdd),i=o.pool.indexOf(id);if(i<0)return;o.pool.splice(i,1);o.picked.push(id);focus=o.pool.length?`[data-lesson-add="${o.pool[Math.min(i,o.pool.length-1)]}"]`:focus;changed=true;}
  if(button.hasAttribute('data-lesson-remove')){const i=Number(button.dataset.lessonRemove),id=o.picked.splice(i,1)[0];if(id===undefined)return;o.pool.push(id);focus=`[data-lesson-add="${id}"]`;changed=true;}
  if(button.hasAttribute('data-lesson-move')){const i=Number(button.dataset.lessonMove),to=i+Number(button.dataset.direction);if(to<0||to>=o.picked.length)return;[o.picked[i],o.picked[to]]=[o.picked[to],o.picked[i]];focus=`[data-lesson-remove="${to}"]`;changed=true;}
  if(button.hasAttribute('data-lesson-reset')){s.order=makeOrder(menu,o.range);refreshOrder(root,menu,'[data-lesson-reset]');return;}
  if(button.hasAttribute('data-lesson-next')){s.order=makeOrder(menu,String(Number(o.range)+5));refreshOrder(root,menu,'[data-lesson-range]');return;}
  if(button.hasAttribute('data-lesson-check')){const score=gradeOrder(o.expected,o.picked);o.checked=score.complete;o.message=score.complete?'':`아직 ${o.expected.length-o.picked.length}개 작업이 남아 있어요. 카드를 모두 놓아 주세요.`;refreshOrder(root,menu,focus);if(score.complete&&o.expected.at(-1)===menu.steps.length-1)openPlateQuiz(menu,root);return;}
  if(changed){o.checked=false;o.message='';refreshOrder(root,menu,focus);}
 });
 document.addEventListener('change',event=>{
  if(event.target.matches('[data-lesson-mask-names]')){quiz.mode=event.target.checked?'all':'measure';quizBody();dialog.querySelector('[data-lesson-mask-names]').focus();return;}
  if(event.target.matches('[data-lesson-range]')){const root=event.target.closest('[data-lesson-menu]'),menu=menus.get(root.dataset.lessonMenu);state(menu).order=makeOrder(menu,event.target.value);refreshOrder(root,menu,'[data-lesson-range]');return;}
  if(event.target.closest('.lesson-quiz-form')){dialog.querySelectorAll('select').forEach(s=>{s.classList.remove('answer-correct','answer-wrong');s.removeAttribute('aria-invalid');});dialog.querySelector('.blank-result').textContent='선택한 답을 정답 확인으로 비교해 보세요.';}
 });
 document.addEventListener('submit',event=>{
  if(!event.target.matches('.lesson-quiz-form'))return;event.preventDefault();
  const fields=[...event.target.querySelectorAll('select')],score=base.grade(quiz.blanks,fields.map(f=>f.value));
  if(score.answered!==score.total){dialog.querySelector('.blank-result').textContent='모든 빈칸의 답을 먼저 골라 주세요.';fields.find(f=>!f.value)?.focus();return;}
  fields.forEach((f,i)=>{f.classList.toggle('answer-correct',score.results[i]);f.classList.toggle('answer-wrong',!score.results[i]);f.setAttribute('aria-invalid',String(!score.results[i]));});
  dialog.querySelector('.blank-result').innerHTML=`<strong>${score.correct} / ${score.total} 정답</strong>${score.correct===score.total?'<p>빈칸을 모두 맞혔어요.</p>':`<ul>${quiz.blanks.map((b,i)=>score.results[i]?'':`<li>${i+1}번 ${kindLabel(b)} 정답: <b>${esc(b.answer)}</b></li>`).join('')}</ul>`}`;
 });
 return {parse,options,trigger,render,summary,makeOrder,gradeOrder};
})();
