import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
export function buildOfflineAssets(){
 const root=path.dirname(fileURLToPath(import.meta.url)),files=[];
 function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name.startsWith('.'))continue;const p=path.join(dir,entry.name);if(entry.isDirectory())scan(p);else if(/\.(html|css|js|woff2|jpg|jpeg|png|webp|svg)$/i.test(entry.name)&&!['offline-sw.js','offline-assets.js','ingredient-preview.html'].includes(entry.name))files.push(path.relative(root,p).replaceAll('\\','/'));}}
 scan(root);files.sort();const hash=crypto.createHash('sha256');for(const file of files)hash.update(file).update(fs.readFileSync(path.join(root,file)));
 const manifest={version:hash.digest('hex').slice(0,20),files};const content='self.STUDY_OFFLINE='+JSON.stringify(manifest)+';\n';
 const target=path.join(root,'offline-assets.js');if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==content)fs.writeFileSync(target,content);
 return manifest;
}
