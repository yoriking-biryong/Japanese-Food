'use strict';
window.SummaryReference = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Reviewed against each menu's own requirement item (zero-based). Never match by number alone.
  const official = {
    'jp-01:sizes:0':{item:2,spans:['5cm','0.3cm']},
    'jp-02:sizes:1':{item:0,spans:['50~60g']},
    'jp-04:sizes:0':{item:1,spans:['1 × 1 × 1cm']},
    'jp-05:sizes:0':{item:0,spans:['5~6cm']},
    'jp-06:sizes:0':{item:2,spans:['4~5cm']},
    'jp-06:sizes:1':{item:1,spans:['4~5cm']},
    'jp-06:sizes:2':{item:3,spans:['0.1~0.2cm']},
    'jp-07:sizes:0':{item:0,spans:['0.1~0.2cm']},
    'jp-07:sizes:2':{item:1,spans:['4~5cm']},
    'jp-09:sizes:0':{item:1,spans:['1cm','4cm']},
    'jp-09:sizes:1':{item:2,spans:['4cm']},
    'jp-09:sizes:2':{item:2,spans:['4cm']},
    'jp-11:sizes:1':{item:3,spans:['10cm','2조각']},
    'jp-12:sizes:0':{item:1,spans:['1.5cm']},
    'jp-12:sizes:1':{item:1,spans:['3cm']},
    'jp-14:sizes:0':{item:2,spans:['8cm','2.5cm','1cm','8개']},
    'jp-15:sizes:0':{item:1,spans:['5~6cm']},
    'jp-16:sizes:0':{item:1,spans:['1cm']},
    'jp-16:sizes:1':{item:1,spans:['1cm']},
    'jp-17:sizes:2':{item:4,spans:['6종류','8개']},
    'jp-18:sizes:0':[{item:0,spans:['반장']},{item:2,spans:['2줄','12개']}],
    'jp-19:sizes:2':{item:2,spans:['8등분']}
  };
  const legend = () => '<p class="reference-legend"><span class="requirement-value">주황색 밑줄</span> = 시험 요구사항에 명시된 수치 <span class="reference-classroom">기본색 = 수업 메모의 수치</span></p>';
  function renderRanges(text, ranges, title) {
    let cursor=0, html='';
    for(const range of ranges.sort((a,b)=>a.start-b.start||b.end-a.end)) {
      if(range.start<cursor)continue;
      html+=esc(text.slice(cursor,range.start))+`<span class="requirement-value" title="${esc(range.title||title)}">${esc(text.slice(range.start,range.end))}</span>`;
      cursor=range.end;
    }
    return html+esc(text.slice(cursor));
  }
  function format(id, kind, index, text) {
    const spec=official[`${id}:${kind}:${index}`];
    if(!spec)return esc(text);
    const ranges=[];
    for(const source of (Array.isArray(spec)?spec:[spec])){
      const item=window.OfficialRequirements?.get(id)?.items[source.item];
      const title='시험 요구사항 명시'+(item?' · '+item.text:'');
      for(const value of source.spans){let start=text.indexOf(value);while(start!==-1){ranges.push({start,end:start+value.length,title});start=text.indexOf(value,start+value.length);}}
    }
    return renderRanges(text,ranges,'시험 요구사항 명시');
  }
  function requirement(text) {
    const ranges=(window.RecipeBlanks?.parse(text)||[]).filter(b=>b.kind==='size'||b.kind==='time');
    const regex=/\d+(?:\.\d+)?(?:\s*[~～–-]\s*\d+(?:\.\d+)?)?\s*(?:종류|등분|조각|mL|ml|[Tt]|g|컵|개|줄)|반장/g;
    for(const match of text.matchAll(regex))ranges.push({start:match.index,end:match.index+match[0].length});
    return renderRanges(text,ranges,'시험 요구사항에 명시된 수치');
  }
  // Complete geometries and ranges remain distinct; comparison notes for other dishes are excluded.
  const sizeKeys={
    'jp-01':[['0.3cm','5cm']], 'jp-02':[['4~5cm'],['50~60g'],['레몬 모양']], 'jp-03':[['레몬 모양']],
    'jp-04':[['1 × 1 × 1cm'],['1 × 1cm']], 'jp-05':[['5cm','5~6cm'],['5cm']],
    'jp-06':[['4~5cm'],['4~5cm'],['0.1~0.2cm'],['한입 크기 · 상대 크기'],['레몬 모양']], 'jp-07':[['0.1~0.2cm'],['2~3cm'],['4cm','4~5cm'],['한입 크기 · 상대 크기'],['레몬 모양']],
    'jp-08':[['4cm'],['2cm'],['4cm']], 'jp-09':[['1cm','4cm'],['1cm','4cm'],['0.2~0.3cm','1cm','4cm']],
    'jp-10':[['2~3cm']], 'jp-11':[['5cm'],['10cm','제출 2개'],['0.5cm','3cm'],['2~3cm','레몬 모양']],
    'jp-12':[['1.5cm'],['1.5cm','3cm']], 'jp-13':[['한입 크기 · 상대 크기'],['한입 크기 · 상대 크기']],
    'jp-14':[['1cm','2.5cm','8cm','제출 8개']],
    'jp-15':[['5~6cm','6cm'],['0.5cm','1cm'],['0.35cm','레몬 모양'],['1.5cm'],['4~5cm'],['4cm']],
    'jp-16':[['1cm'],['1cm'],['레몬 모양']], 'jp-17':[['3cm','7cm'],['7cm'],['밥 20g','생선 6종류','제출 8개']],
    'jp-18':[['김 2줄','제출 12개']], 'jp-19':[['1cm'],['1.5cm'],['제출 8개']]
  };
  const families=[
    ['배합초 · 초대리 만들기','생선초밥·참치김초밥·김초밥: 식초 3T + 설탕 2T + 소금 1t.'],
    ['밥에 섞는 초','세 메뉴 모두 만든 배합초 중 2T를 밥에 섞어요.'],
    ['초간장 · 폰즈 · 도사스','폰즈는 다시·간장·식초 각 1T. 도사스는 가쓰오다시 3T에 설탕 1t가 더해져요.'],
    ['간장 조림장 · 다래','간장·설탕·맛술은 우엉·박고지 각 1T, 다래 각 2T, 도미 각 3T. 우엉용 다시·박고지용 물은 각각 8T(반 컵)입니다. 육수와 청주 양은 각각 확인하세요.'],
    ['돈부리다시 · 소바다시 · 볶음 양념','간장 베이스여도 육수·간장·설탕·술의 양은 달라요.'],
    ['달걀물 · 술찜 양념','달걀찜은 맛술·청주 각 1t, 달걀말이는 설탕·맛술 각 1T. T와 t를 구분하세요.'],
    ['절임물 · 데치는 물','오이 절임·꽃무 절임·문어 데치는 물을 비교해요.'],
    ['다시 · 국물 · 찜용 물','같은 컵 수라도 쓰임과 함께 넣는 재료를 구분해요.'],
    ['식용유 · 참기름','팬 코팅용 준비량과 실제 넣는 양을 구분해요.'],
    ['밑간 · 조리 중 간','재료별 간과 마무리 양념을 비교해요.'],
    ['고추냉이','비율 또는 물을 조금씩 넣는 방식으로 농도를 맞춰요.'],
    ['곁들이기 · 고명','도미술찜 폰즈·메밀국수 소바다시·초밥 간장은 별도 그릇에 내요. 소바다시는 차게 식혀요. 수치가 없는 곁들임은 임의의 용량을 붙이지 않아요.'],
    ['명란 풀기 · 무침 비율','명란을 푸는 물 1t와 갑오징어:명란 2:1을 따로 기억해요.']
  ];
  function sauceFamily(entry) {
    const l=entry.label;
    if(/(?:배합초|초대리) 만들기/.test(l))return families[0][0];
    if(/밥에 섞는/.test(l))return families[1][0];
    if(/폰즈|도사스/.test(l))return families[2][0];
    if(/조림장|다래/.test(l))return families[3][0];
    if(/돈부리다시|소바다시|우동볶음 양념/.test(l))return families[4][0];
    if(/달걀물|술찜 양념/.test(l))return families[5][0];
    if(/절임|문어 (?:삶는|데치는) 물/.test(l))return families[6][0];
    if(/다시 만들기|국물|된장국|찜용 물/.test(l))return families[7][0];
    if(/볶기 시작|양파 볶기|팬에 굽기|팬 코팅용|불 끈 뒤 마무리/.test(l))return families[8][0];
    if(/밑간|마지막 간|전복 볶기/.test(l))return families[9][0];
    if(/고추냉이/.test(l))return families[10][0];
    if(/곁들이기|고명|^마무리$/.test(l))return families[11][0];
    return families[12][0];
  }
  function amountKeys(text) {
    const keys=(window.LessonStudy?.parse(text.replace(/\([^)]*\)/g,''))||[]).filter(b=>b.kind==='measure').map(b=>b.answer.replace(/\s/g,'').replace(/한컵/g,'1컵').replace(/두컵/g,'2컵').replace(/세컵/g,'3컵').replace(/반컵/g,'0.5컵').replace(/컵반/g,'½컵').replace(/½/g,'.5'));
    return [...new Set(keys.length?keys:[text.includes(':')?'비율로 기억':'수치 미지정'])];
  }
  function entries(mode) {
    return window.MENUS.flatMap(menu=>(window.LESSON_STUDY_NOTES[menu.id]?.[mode]||[]).map(([label,text,steps],index)=>({key:`${menu.id}:${mode}:${index}`,menu,mode,index,label,text,steps})));
  }
  // One source row can be reviewed by both recipe family and serving purpose.
  const separateSauces=new Set(['jp-15:sauces:1','jp-10:sauces:1']);
  function group(entries, by) {
    const result=new Map();
    for(const e of entries){
      const keys=by==='menu'?[e.menu.name]:e.mode==='sizes'?sizeKeys[e.menu.id][e.index]:by==='amount'?amountKeys(e.text):[sauceFamily(e),...(separateSauces.has(e.key)?[families[11][0]]:[])];
      for(const key of keys){if(!result.has(key))result.set(key,[]);result.get(key).push(e);}
    }
    const grouped=[...result].map(([name,rows])=>({name,rows,description:by==='kind'&&entries[0]?.mode==='sauces'?(families.find(f=>f[0]===name)?.[1]||''):''}));
    if(by==='kind'&&entries[0]?.mode==='sauces')grouped.sort((a,b)=>families.findIndex(f=>f[0]===a.name)-families.findIndex(f=>f[0]===b.name));
    else if(by!=='menu')grouped.sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}));
    return grouped;
  }
  const emphasizedGroups=new Set(['초간장 · 폰즈 · 도사스','간장 조림장 · 다래','돈부리다시 · 소바다시 · 볶음 양념','달걀물 · 술찜 양념']);
  const isEmphasizedGroup=name=>emphasizedGroups.has(name);
  const groupTitle=name=>isEmphasizedGroup(name)?`<mark class="summary-group-highlight">${esc(name)}</mark>`:esc(name);
  return {format,requirement,legend,entries,group,amountKeys,isEmphasizedGroup,groupTitle};
})();
