import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const baseline=JSON.parse(fs.readFileSync(path.join(dir,'qnet-data.json'),'utf8'));
const cacheFile=process.env.QNET_CACHE_FILE || path.join(dir,'.qnet-cache.json');
const TTL=6*60*60*1000, RETRY=2*60*1000;
let cache=null, inFlight=null, lastAttempt=0;
try{const saved=JSON.parse(fs.readFileSync(cacheFile,'utf8'));if(saved.version===1&&saved.year===baseline.year&&Array.isArray(saved.practical)&&Array.isArray(saved.written)&&saved.sync?.checkedAt)cache=saved;}catch{}
const seoulDay=now=>new Date(+now+9*3600000).toISOString().slice(0,10);
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const nextDay=s=>new Date(Date.parse(s)+86400000).toISOString().slice(0,10);
export function dateRanges(dates){
 const sorted=[...new Set(dates)].sort(),ranges=[];
 for(const day of sorted){const last=ranges.at(-1);if(last&&nextDay(last[1])===day)last[1]=day;else ranges.push([day,day]);}
 return ranges;
}
export function calendarToRound(rows,original,kind,checkedAt){
 if(!Array.isArray(rows)||rows.length>150)throw Error('Unexpected calendar');
 const buckets={'10':[],'20':[],'30':[]};
 for(const row of rows){
  if(!validDate(row.DATE_VALUE)||!row.DATE_VALUE.startsWith(baseline.year+'-'))throw Error('Unexpected date');
  for(const key of String(row.SCHD_ITEM_CCD).split(',').map(x=>x.trim()))if(buckets[key])buckets[key].push(row.DATE_VALUE);
 }
 for(const key of Object.keys(buckets))buckets[key]=[...new Set(buckets[key])].sort();
 if(!buckets['10'].length||!buckets['20'].length||(kind==='practical'&&!buckets['30'].length))throw Error('Incomplete calendar');
 const registrationStart=buckets['10'][0],registrationEnd=buckets['10'].at(-1),examStart=buckets['20'][0],examEnd=buckets['20'].at(-1),resultDate=kind==='practical'?buckets['30'][0]:null;
 if(registrationEnd>=examStart||(resultDate&&resultDate<examEnd))throw Error('Invalid date order');
 return {...original,registrationStart,registrationEnd,examStart,examEnd,examRanges:dateRanges(buckets['20']),resultDate,source:'calendar',checkedAt};
}
async function query(id,params,fetcher){
 const url=new URL('https://mo.q-net.or.kr/sch001.do');
 url.search=new URLSearchParams({id,searchGbn:'2',calGbn:'cal',...params});
 const response=await fetcher(url,{signal:AbortSignal.timeout(9000),redirect:'error',headers:{Accept:'application/json'}});
 if(!response.ok)throw Error('Q-Net response '+response.status);
 const bytes=await response.arrayBuffer();if(bytes.byteLength>1024*1024)throw Error('Response too large');
 const data=JSON.parse(new TextDecoder('euc-kr').decode(bytes));
 return data;
}
export async function refreshSchedule(base,now=new Date(),fetcher=fetch){
 const today=seoulDay(now),stamp=now.toISOString();
 const data=structuredClone(base);
 // A new year's unpublished schedule must never reuse the previous year's dates.
 if(Number(today.slice(0,4))!==data.year)return {...data,sync:{state:'expired',checkedAt:null,attemptedAt:stamp,successful:0,total:0}};
 const plans=await query('sch00102s04',{calYear:String(data.year),seqNo:'2'},fetcher);
 if(!Array.isArray(plans.list)||!plans.list.length)throw Error('No public plan list');
 const byRound=new Map();
 for(const plan of plans.list){const m=String(plan.implPlanNm).match(/^(\d{4})년 상시 기능사 (\d+)회$/);if(m&&+m[1]===data.year&&/^PL\d+$/.test(plan.implPlanId))byRound.set(+m[2],plan.implPlanId);}
 let total=0,successful=0;
 // Limit requests: only the nearest four rounds in each mode; six-hour cache.
 for(const kind of ['practical','written']){
  const upcoming=data[kind].filter(row=>(row.resultDate||row.examEnd)>=today).slice(0,4);
  for(let offset=0;offset<upcoming.length;offset+=2){
   const jobs=upcoming.slice(offset,offset+2).map(async original=>{
    total++;const planId=byRound.get(original.round);if(!planId)throw Error('Plan unavailable');
    const params={calYear:String(data.year),calMonth:original.examStart.slice(5,7),seqNo:kind==='practical'?'2':'1',implPlanId:planId};
    const {calList1}=await query('sch00102s01',params,fetcher);
    const updated=calendarToRound(calList1,original,kind,stamp);
    data[kind][data[kind].findIndex(x=>x.round===original.round)]=updated;successful++;
   });
   await Promise.allSettled(jobs);
  }
 }
 if(total&&!successful)throw Error('No complete calendar rows');
 data.sync={state:successful===total?'live':'partial',checkedAt:stamp,attemptedAt:stamp,successful,total};
 return data;
}
export async function getSchedule(force=false){
 const now=new Date(),stamp=+now,year=+seoulDay(now).slice(0,4);
 if(year!==baseline.year)return {...baseline,sync:{state:'expired',checkedAt:null,attemptedAt:now.toISOString(),successful:0,total:0}};
 const age=cache?stamp-Date.parse(cache.sync.checkedAt):Infinity;
 if(cache&&age<TTL&&!force)return cache;
 if(inFlight)return inFlight;
 if(stamp-lastAttempt<RETRY)return cache||{...baseline,sync:{state:'offline',checkedAt:null,attemptedAt:new Date(lastAttempt).toISOString(),successful:0,total:0}};
 lastAttempt=stamp;
 inFlight=(async()=>{
  try{
   const fresh=await refreshSchedule(cache||baseline,now);
   cache=fresh;
   try{fs.mkdirSync(path.dirname(cacheFile),{recursive:true});fs.writeFileSync(cacheFile,JSON.stringify(cache));}catch{}
   return fresh;
  }catch{
   return {...(cache||baseline),sync:{...(cache?.sync||{}),state:cache?'cached':'offline',attemptedAt:now.toISOString(),checkedAt:cache?.sync?.checkedAt||null}};
  }finally{inFlight=null;}
 })();
 return inFlight;
}
export async function handleQnetRequest(req,res){
 const url=new URL(req.url,'http://localhost');
 if(url.pathname!=='/api/qnet-schedule')return false;
 if(req.method!=='GET'){res.writeHead(405,{Allow:'GET'});res.end();return true;}
 try{const result=await getSchedule(url.searchParams.get('refresh')==='1');res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(result));}
 catch{res.writeHead(503,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'일정을 불러오지 못했습니다.'}));}
 return true;
}
