const test=require('node:test'),assert=require('node:assert/strict');
const {compareText,inspectURL}=require('../inspection-models.js');
test('line comparison reconstructs both versions including duplicates and empty input',()=>{
  for(const [before,after]of [['a\na\nb','a\nb\na'],['','x'],['x',''],['a\r\nb','a\nb'],['<script>\nשלום','<script>\nمرحبا']]){
    const r=compareText(before,after);
    assert.equal(r.rows.filter(x=>x.kind!=='added').map(x=>x.text).join('\n'),before.replace(/\r\n?/g,'\n'));
    assert.equal(r.rows.filter(x=>x.kind!=='removed').map(x=>x.text).join('\n'),after.replace(/\r\n?/g,'\n'));
  }
  assert.equal(compareText('same','same').added,0);
  assert.throws(()=>compareText('x\n'.repeat(151),''));
  assert.throws(()=>compareText('x'.repeat(25001),''));
});
test('URL inspection distinguishes the actual host and exposes structural limits without a safety claim',()=>{
  const r=inspectURL('https://trusted.example@training.example:8443/path?a=1&a=2#section');
  assert.equal(r.host,'training.example');assert.equal(r.credentials,true);assert.equal(r.query.length,2);assert.ok(r.flags.includes('userinfo'));
  assert.equal(JSON.stringify(r).includes('trusted.example'),false);
  assert.ok(inspectURL('http://127.0.0.1/').flags.includes('ip'));
  assert.ok(inspectURL('https://مثال.example/').flags.includes('idn'));
  for(const bad of ['javascript:alert(1)','file:///secret','//example.test','https://good.example\\@evil.test','https://example.test/\nx'])assert.throws(()=>inspectURL(bad));
});
