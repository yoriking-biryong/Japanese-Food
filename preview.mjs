import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleQnetRequest} from './qnet-server.mjs';
import {buildOfflineAssets} from './offline-assets.mjs';
buildOfflineAssets();
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 if(new URL(req.url,'http://localhost').pathname==='/__study-health'){
  res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify({app:'ilsik-study',version:1,pid:process.pid}));return;
 }
 if(await handleQnetRequest(req,res))return;
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if((file!==root&&!file.startsWith(root+path.sep))||path.basename(file).startsWith('.')||file.endsWith('.mjs')){res.writeHead(403);res.end();return;}
  if(!fs.statSync(file).isFile())throw Error('Not a file');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('파일을 찾을 수 없습니다.');}
}).listen(Number(process.env.PORT)||4186,'127.0.0.1',()=>console.log('일식 연습장 http://127.0.0.1:'+(process.env.PORT||4186)+'/'));
