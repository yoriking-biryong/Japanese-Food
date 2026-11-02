'use strict';
window.SummaryEditor=(()=>{
  const KEY='ilsik-study:focus-overrides:v1',LIMIT=6000,menus=new Map(window.MENUS.map(m=>[m.id,m]));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const drafts=new Map(),imports=new WeakMap();
  const original=m=>m.focus.replace(/<\/?strong>/g,'**');
  const format=s=>esc(s).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  function validate(value){
    if(!value||value.version!==1||!value.summaries||typeof value.summaries!=='object'||Array.isArray(value.summaries))throw Error('요약 파일 형식이 올바르지 않습니다.');
    const summaries={};
    for(const [id,text] of Object.entries(value.summaries)){
      if(!menus.has(id)||typeof text!=='string'||!text.trim()||text.length>LIMIT)throw Error('메뉴 또는 요약 내용을 확인해 주세요.');
      summaries[id]=text;
    }
    return summaries;
  }
  function read(){
    try{const raw=localStorage.getItem(KEY);return {raw,summaries:raw===null?{}:validate(JSON.parse(raw))};}
    catch{return {error:'저장된 요약을 읽지 못했습니다. 기존 기록은 덮어쓰지 않습니다.'};}
  }
  const value=(menu,state=read())=>state.summaries?.[menu.id]??original(menu);
  const html=menu=>{const text=read().summaries?.[menu.id];return text===undefined?menu.focus:format(text);};
  function write(summaries){
    try{localStorage.setItem(KEY,JSON.stringify({version:1,summaries}));refresh();return {ok:true};}
    catch{return {error:'저장하지 못했습니다. 입력한 내용을 복사해 보관해 주세요.'};}
  }
  function save(id,text,expected){
    const state=read(),menu=menus.get(id);if(state.error)return state;
    if(!menu||typeof text!=='string'||!text.trim()||text.length>LIMIT)return {error:'요약을 1~6,000자로 입력해 주세요.'};
    if(expected!==undefined&&value(menu,state)!==expected)return {error:'다른 창에서 이 요약이 바뀌었습니다. 입력한 글을 복사한 뒤 취소하고 다시 열어 주세요.'};
    const next={...state.summaries};text=text.trim();
    if(text===original(menu))delete next[id];else next[id]=text;
    return write(next);
  }
  function exportData(){const state=read();if(state.error)throw Error(state.error);return {version:1,kind:'ilsik-focus-overrides',summaries:state.summaries};}
  function importData(data,expectedRaw){
    let incoming;try{if(data?.kind!=='ilsik-focus-overrides')throw Error();incoming=validate(data);}catch{return {error:'이 연습장에서 내보낸 요약 JSON 파일을 선택해 주세요.'};}
    const state=read();if(state.error)return state;
    if(state.raw!==expectedRaw)return {error:'미리보기를 연 뒤 저장된 요약이 바뀌었습니다. 파일을 다시 선택해 주세요.'};
    return write({...state.summaries,...incoming});
  }
  function controls(menu){
    return `<div class="focus-edit-tools"><button type="button" data-focus-action="edit" data-focus-id="${menu.id}" aria-expanded="false" aria-controls="focus-editor-${menu.id}">요약 수정 ✎</button><span class="small muted" data-focus-status="${menu.id}" role="status"></span></div><div class="focus-editor" id="focus-editor-${menu.id}" data-focus-editor="${menu.id}" hidden></div>`;
  }
  function refresh(){
    document.querySelectorAll('[data-focus-menu]').forEach(el=>{const menu=menus.get(el.dataset.focusMenu);if(menu)el.innerHTML=html(menu);});
  }
  function status(id,text){document.querySelectorAll(`[data-focus-status="${id}"]`).forEach(el=>el.textContent=text);}
  function close(id){
    const root=document.querySelector(`[data-focus-editor="${id}"]`);if(root){root.hidden=true;root.innerHTML='';imports.delete(root);}
    drafts.delete(id);const button=document.querySelector(`[data-focus-action="edit"][data-focus-id="${id}"]`);button?.setAttribute('aria-expanded','false');button?.focus({preventScroll:true});
  }
  function open(id){
    const menu=menus.get(id),root=document.querySelector(`[data-focus-editor="${id}"]`);if(!menu||!root)return;
    if(!root.hidden&&drafts.has(id)){root.querySelector('textarea')?.focus();return;}
    const state=read(),text=value(menu,state);drafts.set(id,{expected:text});
    root.innerHTML=`<label for="focus-text-${id}">${esc(menu.name)} · 시험장에서 먼저 떠올릴 내용</label><p class="small muted">작업 사이에 →를 넣고, 굵게 표시할 부분은 **내용**으로 감싸 주세요.</p><textarea id="focus-text-${id}" data-focus-text maxlength="${LIMIT}" rows="7">${esc(text)}</textarea><div class="focus-editor-actions"><button type="button" data-focus-action="bold">선택한 글 굵게</button><button type="button" data-focus-action="arrow">→ 넣기</button><button type="button" data-focus-action="default">기본 요약 불러오기</button></div><p class="small muted">미리보기</p><div class="focus-editor-preview" data-focus-preview>${format(text)}</div><p role="status" class="small muted" data-focus-message>${esc(state.error||'저장하면 이 메뉴의 요약과 메뉴 카드에 함께 반영됩니다.')}</p><div class="focus-editor-actions"><button type="button" class="primary" data-focus-action="save">요약 저장</button><button type="button" data-focus-action="cancel">취소</button></div><details class="focus-transfer"><summary>다른 기기·GitHub 사이트로 수정 요약 옮기기</summary><p class="small muted">저장한 요약 전체를 파일로 내보낸 뒤, 새 사이트에서 가져오세요. 메모·형광펜·성적은 이 파일에 포함되지 않습니다.</p><button type="button" data-focus-action="export">수정 요약 전체 내보내기</button><label for="focus-import-${id}">수정 요약 가져오기 (JSON)</label><input id="focus-import-${id}" data-focus-import type="file" accept="application/json,.json"><div data-focus-import-preview></div></details>`;
    root.hidden=false;document.querySelector(`[data-focus-action="edit"][data-focus-id="${id}"]`)?.setAttribute('aria-expanded','true');root.querySelector('textarea').focus();
  }
  function updatePreview(root){root.querySelector('[data-focus-preview]').innerHTML=format(root.querySelector('textarea').value);}
  document.addEventListener('input',event=>{if(event.target.matches('[data-focus-text]'))updatePreview(event.target.closest('[data-focus-editor]'));});
  document.addEventListener('change',async event=>{
    const input=event.target;if(!input.matches('[data-focus-import]'))return;
    const root=input.closest('[data-focus-editor]'),preview=root.querySelector('[data-focus-import-preview]'),file=input.files[0];imports.delete(root);preview.textContent='';if(!file)return;
    try{
      if(file.size>250000)throw Error('요약 파일은 250KB 이하여야 합니다.');
      const data=JSON.parse(await file.text());if(data.kind!=='ilsik-focus-overrides')throw Error('이 연습장에서 내보낸 요약 파일을 선택해 주세요.');
      const summaries=validate(data),state=read();if(state.error)throw Error(state.error);
      if(!Object.keys(summaries).length)throw Error('가져올 수정 요약이 없습니다.');
      if(input.files[0]!==file||!root.isConnected)return;
      imports.set(root,{data,expectedRaw:state.raw});
      preview.innerHTML=`<p>${Object.keys(summaries).length}개 메뉴 요약을 가져옵니다. 같은 메뉴의 저장된 요약은 아래 내용으로 바뀝니다.</p>${Object.entries(summaries).map(([id,text])=>`<details><summary>${esc(menus.get(id).name)}</summary><p>${format(text)}</p></details>`).join('')}<button type="button" data-focus-action="apply-import">확인한 요약 가져오기</button>`;
    }catch(e){if(input.files[0]===file)preview.textContent=e.message||'파일을 읽지 못했습니다.';}finally{if(input.files[0]===file)input.value='';}
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-focus-action]');if(!button)return;
    const action=button.dataset.focusAction;if(action==='edit'){open(button.dataset.focusId);return;}
    const root=button.closest('[data-focus-editor]');if(!root)return;
    const id=root.dataset.focusEditor,menu=menus.get(id),field=root.querySelector('textarea'),message=root.querySelector('[data-focus-message]');
    if(action==='cancel'){close(id);return;}
    if(action==='save'){
      const result=save(id,field.value,drafts.get(id)?.expected);if(result.error){message.textContent=result.error;return;}close(id);status(id,'내 요약 저장됨');return;
    }
    if(action==='default'){field.value=original(menu);updatePreview(root);message.textContent='기본 요약을 불러왔습니다. 저장하면 적용됩니다.';return;}
    if(action==='bold'||action==='arrow'){
      const start=field.selectionStart,end=field.selectionEnd,selected=field.value.slice(start,end);
      if(action==='bold'&&!selected){message.textContent='굵게 표시할 글을 먼저 드래그해 선택하세요.';return;}
      const insert=action==='arrow'?' → ':selected.startsWith('**')&&selected.endsWith('**')?selected.slice(2,-2):'**'+selected+'**';
      if(field.value.length-(end-start)+insert.length>LIMIT){message.textContent='요약은 6,000자까지 입력할 수 있습니다.';return;}
      field.setRangeText(insert,start,end,'select');field.focus();updatePreview(root);return;
    }
    if(action==='export'){
      try{const data=exportData(),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ilsik-summary-backup.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='저장한 수정 요약을 내보냈습니다.';}catch(e){message.textContent=e.message;}return;
    }
    if(action==='apply-import'){
      const pending=imports.get(root);if(!pending)return;const result=importData(pending.data,pending.expectedRaw);
      if(result.error){message.textContent=result.error;return;}close(id);status(id,'수정 요약을 가져왔습니다.');
    }
  });
  window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)refresh();});
  return {html,controls,original,format,read,save,validate,exportData,importData};
})();
