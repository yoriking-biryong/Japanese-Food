(() => {
 'use strict';
 const baseline=window.QNET_SCHEDULE_DATA;
 const endpoint=window.STUDY_HOSTING?.qnetEndpoint??'/api/qnet-schedule';
 if(!baseline)return;
 const KEY='ilsik:qnet-schedule:v1', TTL=6*3600000;
 let data=baseline,kind='practical',showAll=false,busy=false,lastRequest=0,request=null;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const day=now=>new Date(+now+9*3600000).toISOString().slice(0,10);
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 const timestamp=(s,time='00:00:00')=>Date.parse(s+'T'+time+'+09:00');
 const shortDate=s=>s?`${Number(s.slice(5,7))}.${Number(s.slice(8,10))}`:'확인 필요';
 const range=(a,b)=>a===b?shortDate(a):`${shortDate(a)}–${shortDate(b)}`;
 const dday=(s,now)=>{const n=Math.round((Date.parse(s)-Date.parse(day(now)))/86400000);return n===0?'오늘':n>0?'D-'+n:'종료';};
 function validate(candidate){
  if(!candidate||candidate.version!==1||candidate.year!==baseline.year)return false;
  return ['practical','written'].every(type=>Array.isArray(candidate[type])&&candidate[type].length===baseline[type].length&&candidate[type].every((row,i)=>{
   const fields=['registrationStart','registrationEnd','examStart','examEnd'];
   return row.round===baseline[type][i].round&&fields.every(key=>validDate(row[key])&&row[key].startsWith(candidate.year+'-'))&&row.registrationStart<=row.registrationEnd&&row.registrationEnd<row.examStart&&row.examStart<=row.examEnd&&Array.isArray(row.examRanges)&&row.examRanges.length>0&&row.examRanges.length<30&&row.examRanges.every(r=>Array.isArray(r)&&r.length===2&&r.every(validDate)&&r[0]>=row.examStart&&r[1]<=row.examEnd&&r[0]<=r[1])&&(type==='written'||(validDate(row.resultDate)&&row.resultDate>=row.examEnd));
  }));
 }
 function scheduleState(rows,now=new Date()){
  const registration=rows.find(r=>+now<timestamp(r.registrationEnd,'18:00:00'));
  const exam=rows.find(r=>day(now)<=r.examEnd);
  const result=rows.find(r=>r.resultDate&&day(now)<=r.resultDate);
  return {registration,exam,result};
 }
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(validate(saved))data={...saved,sync:{...saved.sync,state:'cached'}};}catch{}
 const checkedText=value=>value?new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}):'';
 function statusText(now){
  const sync=data.sync;
  if(Number(day(now).slice(0,4))!==data.year)return `${data.year}년 저장 일정 · 올해 일정은 큐넷에서 확인해 주세요.`;
  if(!endpoint)return `공식 공고 저장본 · ${data.sourceCheckedAt} 대조 · 최신 일정은 큐넷 달력에서 확인`;
  if(busy)return '가까운 회차를 큐넷에서 확인하는 중…';
  if(sync?.checkedAt){
   const age=+now-Date.parse(sync.checkedAt),when=checkedText(sync.checkedAt);
   if(sync.state==='live'&&age<TTL)return `큐넷 조회 ${when} · 가까운 회차 확인 완료`;
   if(sync.state==='partial')return `일부 회차만 조회됨 · ${when} · 각 회차의 기준 확인`;
   return `저장 일정 표시 · 마지막 조회 ${when} · 새로 확인해 주세요.`;
  }
  return `공식 공고 저장본 · ${data.sourceCheckedAt} 대조 · 큐넷 연결 시 가까운 회차 갱신`;
 }
 function provenance(row){return row?.source==='calendar'&&row.checkedAt?`큐넷 ${checkedText(row.checkedAt)} 조회`:'2026 공식 공고 기준';}
 function card(title,row,dateText,mark,detail){
  return `<article class="qs-card"><div class="qs-card-top"><h3>${title}</h3><span class="qs-tag">${escape(mark)}</span></div><strong class="qs-date">${escape(dateText)}</strong><p>${row?'제'+row.round+'회 · ':''}${escape(detail)}</p>${row?`<small>${escape(provenance(row))}</small>`:''}</article>`;
 }
 function content(now=new Date()){
  const practical=kind==='practical',name=practical?'실기':'필기',rows=data[kind],expired=+day(now).slice(0,4)!==data.year;
  const {registration,exam,result}=expired?{}:scheduleState(rows,now);
  const open=registration&&+now>=timestamp(registration.registrationStart,'10:00:00');
  const today=day(now);
  const ongoing=exam&&exam.examRanges.some(([start,end])=>today>=start&&today<=end);
  const nextExamDay=exam?.examRanges.find(([,end])=>end>=today)?.[0]||exam?.examStart;
  const regCard=card(open?'원서접수 중':'다음 원서접수',registration,registration?range(registration.registrationStart,registration.registrationEnd):'일정 확인 필요',registration?open?'접수 중':dday(registration.registrationStart,now):'큐넷 확인',registration?'첫날 10:00 ~ 마지막 날 18:00':'발표된 다음 접수 일정이 없습니다.');
  const examCard=card(ongoing?`${name} 시험 기간`:`다음 ${name} 시험`,exam,exam?exam.examRanges.map(([a,b])=>range(a,b)).join(' / '):'일정 확인 필요',exam?ongoing?'진행 중':dday(nextExamDay,now):'큐넷 확인','개인 시험일은 수험표에서 확인');
  const resultCard=practical?card('합격자 발표',result,result?shortDate(result.resultDate):'일정 확인 필요',result?+now>=timestamp(result.resultDate,'09:00:00')?'오늘 발표':dday(result.resultDate,now):'큐넷 확인','발표일 09:00부터'):card('필기 합격 확인',null,'시험 종료 직후','CBT','개인별 시험 종료 즉시 확인');
  const visible=showAll?rows:rows.filter(r=>(r.resultDate||r.examEnd)>=today);
  return `<div class="qs-head"><div><p class="qs-kicker">Q-NET / ${data.year}</p><h2>상시기능사 시험 일정</h2><p class="qs-subtitle">한식 · 중식 · 일식 · 양식 공통 시행계획</p></div><div class="qs-switch" role="group" aria-label="시험 종류"><button type="button" data-qs-kind="practical" aria-pressed="${practical}">실기</button><button type="button" data-qs-kind="written" aria-pressed="${!practical}">필기</button></div></div>
   ${expired?'<p class="qs-empty">올해 일정은 아직 이 연습장에 반영되지 않았습니다. 큐넷 원문에서 새 시행계획을 확인해 주세요.</p>':''}
   <div class="qs-cards">${regCard}${examCard}${resultCard}</div>
   <div class="qs-foot"><p class="qs-status" role="status" data-state="${escape(data.sync?.state||'notice')}">${escape(statusText(now))}</p><div class="qs-links">${endpoint?`<button type="button" data-qs-refresh ${busy?'disabled':''}>${busy?'확인 중…':'↻ 새로 확인'}</button>`:''}<a href="${baseline.noticeUrl}" target="_blank" rel="noopener noreferrer">공식 공고 ↗</a><a href="${baseline.calendarUrl}" target="_blank" rel="noopener noreferrer">큐넷 달력 ↗</a></div></div>
   <p class="qs-notice">시험 기간 안에서도 종목·지역·시험장에 따라 실제 시행일이 달라요. <a href="${baseline.regionalUrl}" target="_blank" rel="noopener noreferrer">지역별 실기 시행 공지 ↗</a><br>${endpoint?`가까운 ${name} 4회차를 조회하며, 나머지는 ${data.sourceCheckedAt}에 대조한 연간 공고 기준입니다.`:`${data.sourceCheckedAt}에 대조한 연간 공고입니다. 이 사이트의 일정은 자동 갱신되지 않습니다.`}</p>
   <details class="qs-details"><summary>${data.year}년 회차별 ${name} 일정 보기</summary><div class="qs-filter"><span>한국 시간 기준 · ${rows.length}회</span><label><input type="checkbox" data-qs-all ${showAll?'checked':''}> 지난 회차도 보기</label></div><div class="qs-table-wrap" tabindex="0" role="region" aria-label="회차별 시험 일정"><table class="qs-table"><thead><tr><th scope="col">회차</th><th scope="col">원서접수</th><th scope="col">${name} 시험</th><th scope="col">발표</th></tr></thead><tbody>${visible.map(r=>`<tr><th scope="row">제${r.round}회</th><td>${range(r.registrationStart,r.registrationEnd)}<small>${escape(provenance(r))}</small></td><td>${r.examRanges.map(([a,b])=>range(a,b)).join('<br>')}</td><td>${r.resultDate?shortDate(r.resultDate):'종료 즉시'}</td></tr>`).join('')||'<tr><td colspan="4">남은 회차가 없습니다. 큐넷의 다음 연도 공고를 확인해 주세요.</td></tr>'}</tbody></table></div></details>`;
 }
 function render(){
  const host=document.getElementById('qnet-schedule');if(!host)return;
  const expanded=host.querySelector('details')?.open,focus=document.activeElement;
  const target=host.contains(focus)?focus?.getAttribute('data-qs-kind')?`[data-qs-kind="${focus.getAttribute('data-qs-kind')}"]`:focus?.hasAttribute('data-qs-refresh')?'[data-qs-refresh]':focus?.hasAttribute('data-qs-all')?'[data-qs-all]':focus?.tagName==='SUMMARY'?'summary':null:null;
  host.innerHTML=content();
  if(expanded)host.querySelector('details').open=true;
  if(target)host.querySelector(target)?.focus({preventScroll:true});
 }
 async function refresh(force=false){
  if(!endpoint)return;
  if(request)return request;
  if(!force&&Date.now()-lastRequest<TTL)return;
  lastRequest=Date.now();busy=true;render();
  request=(async()=>{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),55000);
   try{
    const response=await fetch(endpoint+(force?'?refresh=1':''),{signal:controller.signal,cache:'no-store'});
    if(!response.ok)throw Error('Unavailable');
    const next=await response.json();if(!validate(next))throw Error('Invalid schedule');
    data=next;try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}
   }catch{data={...data,sync:{...(data.sync||{}),state:data.sync?.checkedAt?'cached':'offline'}};}
   finally{clearTimeout(timeout);busy=false;request=null;render();}
  })();
  return request;
 }
 function mount(host){
  if(!host)return;host.className='qs-panel';host.setAttribute('aria-label','큐넷 상시기능사 일정');
  host.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.qsKind){kind=button.dataset.qsKind;render();}else if(button.hasAttribute('data-qs-refresh'))refresh(true);});
  host.addEventListener('change',event=>{if(event.target.hasAttribute('data-qs-all')){showAll=event.target.checked;render();}});
  render();refresh();
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();if(document.getElementById('qnet-schedule'))refresh();}});
 setInterval(()=>{if(!document.hidden&&document.getElementById('qnet-schedule')){render();refresh();}},60000);
 window.QnetSchedule={mount,scheduleState,validate};
})();
