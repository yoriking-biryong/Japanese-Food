'use strict';
// Each row describes one existing learning step: tools : ingredient indices in data.js.
// These are study interactions, not official marking criteria or a required work order.
window.KITCHEN_DATA = (() => {
  const plans = {
    'jp-01': ['pot:3','sink,bowls:2,4','board,sink:0,3','pot,sink,colander:0,3','board,bowls:1','board,bowls:0','bowls,utensils:1','bowls,utensils:0,1','board,plates:0,1,4','sink,board,plates:0,1,2'],
    'jp-02': ['bowls,board,pot:0,1,2,6,3','sink,board,utensils,trash:0','board,cloth,sink,bowls,trash:0,4','board,sink,colander:1','board:6','pot,colander,sink,board,bowls:2','pot,colander,sink:0,4','sink,plates,cloth:0','pot,sink:0,3,7','pot,utensils,trash:0,3','pot,utensils,bowls:0','colander,bowls,towel,utensils:0,5,4','bowls,plates,colander:0,2,1,6','pot:0,3,7,5,4','utensils,bowls,plates:0,2,1,6'],
    'jp-03': ['sink,bowls:0,4','sink,bowls:1','board:2','sink,bowls:0','pot:0,6,3','pot,utensils,trash:0,6','pot,utensils,bowls:0','bowls,plates,trash:0','pot,utensils:0,4,5','plates:0,1,2','pot,utensils,bowls,plates:0,1,2,3,4,5'],
    'jp-04': ['pot:1','sink,bowls:6','board,bowls:2','board:3','pot,bowls,trash:1,5','pot,colander,bowls:2','pot,colander,sink:6','board,trash:6','bowls,plates:2,6,3','sink,pot,colander:5,1','pot,colander,utensils:0,5,1,7','pot,utensils:0,5,1,7','utensils,bowls,plates:0,2,6,3,5,7'],
    'jp-05': ['board,utensils:0','pot:8','sink,board,bowls:1,2,3','pot,bowls,trash:8','sink,board,towel:0','board,sink,utensils,towel,trash:0','pot:0','board:0','board,bowls,trash:0,7','pot,sink,plates,cloth:0,7','board,pot,utensils,sink:1,0,5,8,6,9,4','board:3','pot,utensils:0,1','board,bowls:3','board:2','pot,utensils:0,1','pot,utensils:0,1,2,8','colander,sink,cloth,plates:0,1,2,3,6'],
    'jp-06': ['pot,cloth:6','sink,bowls:1,0,4','board,trash:3','bowls:3,4','pot,bowls,trash:6,9','pot:1,0','board,trash:2','pot,colander,sink,utensils:1','pot,utensils:0,7,5','board,trash:1','pot,bowls,sink,utensils:0','colander,cloth,bowls:6,9','bowls,utensils:6,9,7,5,8','sink,colander:3,4','board,plates:3,1,2','board,trash:0','plates,utensils:0,3,1,2','plates,bowls,utensils:0,3,1,2,6,9,7,5,8'],
    'jp-07': ['pot:7','sink,bowls:2,4,5','sink,board,bowls,trash:0,6','pot,bowls,trash:7,8','pot,colander,sink:2','board:1','bowls:1,6','board,trash:5','board:3','board,colander,bowls:4,11','board,trash:2','colander,cloth,bowls,utensils:7,8,10,9','sink,colander,board:1,6','sink,colander,board:0,6','plates,utensils:0,1,2,3,4,5,11','plates,bowls,utensils:0,1,2,3,4,5,7,8,9,10,11'],
    'jp-08': ['bowls,cloth:11','bowls:5','pot:8','sink,towel,bowls:0,1,2,3','pot,bowls,trash:8,12','board,bowls:2','board,trash:1','board,bowls:3','colander,cloth,bowls:8,12','board:0','sink,board,towel:0','pan,utensils:12,8,7,9,6,10','bowls,utensils:4,10','pan,utensils:0,1,12,7,9,6,10','pan,utensils:0,1,3,2','pan,bowls:4,10,0,1,3,2','pan,utensils,bowls,plates:11,0,1,3,2,4','pan,board,plates:5,11,0,4'],
    'jp-09': ['sink,bowls,trash:0,3,4,5,6,7','pot:1,2','board,trash:2','board:2','board,utensils,trash:1','pot,colander,bowls:2','pot,colander,bowls:1','pot,sink:0','board:3,7','board,trash:6','board:5','bowls,utensils:10,11,9','pot,colander,sink,bowls:0','sink,pot:0','board,trash:1','pan,utensils:12,3,5,6','pan,bowls,utensils:10,11,9,0','pan,utensils:1,2,7,4,0','pan,utensils:13,0,1,2,3,4,5,6,7','plates,utensils:0,1,2,3,4,5,6,7,8'],
    'jp-10': ['bowls:3','pot:6','sink,bowls:1,2','board,colander,bowls,plates:1','pot,bowls,trash:6,5','pot:0','board,plates:2,1','bowls,utensils,plates:4,1,2','pot,utensils:0','pot,utensils,board:0','colander,cloth,bowls:5,6','pot,colander,sink:0','bowls,utensils:0,11','pot,utensils,sink:5,6,7,8,10,9','colander,board,plates:0','pot,utensils:5,7,8,10,9','pot,bowls:5,7,8,10,9,11','pan,board,plates:3,0','plates,bowls:0,1,2,3,4,5,7,8,9,10,11'],
    'jp-11': ['pot:8','sink,bowls:1,2,4,5','board,sink:5','pot,bowls,trash:8','board,bowls:5,7','board,utensils,trash:0','board,bowls:0,3','pot,colander,utensils,sink,towel:5,6','pot,utensils:5,8,9,10,11,13','board:4','bowls,utensils:4,3,7,10','board,trash:1','pot,utensils:5,8,9,10,11,13','utensils:6','sink,cloth:0,3','board,utensils:0','utensils:0','utensils:0','bowls,plates:4','board,utensils,plates:0,2','board,plates:0,1,4','plates,utensils:0,1,2,4,5,12'],
    'jp-12': ['pot:1','towel,bowls,sink,board:0,11,2','pot,bowls,trash:1','pot,utensils:1,10,6,4,9','pot,bowls:4,6,10,9,1','board,bowls:2','board,trash:0','plates:0,7,3','pan,utensils:0,8','board,towel,plates:11','colander,sink,cloth,plates,bowls:2,11','pan,utensils,towel:0,4,6,10,9,1','pan,board,cloth:0,4,9','board:0','plates,utensils:0,4,6,10,9,1,11,2','towel,board,plates:0,5'],
    'jp-13': ['sink,bowls,pot:0,1','pot,colander,sink:5','board,utensils:0','board,pot,colander:0','sink,board,pot:0','board:3,2,1','sink,board:0,8','board:0','pan:9,2','pan:0,4,6','pan:6,3,5,8,7,0','plates:0,1,2,3,5'],
    'jp-14': ['pot,cloth:2','sink,bowls:9,0','pot,bowls,trash:2,5','board,colander,sink,bowls:7','bowls,utensils:7,8','colander,cloth,bowls:2,5','bowls,utensils:0,3,6,1','bowls,utensils:0,2,5','smallpan:0','bowls,colander,utensils:0,2,5,3,6,1','smallpan,bowls,towel:4','smallpan,utensils:0,2,5,3,6,1,4','smallpan,utensils,towel:0,4','smallpan,utensils:0,2,5,3,6,1,4','smallpan,utensils,towel:0,4','smallpan,utensils:0','board,towel:0','board,plates:9,7,8','board:0','board,plates:0,9,7,8'],
    'jp-15': ['pot:10','sink,bowls:5,7,6,8,10','pot,bowls:10','pot:2,3,1,6,7','sink,bowls,board,utensils,towel,trash:0','board:0','board,trash:0','board,cloth,sink,trash,bowls:0,15','board,pot,bowls:2,3,7,1,6','board,colander,plates:3,13','pot,colander,bowls,sink:1,7,6,2,3','board,plates:14,3,13,8','bowls,utensils,plates:10,11,12','board:4','board:5','pot,colander,bowls,sink:3,2','pot,colander,sink:0','sink,plates,cloth:0','sink,cloth,plates:0,15','board,bowls:6','board,bowls:1,7','pot,bowls,utensils,sink:9,10,15','pot:0','plates,bowls,utensils:3,1,7,6,4,0,2,5,9,10,15','pot,cloth:0,3,1,7,6,4,2,5,9,10,15','pot,cloth,plates:0,7','plates,bowls:0,3,13,14,8,10,11,12'],
    'jp-16': ['pot:15','sink,bowls:9,3','board,bowls:4','pot,bowls,trash:15,5','pan,sink,board:4','pot:7,14,3,8,1,6','board,towel,bowls:14,3,2,6,8,10,11','board,utensils:1','pot,colander,sink:7','pot,colander,sink:14,3,2','pot,colander:8,1,6,10','board:1','colander,bowls:5','bowls,utensils:0,16,12,11,5','sink,pot:0','bowls,colander,utensils:0,3,4,14,2,6,8,1,7','pot,cloth:0,3,4,14,2,6,8,1,7','board:13,9','pot,plates:0,9,13'],
    'jp-17': ['sink,bowls:0,1,2,3,4,5,7,12','board:8','pot,utensils,bowls:10,11,12','bowls,utensils,cloth:6,10,11,12','pot,sink:8,2','cloth,bowls:0,4','board,cloth,trash:1','board,cloth,trash:3','pot,colander,sink,bowls:8,10,11,12','board,utensils,pot,trash:2','pot,colander,bowls:2','pot,sink:5','bowls,utensils:9','pot,utensils,colander:5,13,10','board,utensils,trash:2','board,trash:5','board,trash:3','sink,board,towel:0,1,3,4,5','board:1','board:4','board:0','board,plates:7,8','bowls,utensils,plates:0,1,2,3,4,5,6,9,10,11,12','bowls,plates:0,1,2,3,4,5,6,9,10,11,12','plates,bowls:0,1,2,3,4,5,6,7,8,13'],
    'jp-18': ['sink,bowls:0,3,4','pan,board,bowls:3','sink,bowls:2,5','sink,bowls,cloth:0,8','pot,utensils,bowls:6,7,8','pot:5','bowls,utensils,cloth:4,6,7,8','board,trash:5','pot,colander,sink,bowls:5,6,7,8','bowls,utensils:1','board:0','board:3','board,bowls:5','board,bowls:3,4,6,7,8','board:3,4','board,utensils:3,4,1,0','board:3,4,1,0','board,plates:2,5','board,cloth,plates:0,3,4','plates,bowls:0,3,4,2,5,9'],
    'jp-19': ['bowls:0','sink,bowls:5','pot,utensils,bowls:10,9,8','pot:4,3','bowls,utensils,cloth:1,8,9,10','board,trash:4','board,bowls:6,10','pot,colander,bowls:4,8,9,10','pot,colander,sink,bowls:3','bowls,utensils,colander:2,10,13','smallpan,towel,utensils:2,11,10,13','board,towel:2','pot,utensils:3,12,13,9','pot,utensils:3,12,13,9','board:2','sink,colander,towel:6','board,pan,towel:0','pot,utensils,bowls:3,12,13,9','bowls,plates:4','board,bowls:0,1,8,9,10','board,utensils:0,1,7','board:0,1,3,2,6,7','board:0,1,3,2,6,7','board,plates:5,4','board,cloth,plates:0,1,2,3,6,7','plates,bowls:0,1,2,3,6,7,4,5,12']
  };
  const tools = [
    ['pan','팬',[1.5,9,25.5,30]],['smallpan','작은 팬',[24,21,40,39]],
    ['pot','냄비',[37,13,57,34]],['utensils','조리 도구',[58,4,73,37]],
    ['sink','싱크대',[78,15,99,27]],['colander','체',[72,27,97,38]],
    ['trash','폐기물 그릇',[6,38,23,47]],['bowls','준비 볼',[25,37,73,49]],
    ['plates','담음 접시',[14,51,76,67]],['towel','마른 수건',[78,38,93,47]],
    ['cloth','젖은 행주',[80,48,95,59]],['board','도마 · 김발',[22,71,78,93]]
  ].map(([id,name,rect])=>({id,name,rect}));
  const hygiene = [
    {id:'wash',name:'작업 전 손 씻기',tool:'sink'},
    {id:'clean',name:'생재료 작업 뒤 칼·도마 세척',tool:'sink'},
    {id:'dry',name:'씻은 도구 물기 닦기',tool:'towel'},
    {id:'wring',name:'행주 세척 후 물기 짜기',tool:'cloth'},
    {id:'wipe',name:'작업대 중간 정리',tool:'cloth'},
    {id:'scrap',name:'폐기물 분리하기',tool:'trash'}
  ];
  const atlasNames = ['갑오징어몸살','명란젓','무순','청차조기잎(시소)','도미','죽순',
    '건다시마','국간장','청주','쑥갓','산초가루','가다랑어포(가쓰오부시)',
    '건미역','우엉','꽈리고추','통생강','맛술','문어다리',
    '해삼','고춧가루','팽이버섯','김','우동','숙주',
    '생표고버섯','참기름','메밀국수','고추냉이','각얼음','삼치',
    '흰참깨','전복','은행','배추','어묵','밤',
    '박고지','오보로','학꽁치','문어(삶은 것)','흰생선살','일본된장'];
  const images = Object.fromEntries(atlasNames.map((name,index)=>[name,window.INGREDIENT_PICTURES.atlas[index]]));
  const files = {'소고기':'beef','당근':'carrot','양파':'onion','달걀':'egg','버터':'butter','소금':'salt',
    '새우':'ingredient-shrimp-real','참치살':'ingredient-tuna-real','백합조개':'ingredient-clam-real',
    '닭고기살':'ingredient-chicken-leg-real','청피망':'ingredient-green-pepper-real','오이':'ingredient-cucumber-real',
    '무':'ingredient-radish-real','대파':'ingredient-leek-real','실파':'ingredient-chive-real',
    '식용유':'ingredient-canola-oil-real','식초':'ingredient-vinegar-real','흰설탕':'ingredient-sugar-real',
    '검은후춧가루':'pepper-real','레몬':'ingredient-lemon-real','밥':'rice','판두부':'tofu'};
  Object.entries(files).forEach(([name,file])=>{images[name]=window.INGREDIENT_PICTURES.files[file];});
  for(const [name,source] of Object.entries({'작은새우':'새우','진간장':'국간장','깻잎':'청차조기잎(시소)','가다랑어포(하나가쓰오)':'가다랑어포(가쓰오부시)','광어살':'흰생선살','도미살':'흰생선살'}))images[name]=images[source];
  const steps = Object.fromEntries(window.MENUS.map(m=>[m.id,plans[m.id].map(row=>{
    const [toolList,indices]=row.split(':');
    return {tools:toolList.split(','),ingredients:indices.split(',').map(i=>m.ingredients[Number(i)].name)};
  })]));
  return {tools,hygiene,images,steps};
})();
