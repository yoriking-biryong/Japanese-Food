(() => {
 'use strict';
 const recipes=window.CLASSROOM_PAIR_RECIPES||[];
 const byId=new Map(window.MENUS.map(m=>[m.id,m]));
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function notes(menu){
  if(!menu.classroomNotes?.length)return '';
  return `<aside class="classroom-notes"><h4>수업 메모</h4><ul>${menu.classroomNotes.map(text=>`<li>${escape(text)}</li>`).join('')}</ul><p>보내주신 수업 기준 · 지급량과 실제 배합량은 구분해 주세요.</p></aside>`;
 }
 function render(recipe){
  return `<details class="classroom-pair"><summary><span>함께 만드는 순서 · ${escape(recipe.title)}</span><small>${recipe.steps.length}단계 펼쳐보기</small></summary><div class="classroom-pair-content"><p class="classroom-pair-source">${escape(recipe.source)}</p><ul class="classroom-pair-highlights">${recipe.highlights.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>${window.RecipeMarks?.toolbar()||''}<ol class="classroom-pair-steps">${recipe.steps.map((step,i)=>`<li><span class="classroom-step-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><div class="classroom-step-menus">${step.menus.map(id=>`<span class="${id===recipe.pair[0]?'egg':'abalone'}">${escape(byId.get(id).name)}</span>`).join('')}</div>${window.RecipeMarks?window.RecipeMarks.wrap('pair',recipe.id,i,(window.LessonStudy||window.RecipeBlanks).trigger(step.text,recipe.title+' · '+(i+1)+'번 설명',step.menus)):(window.LessonStudy||window.RecipeBlanks).trigger(step.text,recipe.title+' · '+(i+1)+'번 설명',step.menus)}</div></li>`).join('')}</ol></div></details>`;
 }
 function forPair(ids){const recipe=recipes.find(r=>r.pair.length===ids.length&&r.pair.every(id=>ids.includes(id)));return recipe?render(recipe):'';}
 function forMenu(id){return recipes.filter(r=>r.pair.includes(id)).map(render).join('');}
 window.ClassroomRecipes={notes,forPair,forMenu};
})();
