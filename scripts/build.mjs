import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'_site');
if(path.dirname(out)!==root||path.basename(out)!=='_site')throw Error('Unexpected staging path');
await rm(out,{recursive:true,force:true});await mkdir(out);
const pages=['index','studyflow','focus','json','hash','text'];
const files=[...pages.map(p=>p+'.html'),'playground.css','release-ui.css','playground.js','catalog.js','planner.js','tool-models.js','workbench-models.js','tools.js','robots.txt','sitemap.xml','CNAME'];
for(const file of files){
  const source=await readFile(path.join(root,file));
  if(file.endsWith('.html')&&/127\.0\.0\.1|localhost|data-api=|noindex/.test(source.toString()))throw Error('Preview configuration in public HTML: '+file);
  await writeFile(path.join(out,file),source);
}
for(const folder of ['assets','guide'])await cp(path.join(root,folder),path.join(out,folder),{recursive:true});
await writeFile(path.join(out,'.nojekyll'),'');
async function audit(dir){for(const item of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,item.name);if(item.isDirectory())await audit(full);else if(/private|\.env|\.db$|\.py$|\.zip$/i.test(item.name))throw Error('Unexpected private artifact: '+full);}}
await audit(out);console.log('Staged six public pages with self-contained browser tools.');
