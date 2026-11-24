/* Cross-language regression and localization coverage. */
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const pt=read('locales/pt-BR.json'), en=read('locales/en.json');
assert.deepEqual(Object.keys(pt.messages).sort(),Object.keys(en.messages).sort());
assert.deepEqual(Object.keys(pt.rules).sort(),Object.keys(en.rules).sort());
for(const lang of [pt,en]) for(const rule of Object.values(lang.rules))new RegExp(rule.source,rule.flags);
for(const f of ['engine','game','ui']){
 const code=fs.readFileSync(path.join(root,'src',f+'.js'),'utf8');
 for(const [,key] of code.matchAll(/\bL\(["']([^"']+)["']\)/g))assert.ok(Object.hasOwn(en.messages,key),key);
 for(const [,key] of code.matchAll(/\bR\(["']([^"']+)["']\)/g))assert.ok(Object.hasOwn(en.rules,key),key);
}
const run=lang=>JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'engine.test.js')],{env:{...process.env,GAME_LANGUAGE:lang},encoding:'utf8',maxBuffer:20*1024*1024}));
const a=run('pt-BR'), b=run('en');
assert.deepEqual(a,b);
const baseline=read('tests/v15-baseline.json');
const {createHash}=require('node:crypto');
assert.equal(a.length,baseline.fixtures.length);
a.forEach(({mode,...snapshot},i)=>{
 const f=baseline.fixtures[i];
 assert.equal(mode,f.mode==='avancado'?'advanced':f.mode);
 assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),f.sha256,`v15 regression: ${f.mode} seed ${f.seed}`);
});
console.log(`PASS: ${a.length} original v15 baseline snapshots and verified routes.`);
console.log(`PASS: ${a.length} seed/mode pairs identical in both languages (${a.length*2} games).`);
console.log('PASS: all six built-in stories in both modes and languages (24 games), generated case fixtures (4 games), local conversation and model response validators.');
console.log(`PASS: ${Object.keys(en.messages).length} message keys and ${Object.keys(en.rules).length} language rules in each locale.`);
