const test=require('node:test'),assert=require('node:assert/strict'),w=require('../workbench-models.js');
test('Sorting preserves nested arrays and prototype-like JSON keys',()=>{
  const input='{"z":[{"b":2,"a":1},3],"__proto__":{"ok":true},"a":4}';
  const output=w.sortedJSON(input,false,4);
  assert.deepEqual(JSON.parse(output),JSON.parse(input));assert.deepEqual(Object.keys(JSON.parse(output)),['__proto__','a','z']);assert.equal({}.ok,undefined);
});
test('Wide JSON data produces statistics without exceeding call argument limits',()=>{const s=w.jsonStats(JSON.stringify(Array(150000).fill(0)));assert.equal(s.scalars,150000);assert.equal(s.arrays,1);});
test('Sorting rejects excessive nesting instead of locking the interface',()=>{assert.throws(()=>w.sortedJSON('['.repeat(202)+'0'+']'.repeat(202)),/depth/);});
test('Text insights handle Arabic and astral characters without counting UTF-16 halves',()=>{const s=w.textStats('تعلم الآن\n\nHello world 🙂','ar');assert.equal(s.words,4);assert.equal(s.lines,3);assert.equal(s.characters,[...'تعلم الآن\n\nHello world 🙂'].length);assert.equal(w.textStats('').minutes,0);});
test('Cleaning preserves paragraph boundaries; duplicate comparison is exact',()=>{assert.equal(w.cleanText('  a   b\r\n\r\n\r\n c  ','spaces'),'a b\n\nc');assert.equal(w.cleanText('A\nA\na\n\n','deduplicate'),'A\na\n\n');assert.throws(()=>w.cleanText('x'.repeat(200001),'spaces'),/size/);});
test('Each fingerprint algorithm enforces its own expected digest length',()=>{for(const [algorithm,n] of [['SHA-256',64],['SHA-384',96],['SHA-512',128]]){assert.equal(w.expectedDigest(' A'.trim()+'A'.repeat(n-1),algorithm),'a'.repeat(n));assert.throws(()=>w.expectedDigest('a'.repeat(n-1),algorithm));}assert.throws(()=>w.expectedDigest('a'.repeat(64),'MD5'));});
test('Calendar escapes content, folds UTF-8 safely and uses exclusive end dates',()=>{
  const plan={config:{template:'python',level:'beginner',minutes:45,days:[1,3],start:'2026-10-09',locale:'ar'},sessions:[{date:'2026-12-31',kind:'learn',minutes:45,topic:'تعلم'.repeat(60)+'\nEND:VEVENT,;'}]};
  const calendar=w.planCalendar(plan,new Date('2026-10-09T12:00:00Z'));for(const line of calendar.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
  const unfolded=calendar.replace(/\r\n /g,'');assert.match(unfolded,/DTEND;VALUE=DATE:20270101/);assert.match(unfolded,/\\nEND:VEVENT\\,\\;/);assert.equal(calendar.split('\r\nEND:VEVENT\r\n').length,2);assert.match(calendar,/DTSTAMP:20261009T120000Z/);
});
