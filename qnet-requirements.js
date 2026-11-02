'use strict';
// Learning summaries of section 1 in the 2026 Q-net public tasks. Classroom data stays separate.
window.OfficialRequirements=(()=>{
  const source={year:2026,published:'2025-12-24',checked:'2026-10-28',url:'https://www.q-net.or.kr/cst006.do?artlSeq=5250948&brdId=Q006&code=1204&id=cst00602',attachment:'4.일식조리기능사 공개과제(2026년).zip'};
  const tasks=[
    {number:1,name:'갑오징어명란무침',minutes:20,items:[
      {text:'껍질을 벗긴 명란젓은 알만 사용합니다.'},
      {text:'갑오징어의 속껍질을 제거합니다.'},
      {text:'소금물에 데친 갑오징어를 0.3 × 0.3 × 5cm로 썹니다.'}
    ]},
    {number:2,name:'도미머리맑은국',minutes:30,items:[
      {text:'반으로 가른 도미머리를 50~60g 크기로 준비합니다.',caution:'실격 조건: 도미 몸통이나 살을 쓰면 실격입니다. 머리만 사용합니다.'},
      {text:'소금을 뿌려 둔 도미머리를 끓는 물에 데쳐 손질합니다.'},
      {text:'다시마와 도미머리를 은근하게 끓입니다. 우러난 국물에 간을 맞춥니다.'},
      {text:'대파의 흰 부분을 가늘게 채 썰어 시라가네기를 만듭니다.'},
      {text:'곁들임 재료를 그릇에 담고, 간을 맞춘 국물을 부어 마무리합니다.'}
    ]},
    {number:3,name:'대합맑은국',minutes:20,items:[
      {text:'상태를 확인한 백합조개를 해감합니다.'},
      {text:'백합조개와 다시마를 함께 끓입니다. 국물이 끓기 시작하면 다시마를 건집니다.'}
    ]},
    {number:4,name:'된장국',minutes:20,items:[
      {text:'다시마와 가다랑어포를 우려 가쓰오다시를 만듭니다.'},
      {text:'1 × 1 × 1cm로 썬 두부와 미역을 데쳐 준비합니다.'},
      {text:'된장을 푼 국물을 한소끔 끓입니다.'}
    ]},
    {number:5,name:'도미조림',minutes:30,items:[
      {text:'손질한 도미를 5~6cm로 토막 냅니다. 반으로 가른 머리에는 소금을 뿌립니다.'},
      {text:'데친 도미머리와 꼬리의 불순물을 씻어냅니다.'},
      {text:'냄비에 담아 양념한 도미 위에 오토시부타를 덮고 조립니다. 오토시부타는 냄비 안쪽에 들어가는 뚜껑 또는 호일입니다.'},
      {text:'접시에 담은 도미조림 앞쪽에 생강채(하리쇼가)와 채소를 놓습니다.'}
    ]},
    {number:6,name:'문어초회',minutes:20,items:[
      {text:'우려낸 가쓰오다시로 양념초간장인 도사스를 만듭니다.'},
      {text:'삶은 문어를 길이 4~5cm로 물결모양(하조기리)으로 썹니다.'},
      {text:'손질한 미역을 4~5cm로 썹니다.'},
      {text:'오이를 두께 0.1~0.2cm의 원형(와기리) 또는 줄무늬(자바라)로 썹니다.'},
      {text:'초회 접시에 담은 문어와 오이에 도사스를 끼얹고, 레몬으로 장식합니다.'}
    ]},
    {number:7,name:'해삼초회',minutes:20,items:[
      {text:'오이를 두께 0.1~0.2cm의 원형(와기리) 또는 줄무늬(자바라)로 썹니다.'},
      {text:'손질한 미역을 길이 4~5cm로 썹니다.'},
      {text:'해삼의 내장과 모래를 제거하고, 안쪽 힘줄(스지)도 떼어냅니다.'},
      {text:'곁들일 빨간 무즙(아까오로시)과 실파를 준비합니다.'},
      {text:'그릇에 담은 해삼초회에 폰즈(초간장)를 끼얹습니다.'}
    ]},
    {number:8,name:'소고기덮밥',minutes:30,items:[
      {text:'덮밥에 사용할 양념간장인 돈부리 다시를 만듭니다.'},
      {text:'재료 특성에 맞게 조리한 고기·채소·달걀을 준비한 밥 위에 올립니다.'},
      {text:'구운 김을 칼로 가늘게 채(하리노리) 썹니다.'}
    ]},
    {number:9,name:'우동볶음(야키우동)',minutes:30,items:[
      {text:'새우의 껍질과 내장을 제거합니다.'},
      {text:'솔방울 모양으로 칼집을 낸 오징어를 1 × 4cm로 썹니다. 썬 오징어를 데칩니다.'},
      {text:'우동을 데쳐 준비합니다. 숙주를 제외한 채소는 길이 4cm로 썹니다.'},
      {text:'볶아 완성한 우동 위에 가다랑어포(하나가쓰오)를 고명으로 올립니다.'}
    ]},
    {number:10,name:'메밀국수(자루소바)',minutes:30,items:[
      {text:'만들어 둔 소바다시를 얼음으로 차게 식힙니다.'},
      {text:'삶은 메밀국수를 얼음으로 차게 식힙니다.'},
      {text:'김발을 깐 접시 위에 차게 식힌 메밀국수를 올립니다.'},
      {text:'접시에 담은 메밀국수 위에 가늘게 채 썬 김(하리노리)을 올립니다.'},
      {text:'준비한 국수·양념(야꾸미)·소바다시를 각각 다른 그릇에 담아 냅니다.'}
    ]},
    {number:11,name:'삼치소금구이',minutes:30,items:[
      {text:'세장뜨기한 삼치에 소금을 뿌려 10~20분 절입니다. 절인 삼치를 씻어 쇠꼬챙이에 끼우고 굽습니다.'},
      {text:'곁들일 채소를 각각 초담금 및 조림으로 준비합니다.'},
      {text:'구운 삼치를 구이용 그릇에 담고, 준비한 채소를 곁들입니다.'},
      {text:'완성한 삼치소금구이를 길이 10cm인 조각 2개로 제출합니다.'}
    ]},
    {number:12,name:'소고기간장구이',minutes:20,items:[
      {text:'양념간장인 다래를 만들고, 생강은 가늘게 채 썰어 하리쇼가를 준비합니다.'},
      {text:'소고기를 두께 1.5cm, 길이 3cm로 썹니다.'},
      {text:'프라이팬에 구운 소고기에 다래를 발라 완성합니다.'}
    ]},
    {number:13,name:'전복버터구이',minutes:25,items:[
      {text:'껍질·내장과 분리한 전복살에 칼집을 냅니다. 칼집을 낸 전복살을 한입 크기로 어슷 썹니다.'},
      {text:'모래주머니를 제거한 전복 내장을 데칩니다.'},
      {text:'채소를 썰어 둔 전복살과 비슷한 크기로 썹니다.'},
      {text:'은행의 속껍질을 벗깁니다.'}
    ]},
    {number:14,name:'달걀말이',minutes:25,items:[
      {text:'가쓰오다시·소금·설탕·맛술을 섞은 달걀물을 체에 거릅니다.'},
      {text:'젓가락으로 말아 익힌 달걀말이를 김발로 감싸 사각형 모양을 잡습니다.',caution:'감점 조건: 달걀을 말 때 주걱이나 손을 사용하면 감점됩니다.'},
      {text:'사각형으로 모양을 잡은 달걀말이를 길이 8cm, 높이 2.5cm, 두께 1cm로 썰어 8개 만듭니다. 완성된 단면에 틈이 없도록 합니다.'},
      {text:'썬 달걀말이(다시마키)를 접시에 담고 간장무즙을 곁들입니다.'}
    ]},
    {number:15,name:'도미술찜',minutes:30,items:[
      {text:'도미머리를 반으로 가르고, 몸통은 세장뜨기 합니다.'},
      {text:'손질한 도미살을 5~6cm로 썰어 소금을 뿌립니다. 데친 머리·꼬리는 불순물을 씻어냅니다.'},
      {text:'청주를 섞은 다시 국물에 손질한 도미를 찝니다.'},
      {text:'매화꽃 모양으로 깎은 당근과 은행잎 모양으로 깎은 무를 익힙니다.'},
      {text:'만들어 둔 폰즈(초간장)와 야꾸미(양념)를 술찜에 곁들입니다.'}
    ]},
    {number:16,name:'달걀찜',minutes:30,items:[
      {text:'은행을 삶고, 밤은 구워 준비합니다.'},
      {text:'간장으로 밑간한 닭고기와 나머지 재료를 1cm로 썹니다. 썬 재료를 데쳐 준비합니다.'},
      {text:'가다랑어포를 우린 다시 국물을 식힙니다. 식힌 국물을 달걀과 섞습니다.'},
      {text:'완성한 달걀찜 위에 레몬껍질과 쑥갓을 올립니다.'}
    ]},
    {number:17,name:'생선초밥',minutes:40,items:[
      {text:'초밥에 사용할 생선과 채소를 손질합니다.'},
      {text:'만들어 둔 초밥초(스시스)를 밥에 섞어 간합니다. 간한 밥을 식힙니다.'},
      {text:'초밥에 곁들일 초생강을 만듭니다.'},
      {text:'손질한 생선과 식힌 초밥용 밥으로 쥔초밥(니기리스시)을 만듭니다.'},
      {text:'생선초밥을 6종류로 구성해 총 8개 제출합니다.'},
      {text:'완성한 생선초밥에 별도 그릇의 간장을 곁들입니다.'}
    ]},
    {number:18,name:'참치김초밥',minutes:20,items:[
      {text:'김을 반장으로 자릅니다. 반장으로 자른 김이 눅눅하거나 굽지 않은 상태라면 구워 사용합니다.'},
      {text:'초밥에 사용할 고추냉이와 곁들일 초생강을 준비합니다.'},
      {text:'말아 둔 김초밥 2줄을 크기가 고르게 총 12개로 자릅니다.'},
      {text:'잘라 담은 참치김초밥에 간장을 곁들입니다.'}
    ]},
    {number:19,name:'김초밥',minutes:25,items:[
      {text:'김초밥에 넣을 박고지·달걀말이·오이 등의 속재료를 조리합니다.'},
      {text:'만들어 둔 초밥초를 밥에 섞어 간합니다. 간한 밥을 식힙니다.'},
      {text:'말아 둔 김초밥을 두께와 크기가 일정하도록 8등분합니다.'},
      {text:'잘라 담은 김초밥에 간장을 곁들여 제출합니다.'}
    ]}
  ];
  const byId=new Map(tasks.map(task=>['jp-'+String(task.number).padStart(2,'0'),task]));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function get(id){return byId.get(id);}
  function render(menu,{quiz=false}={}){
    const task=get(menu.id);if(!task)return '';
    const labels=['가','나','다','라','마','바'];
    const items=task.items.map((item,index)=>`<li><span class="qnet-requirement-letter">${labels[index]}.</span><div>${quiz&&window.RecipeBlanks?window.RecipeBlanks.trigger(item.text,menu.name+' · 큐넷 요구사항 '+labels[index]).replace('<span>'+esc(item.text)+'</span>','<span>'+(window.SummaryReference?.requirement(item.text)||esc(item.text))+'</span>'):`<p>${window.SummaryReference?.requirement(item.text)||esc(item.text)}</p>`}${item.caution?`<p class="qnet-requirement-caution"><strong>${esc(item.caution)}</strong></p>`:''}</div></li>`).join('');
    const timeNote=task.minutes!==menu.minutes?`<p class="qnet-requirement-time">큐넷 시험시간은 <strong>${task.minutes}분</strong>입니다. 현재 수업 연습시간 ${esc(menu.minutes)}분과 구분해 기억하세요.</p>`:'';
    return `<section class="qnet-requirements" data-qnet-menu="${esc(menu.id)}" aria-label="${esc(menu.name)} 큐넷 공식 요구사항"><div class="qnet-requirements-head"><h4>큐넷 공식 요구사항</h4><span>2026 · 시험 ${task.minutes}분</span></div><p class="qnet-requirements-caption">공개과제의 ‘1. 요구사항’ ${task.items.length}항목을 학습용으로 요약했어요.</p>${timeNote}<ol class="qnet-requirements-list">${items}</ol><p class="qnet-requirements-source"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">큐넷 공개과제 원문 보기 ↗</a><span>첨부 4 · ${task.number}번 ${esc(task.name)} · 1쪽</span><span>${source.year}년 적용 · 확인 ${source.checked}</span></p></section>`;
  }
  return {source,get,render};
})();
