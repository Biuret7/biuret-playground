const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../workspace-store.js'),planner=require('../learning-planner.js'),context={window:{}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../catalog.js'),'utf8'),context);
const catalog=JSON.parse(JSON.stringify(context.window.StudyFlowCatalog));
function record(name='خطة التعلّم'){
  const config={template:'python',level:'beginner',minutes:45,days:[1,3,5],start:'2026-10-13'};
  return model.makePlan(config,name,planner.createPlan({...config,locale:'en'},catalog));
}
test('Plan overview accounts only for unchecked planned minutes and exposes the exact next session',()=>{
  const p=record(),generated=planner.restorePlan(p,'en',catalog),total=generated.sessions.reduce((n,s)=>n+s.minutes,0);
  p.completed=[0,2];const before=JSON.stringify(p),overview=model.planOverview(p,planner,catalog,'en','2026-12-31');
  assert.equal(overview.remainingMinutes,total-generated.sessions[0].minutes-generated.sessions[2].minutes);assert.equal(overview.task.index,1);assert.match(model.sessionLabel(overview.task),/Learn:.*part 2\/2/);assert.equal(JSON.stringify(p),before);
  p.completed=generated.sessions.map((s,i)=>i);const done=model.planOverview(p,planner,catalog);assert.equal(done.remainingMinutes,0);assert.equal(done.percent,100);assert.equal(done.task,undefined);
});
test('Filtering handles Arabic diacritics and retains English topic searches after language switches',()=>{
  const active=record(),done=record('Finished plan');done.completed=planner.restorePlan(done,'en',catalog).sessions.map((s,i)=>i);
  for(const locale of ['en','ar']){
    const views=[active,done].map(p=>model.planOverview(p,planner,catalog,locale));
    assert.deepEqual(model.selectPlans(views,{query:'خطة التعلم'}).map(v=>v.record.id),[active.id]);
    assert.equal(model.selectPlans(views,{query:'control flow'}).length,2);
    assert.deepEqual(model.selectPlans(views,{status:'active'}).map(v=>v.record.id),[active.id]);
    assert.deepEqual(model.selectPlans(views,{status:'completed'}).map(v=>v.record.id),[done.id]);
    assert.equal(model.selectPlans(views,{query:'no-match'}).length,0);
    assert.equal(model.selectPlans(views,{sort:'next'})[0].record.id,active.id);
  }
});
test('Renaming uses the latest saved progress and changes neither schedule nor focus records',()=>{
  const p=record('Old name');p.completed=[0,1];const current={...model.empty(),plans:[p]},before=JSON.stringify(current);
  const changed=model.renamePlan(current,p.id,' New name ','Old name');
  assert.equal(changed.plans[0].name,'New name');assert.deepEqual(changed.plans[0].completed,[0,1]);assert.deepEqual(changed.plans[0].config,p.config);assert.equal(changed.plans[0].signature,p.signature);assert.deepEqual(changed.sessions,current.sessions);assert.equal(JSON.stringify(current),before);model.validate(changed,planner,catalog);
});
test('A stale rename or invalid name never overwrites an existing plan',()=>{
  const p=record('Changed in another tab'),current={...model.empty(),plans:[p]},before=JSON.stringify(current);
  assert.throws(()=>model.renamePlan(current,p.id,'Overwrite','Previous name'),/name-conflict/);
  for(const name of ['','   ','x'.repeat(81),'bad\u0000name'])assert.throws(()=>model.renamePlan(current,p.id,name,p.name),/invalid-name/);
  assert.throws(()=>model.renamePlan(current,'missing_plan','New',p.name),/missing-plan/);assert.equal(JSON.stringify(current),before);
});
