const test=require('node:test'),assert=require('node:assert/strict');
const {createFeedback,focusEditorLocked}=require('../playground-ui.js');
test('Language switches retain the current error, tone and recovery instruction',()=>{
  let locale='en';const ui=createFeedback(()=>locale),node={textContent:'',dataset:{}};
  ui.message(node,'Invalid JSON. Check commas.','JSON غير صحيح. راجع الفواصل.','error');
  locale='ar';ui.refresh();assert.equal(node.textContent,'JSON غير صحيح. راجع الفواصل.');assert.equal(node.dataset.tone,'error');
  locale='en';ui.refresh();assert.equal(node.textContent,'Invalid JSON. Check commas.');
});
test('Invalidating a result removes its old message and clears the old error tone',()=>{
  let locale='en';const ui=createFeedback(()=>locale),node={textContent:'',dataset:{}};
  ui.message(node,'Invalid input','مدخلات غير صالحة','error');ui.message(node);
  locale='ar';ui.refresh();assert.equal(node.textContent,'');assert.equal(node.dataset.tone,'');
  ui.message(node,'Copied','تم النسخ','success');assert.equal(node.textContent,'تم النسخ');assert.equal(node.dataset.tone,'success');
});
test('Paused focus sessions preserve their task and duration until reset or completion',()=>{
  assert.equal(focusEditorLocked({running:false,remaining:60000},1,false),false);
  assert.equal(focusEditorLocked({running:true,remaining:60000},1,false),true);
  assert.equal(focusEditorLocked({running:false,remaining:45000},1,false),true);
  assert.equal(focusEditorLocked({running:false,remaining:0},1,true),false);
});
