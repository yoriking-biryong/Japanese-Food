'use strict';
// Summary-only blanks extend the existing recipe quiz without changing recipe parsing.
window.SummaryQuiz = (() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle=values=>{const a=[...new Set(values)];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const countRE=/(?<![\d.가-힣])(?:\d+(?:\.\d+)?\s*(?:종류|등분|조각|덩이|쪽|개|줄|장)|(?:한|두|세|네|반)\s*(?:덩이|쪽|개|줄|장))/g;
  const stockRE=/(?<![가-힣])(?:가쓰오\s*다시|가다랑어\s*국물|다시마\s*다시|다시마물|다시물)/g;
  const stockNames=new Set(['가쓰오다시','가다랑어국물','다시마다시','다시마물','다시물']);
  function parse(text,mode='measure') {
    const blanks=window.LessonStudy.parse(text,mode);
    const add=(regex,kind)=>{for(const m of text.matchAll(regex))blanks.push({start:m.index,end:m.index+m[0].length,answer:m[0],kind});};
    if(mode==='all')add(stockRE,'seasoning');
    add(/\d+(?:\.\d+)?\s*:\s*\d+(?:\.\d+)?/g,'ratio');
    add(/(?<![\d.])\d+(?:\.\d+)?(?:\s*[~～–-]\s*\d+(?:\.\d+)?)?\s*g\b/g,'weight');
    add(countRE,'count');
    add(/오리발 모양|반달 모양|웨지 모양/g,'lemon-shape');
    // The abalone reference intentionally specifies a shape instead of inventing cm.
    if(!blanks.length)add(/전복과 비슷한 크기|한입 크기|정사각형/g,'shape');
    return blanks.sort((a,b)=>a.start-b.start||b.end-a.end).filter((b,i,a)=>!i||b.start>=a[i-1].end);
  }
  function options(blank) {
    if(blank.kind==='lemon-shape')return shuffle([blank.answer,...['오리발 모양','반달 모양','웨지 모양','원형'].filter(s=>s!==blank.answer)]);
    if(blank.kind==='seasoning'&&stockNames.has(blank.answer.replace(/\s/g,''))){
      // Do not use interchangeable stock names as incorrect answers.
      return shuffle([blank.answer,...shuffle(['진간장','청주','맛술','식초']).slice(0,3)]);
    }
    if(blank.kind==='ratio'){
      const [a,b]=blank.answer.split(':').map(Number),same=s=>{const [x,y]=s.split(':').map(Number);return x*b===a*y;};
      return shuffle([blank.answer,...['1 : 1','2 : 1','1 : 2','3 : 1','1 : 3'].filter(s=>!same(s)).slice(0,3)]);
    }
    if(blank.kind==='weight'&&/[~～–-]/.test(blank.answer)){
      const [low,high]=blank.answer.match(/\d+(?:\.\d+)?/g).map(Number);
      const span=high-low;
      return shuffle([blank.answer,...[1,2,3].map(n=>`${low+n*span}~${high+n*span}g`)]);
    }
    if(blank.kind==='weight'||blank.kind==='count'){
      const unit=blank.answer.match(/종류|등분|조각|덩이|쪽|개|줄|장|g/)?.[0];
      const raw=blank.answer.replace(unit,'').trim(),number=Number(raw)||({한:1,두:2,세:3,네:4,반:.5}[raw]);
      const values=[number===.5?1:Math.max(1,number-1),number+1,number*2,number+2,number+3,number+4];
      return shuffle([blank.answer,...[...new Set(values)].filter(n=>n!==number).slice(0,3).map(n=>`${n}${unit}`)]);
    }
    if(blank.kind==='shape'){
      const choices={'정사각형':['직사각형','원형','삼각형'],'전복과 비슷한 크기':['전복보다 훨씬 큰 크기','전복보다 훨씬 작은 크기','전복 크기와 무관하게']};
      return shuffle([blank.answer,...(choices[blank.answer]||['큰 덩어리','아주 가는 채','통째'])]);
    }
    return window.LessonStudy.options(blank);
  }
  const kindLabel=b=>({ratio:'비율',weight:'무게',count:'개수',shape:'크기','lemon-shape':'레몬 모양'}[b.kind]||'');
  function trigger(menu,mode,index,text,label) {
    const formatted=window.SummaryReference.format(menu.id,mode,index,text);
    if(!parse(text,'all').length)return `<strong>${formatted}</strong>`;
    return `<button type="button" class="blank-launch summary-blank-launch" data-lesson-summary data-lesson-blank="${esc(text)}" data-lesson-label="${esc(menu.name+' · '+label)}" aria-label="${esc(menu.name+' '+label+' 빈칸 맞히기')}" aria-haspopup="dialog"><span>${formatted}</span><small>눌러서 빈칸 맞히기 ↗</small></button>`;
  }
  return {parse,options,kindLabel,trigger};
})();
