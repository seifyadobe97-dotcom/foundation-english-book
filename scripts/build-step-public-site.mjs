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
const stageBundles=["clarity-future-06.js","clarity-arrangements-07.js","clarity-time-08.js","clarity-present-perfect-09.js","clarity-perfect-continuous-10.js","clarity-perfect-continuous-extra.js","clarity-perfect-continuous-finish.js","clarity-past-perfect-11.js","clarity-past-perfect-continuous-12.js","clarity-future-perfect-combo-13.js","clarity-used-to-14.js","clarity-modals-15.js","clarity-deduction-16.js","clarity-passive-17.js","clarity-modal-passive-18.js","clarity-pronouns-19.js","clarity-articles-20.js","clarity-degree-21.js","clarity-adverbs-22.js","clarity-comparatives-23.js","clarity-prepositions-24.js","clarity-collocations-25.js","clarity-word-formation-26.js","clarity-gerunds-27.js","clarity-infinitives-28.js","clarity-bare-29.js","clarity-causatives-30.js"];
const lessonPagePath=path.join(out,"step-grammar-student","lesson.html");
let lessonPageHtml=await readFile(lessonPagePath,"utf8");
const stageAnchor=' <script src="lesson-stage-clarity.js"></script>';
if(!lessonPageHtml.includes(stageAnchor))throw new Error("Missing original stage explanation script");
const stageTags=stageBundles.map(name=>' <script src="'+name+'"></script>').join("\n");
lessonPageHtml=lessonPageHtml.replace(stageAnchor,stageAnchor+"\n"+stageTags);
await writeFile(lessonPagePath,lessonPageHtml,"utf8");
for(const filename of stageBundles)await stat(path.join(out,"step-grammar-student",filename));
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
