import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=fs.readdirSync(root).filter(f=>f.endsWith('.js')||f.endsWith('.mjs'));
for(const f of files)execFileSync(process.execPath,['--check',path.join(root,f)]);
for(const f of fs.readdirSync(path.join(root,'lab')).filter(f=>f.endsWith('.js')))execFileSync(process.execPath,['--check',path.join(root,'lab',f)]);
const c={self:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'offline-assets.js'),'utf8'),c);
for(const f of c.self.STUDY_OFFLINE.files)if(!fs.existsSync(path.join(root,f)))throw Error('Missing offline asset: '+f);
for(const f of ['index.html','lesson-summary.html'])for(const match of fs.readFileSync(path.join(root,f),'utf8').matchAll(/(?:src|href)="([^"#]+)"/g)){
 const target=match[1].split('?')[0];if(/^(?:https?:|data:|#)/.test(target))continue;
 if(target.startsWith('/')||!fs.existsSync(path.join(root,target)))throw Error('Invalid relative link: '+target);
}
console.log('구문·오프라인 자산·상대 경로 확인 완료');
