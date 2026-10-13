const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const planner=require('../learning-planner.js'),store=require('../workspace-store.js'),context={window:{}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../catalog.js'),'utf8'),context);
const catalog=JSON.parse(JSON.stringify(context.window.StudyFlowCatalog));
function fixture(){
  const config={template:'python',level:'beginner',minutes:45,days:[1,3,5],start:'2026-10-13'};
  const generated=planner.createPlan({...config,locale:'en'},catalog),plan=store.makePlan(config,'My learning plan',generated);
  return {...store.empty(),plans:[plan]};
}
test('A focus handoff uses the saved session task and time without mutating progress or logging focus',()=>{
  const data=fixture(),before=JSON.stringify(data),id=data.plans[0].id;
  const chosen=store.focusSession(data,id,'0',planner,catalog,'en');
  assert.equal(chosen.planName,'My learning plan');assert.equal(chosen.minutes,30);assert.match(chosen.task,/Learn:.*part 1\/2/);
  assert.equal(JSON.stringify(data),before);assert.equal(data.sessions.length,0);assert.deepEqual(data.plans[0].completed,[]);
});
test('Language changes select the same saved session and preserve custom topics',()=>{
  const data=fixture(),record=data.plans[0],id=record.id;
  const en=store.focusSession(data,id,'1',planner,catalog,'en'),ar=store.focusSession(data,id,'1',planner,catalog,'ar');
  assert.deepEqual([en.index,en.minutes,en.session.date,en.session.kind],[ar.index,ar.minutes,ar.session.date,ar.session.kind]);assert.match(ar.task,/تعلّم:/);
  const config={...record.config,template:'custom',custom:{goal:'Build a sample report',topics:['موضوع خاص / My own topic']}};
  data.plans=[store.makePlan(config,'Custom plan',planner.createPlan({...config,locale:'en'},catalog))];
  assert.ok(store.focusSession(data,data.plans[0].id,'0',planner,catalog,'ar').task.includes(config.custom.topics[0]));
});
test('Malformed or missing references never resolve an unrelated plan or session',()=>{
  const data=fixture(),id=data.plans[0].id;
  for(const index of [null,'-1','01','1.5','1e1',' 1','9999','10000','../0'])assert.throws(()=>store.focusSession(data,id,index,planner,catalog));
  for(const id of [null,'../secret','missing_plan'])assert.throws(()=>store.focusSession(data,id,'0',planner,catalog));
  assert.throws(()=>store.focusSession(null,data.plans[0].id,'0',planner,catalog));
});
test('Completed sessions and tampered saved schedules cannot be offered as an unfinished focus task',()=>{
  const data=fixture(),id=data.plans[0].id;data.plans[0].completed=[0];
  assert.throws(()=>store.focusSession(data,id,'0',planner,catalog),/completed-session/);
  assert.equal(store.focusSession(data,id,'1',planner,catalog).index,1);
  data.plans[0].config.minutes=120;
  assert.throws(()=>store.focusSession(data,id,'1',planner,catalog));
});
test('Rescheduled focus sessions use the current saved date and keep checked work unchanged',()=>{
  const data=fixture(),record=data.plans[0];record.completed=[0];record.engine=2;
  record.schedule=planner.reschedule({...record.config,locale:'en'},catalog,[0],'2026-11-02').metadata;
  const before=JSON.stringify(data),chosen=store.focusSession(data,record.id,'1',planner,catalog);
  assert.ok(chosen.session.date>='2026-11-02');assert.equal(JSON.stringify(data),before);
});
