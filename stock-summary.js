'use strict';
// User-provided classroom recipes: starting water and the amount used are distinct.
window.StockSummary = (() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups={plain:'다시마물만 사용',katsu:'가쓰오부시까지 우려 사용',together:'주재료와 함께 끓이기'};
  const records=[
    {id:'jp-05',kind:'plain',water:'물 1½컵 · 약불',remove:'물이 끓으면 건져 국물을 따로 받기',use:'도미 조림장에 다시물 1T. 조리는 중 국물이 적으면 보충.',steps:[2,4,11,17]},
    {id:'jp-12',kind:'plain',water:'물 1½컵 · 약불',remove:'물이 끓으면 건져 국물을 따로 받기',use:'양념간장(다래)에 다시물 4T.',steps:[1,3,4]},
    {id:'jp-11',kind:'plain',water:'물 1컵 · 약불',remove:'작은 기포가 생기면 건져 국물을 따로 받기',use:'우엉 조림장에 다시마다시 8T(반 컵). 해삼초회와 함께 만들 때는 가쓰오부시를 넣기 전에 우엉용을 따로 남기기.',steps:[1,4,9]},
    {id:'jp-15',kind:'plain',water:'물 1컵 · 약불',remove:'물이 끓으면 건져 국물을 따로 받기',use:'폰즈에 다시물 1T, 술찜 양념에 다시물 2T.',steps:[1,3,13,22]},
    {id:'jp-04',kind:'katsu',water:'물 3컵 · 약불',remove:'물이 끓으면 다시마를 건지고 가쓰오부시에 국물 붓기',use:'우린 국물을 거른 뒤 2컵을 된장국에 사용.',steps:[1,5,10,11]},
    {id:'jp-06',kind:'katsu',water:'물 1컵 · 약불',remove:'작은 기포가 생기면 다시마를 건지고 가쓰오부시에 국물 붓기',use:'5분 이상 우린 국물을 걸러 도사스에 가쓰오다시 3T.',steps:[1,5,12,13]},
    {id:'jp-07',kind:'katsu',water:'물 1컵 · 약불',remove:'작은 기포가 생기면 다시마를 건지고 가쓰오부시에 국물 붓기',use:'우린 국물을 걸러 폰즈에 가쓰오다시 1T. 삼치소금구이와 함께 만들 때는 우엉용 다시마물을 먼저 분리.',steps:[1,4,12]},
    {id:'jp-08',kind:'katsu',water:'물 2컵 · 약불',remove:'작은 기포가 올라오면 다시마를 건지고 가쓰오부시에 국물 붓기',use:'우린 국물을 걸러 돈부리다시에 가쓰오다시 5T.',steps:[3,5,9,12]},
    {id:'jp-10',kind:'katsu',water:'물 2컵 · 약불',remove:'작은 기포가 올라오면 다시마를 건지고 가쓰오부시에 국물 붓기',use:'우린 국물을 걸러 소바다시에 가쓰오다시 1컵. 양념을 넣고 끓인 소바다시는 차게 식히기.',steps:[2,5,11,14,17]},
    {id:'jp-14',kind:'katsu',water:'물 1컵 · 약불',remove:'작은 기포가 생기면 다시마를 건지고 가쓰오부시에 국물 붓기',use:'5분 이상 우린 국물을 걸러 식히기. 달걀물에 식힌 가쓰오다시 3T.',steps:[1,3,6,8]},
    {id:'jp-16',kind:'katsu',water:'물 1컵 · 약불',remove:'작은 기포가 생기면 다시마를 건지고 불을 끄기 → 볼로 옮긴 국물에 가쓰오부시 넣기',use:'우려 식힌 국물을 면보에 거르기. 달걀물에 식힌 가다랑어국물 5T.',steps:[1,4,13,14]},
    {id:'jp-02',kind:'together',water:'새 물 3컵 · 중불',remove:'데쳐 씻은 도미 머리 + 다시마 + 청주 1T를 함께 넣기 → 물이 끓으면 다시마 건지기',use:'도미 머리를 끓인 국물을 걸러 맑은국으로 사용.',steps:[9,10,11,12]},
    {id:'jp-03',kind:'together',water:'물 2컵 · 센불',remove:'해감해 씻은 백합조개 + 다시마 + 청주 1T를 함께 넣기 → 끓기 시작하면 다시마 건지기',use:'중약불로 줄여 거품을 걷고, 조개가 입을 벌리면 건지기. 조개 국물을 맑은국으로 사용.',steps:[2,5,6,7,9]}
  ];
  const menu=id=>window.MENUS.find(m=>m.id===id);
  const link=id=>`<button type="button" class="text-button stock-menu-link" data-action="detail" data-id="${id}" aria-label="${esc(menu(id).name)} 다시마 사용 수업 레시피 보기">${esc(menu(id).name)} <span aria-hidden="true">↗</span></button>`;
  const links=kind=>records.filter(r=>r.kind===kind).map(r=>link(r.id)).join('');
  function render(){
    return `<section class="stock-overview" aria-labelledby="stock-overview-title"><div class="stock-title"><h3 id="stock-overview-title">다시마, 따로 우릴까? 같이 끓일까?</h3><span>수업 레시피 기준 · 13품목</span></div><div class="stock-cards"><article class="stock-card"><div class="stock-card-heading"><h4>다시물을 먼저 만들어 두기</h4><span>11품목</span></div><p class="stock-flow">물 + 다시마 → 다시마 건지기 → 국물 따로 받기 → 필요한 양 계량</p><div class="stock-subgroup"><strong>다시마물만 사용 · 4품목</strong><div class="stock-menu-links">${links('plain')}</div></div><div class="stock-subgroup"><strong>가쓰오부시까지 우려 사용 · 7품목</strong><p>다시마를 건진 국물로 가쓰오부시를 우린 뒤 걸러요.</p><div class="stock-menu-links">${links('katsu')}</div></div></article><article class="stock-card stock-together"><div class="stock-card-heading"><h4>주재료와 함께 끓이기</h4><span>2품목</span></div><p class="stock-flow">물 + 주재료 + 다시마 + 청주 → 끓으면 다시마 건지기</p><div class="stock-subgroup">${link('jp-02')}<p>데쳐 씻은 도미 머리 · 새 물 <b>3컵</b> · 청주 <b>1T</b> · <b>중불</b></p></div><div class="stock-subgroup">${link('jp-03')}<p>해감해 씻은 백합조개 · 물 <b>2컵</b> · 청주 <b>1T</b> · <b>센불</b></p></div><p class="stock-tip">이 두 국은 주재료와 함께 끓인 물이 국물이 돼요. 가쓰오부시는 넣지 않아요.</p></article></div><div class="stock-comparisons"><p><b>도미술찜 + 도미머리맑은국</b> · 술찜은 다시물을 먼저 따로 받고, 맑은국은 새 물에 머리와 다시마를 함께 넣어요.</p><p><b>삼치소금구이 + 해삼초회</b> · 삼치 우엉용 다시마물을 먼저 남기고, 해삼 폰즈용 국물만 가쓰오부시에 부어요.</p></div><details class="stock-detail"><summary>품목별 물의 양 · 다시마 건지는 시점 · 사용처 펼쳐보기</summary><p class="stock-caption">물의 양은 수업에서 다시를 내기 시작한 양이에요. 두 메뉴를 함께 만들 때 같은 다시를 나누어 쓴 기록이 포함돼요. 실제 사용하는 양은 마지막 열에서 확인하세요.</p><div class="stock-table-scroll" role="region" aria-label="다시마 품목별 상세 표" tabindex="0"><table><caption class="screen-reader">다시마를 쓰는 13품목의 준비 방법과 국물 사용처</caption><colgroup><col style="width:18%"><col style="width:15%"><col style="width:31%"><col style="width:36%"></colgroup><thead><tr><th scope="col">품목 · 다시 종류</th><th scope="col">시작 물 · 불세기</th><th scope="col">넣고 건지는 순서</th><th scope="col">국물 사용처 · 계량</th></tr></thead><tbody>${records.map(r=>`<tr data-stock-menu="${r.id}"><th scope="row">${link(r.id)}<small>${groups[r.kind]}</small></th><td>${esc(r.water)}</td><td>${esc(r.remove)}</td><td>${esc(r.use)}<small>수업 ${r.steps.join(' · ')}단계</small></td></tr>`).join('')}</tbody></table></div></details></section>`;
  }
  return {render,records};
})();
