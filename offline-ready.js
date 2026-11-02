(()=>{
 if(!('serviceWorker' in navigator)||!['http:','https:'].includes(location.protocol))return;
 const status=document.createElement('span');status.className='small muted offline-ready';status.setAttribute('role','status');status.textContent='다음 실행을 위해 오프라인 자료 저장 중…';document.querySelector('footer')?.append(status);
 navigator.serviceWorker.register('./offline-sw.js',{updateViaCache:'none'}).then(async registration=>{
  await navigator.serviceWorker.ready;status.textContent='오프라인 준비 완료 · 다음에도 이 주소로 열 수 있어요';status.title='레시피·사진·글꼴·퀴즈가 이 브라우저에 저장됐어요. 큐넷 최신 일정은 서버 연결이 필요해요.';
  registration.update().catch(()=>{});
 }).catch(()=>{status.textContent='오프라인 저장 대기 · 서버가 켜진 상태에서 다시 열어 주세요';});
})();
