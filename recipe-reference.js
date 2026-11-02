'use strict';
window.RecipeReference = (() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Each rule cites an item in this menu's requirements and checks the ingredient/use.
  // Capture only the matching quantity, not another ingredient with the same number.
  const rules={
    'jp-01':[[2,/갑오징어/,/(?:길이 |두께 |너비 )(5cm|0\.3cm)/g]],
    'jp-02':[[0,/머리/,/(50~60g)/g]],
    'jp-04':[[1,/두부/,/(1 × 1 × 1cm)/g]],
    'jp-05':[[0,/몸통|도미/,/요구 규격 (5~6cm)/g]],
    'jp-06':[[1,/문어/,/길이 (4~5cm)/g],[2,/미역/,/길이 (4~5cm)/g],[3,/오이/,/(0\.1~0\.2cm)/g]],
    'jp-07':[[0,/오이/,/(0\.1~0\.2cm)/g],[1,/미역/,/미역 길이는 (4~5cm)/g]],
    'jp-09':[
      [1,/오징어/,/(?:길이 |너비 )(4cm|1cm)/g],
      [1,/오징어/,/(1 × 4cm)/g],
      [2,/양파|청피망|당근|표고버섯/,/길이 (4cm)/g]
    ],
    'jp-11':[
      [0,/삼치/,/(10~20분)/g],
      [3,/삼치/,/길이 (10cm)/g],
      [3,/삼치/,/(2조각)/g]
    ],
    'jp-12':[[1,/소고기/,/두께 (1\.5cm)/g],[1,/소고기/,/길이 (3cm)/g]],
    'jp-14':[
      [2,/달걀말이/,/(?:길이 |높이 |너비 )(8cm|2\.5cm|1cm)/g],
      [2,/달걀말이/,/(8개)/g]
    ],
    'jp-15':[[1,/몸통|도미살/,/살은 (5~6cm)/g]],
    'jp-16':[[1,/밤|죽순·표고|새우|속재료/,/(?<![\d.])(1cm)/g]],
    'jp-17':[[4,/초밥/,/(6종류|8개)/g]],
    'jp-18':[[0,/김/,/(반장)/g],[2,/김|조각/,/(두 줄|2줄|12개)/g]],
    'jp-19':[[2,/김발|김초밥/,/(?<!\d)(8개|8등분)/g]]
  };
  function ranges(menuIds,text){
    const found=[];
    for(const id of new Set(Array.isArray(menuIds)?menuIds:[menuIds])){
      for(const [item,context,pattern] of rules[id]||[]){
        const source=window.OfficialRequirements?.get(id)?.items[item];
        if(!source||!context.test(text))continue;
        for(const match of text.matchAll(pattern)){
          const start=match.index+match[0].lastIndexOf(match[1]);
          found.push({start,end:start+match[1].length,id,item,title:'시험 요구사항 명시 · '+source.text});
        }
      }
    }
    let cursor=0;
    return found.sort((a,b)=>a.start-b.start||b.end-a.end).filter(range=>{if(range.start<cursor)return false;cursor=range.end;return true;});
  }
  function format(menuIds,text){
    let cursor=0,html='';
    for(const range of ranges(menuIds,text)){
      html+=esc(text.slice(cursor,range.start))+`<span class="requirement-value" data-recipe-requirement="${range.id}:${range.item}" title="${esc(range.title)}">${esc(text.slice(range.start,range.end))}</span>`;
      cursor=range.end;
    }
    return html+esc(text.slice(cursor));
  }
  return {format,ranges};
})();
