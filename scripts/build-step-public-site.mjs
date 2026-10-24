#!/usr/bin/env node
/**
 * Build a strict allowlisted GitHub Pages artifact.
 * Teaching foundation stays in GitHub source control, NOT in the published student site.
 * Editorial source banks, migrations, docs and test fixtures are never Pages assets.
 */
import {cp,mkdir,rm,stat,readdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const out=path.resolve(process.argv[2]||path.join(root,".step-public-release"));
if(out===root||out===path.parse(out).root||!path.basename(out).includes("step-public"))throw new Error("Refusing unsafe build destination");
const files=[".nojekyll","index.html","app.js","data.js","style.css","logo.svg","service-worker.js","manifest.webmanifest"];
const dirs=["audio","step-brand","step-grammar-account-preview","step-grammar-admin","step-grammar-pilot","step-grammar-student"];
const forbidden=name=>/^foundation-sentence-elements(?:[-.]|$)/.test(name);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const file of files)await cp(path.join(root,file),path.join(out,file));
for(const dir of dirs){
 const source=path.join(root,dir),target=path.join(out,dir);
 await mkdir(target,{recursive:true});
 await cp(source,target,{recursive:true,force:true,filter:sourcePath=>
  dir!=="step-grammar-student"||!forbidden(path.basename(sourcePath))});
}
const blockedFileList=["foundation-sentence-elements.html","foundation-sentence-elements.js",
 "foundation-sentence-elements.css","foundation-sentence-elements-data.js",
 "foundation-sentence-elements-mastery.js"];
for(const filename of blockedFileList)if(!forbidden(filename))throw new Error("Blocked basename predicate failed: "+filename);
for(const name of ["html","js","css","data.js","mastery.js"]){
 const file=name==="data.js"?"foundation-sentence-elements-data.js":
  name==="mastery.js"?"foundation-sentence-elements-mastery.js":"foundation-sentence-elements."+name;
 try{await stat(path.join(out,"step-grammar-student",file));throw new Error("Blocked foundation asset leaked into published site: "+file)}
 catch(e){if(e.code!=="ENOENT")throw e;}
}
for(const blocked of ["supabase","curriculum","docs","tests","scripts",".github"]){
 try{await stat(path.join(out,blocked));throw new Error("Editorial/internal directory leaked: "+blocked)}
 catch(e){if(e.code!=="ENOENT")throw e;}
}
const names=(await readdir(path.join(out,"step-grammar-student"))).filter(forbidden);
if(names.length)throw new Error("Blocked foundation files present: "+names.join(", "));
for(const needed of ["step-grammar-student/index.html","step-grammar-student/learn.html","step-grammar-admin/index.html","index.html"]){
 const f=await stat(path.join(out,needed));if(!f.isFile())throw new Error("Missing public page "+needed);
}
process.stdout.write("PASS STEP release: foundation student route excluded; only allowlisted public files packaged into "+out+"\n");
