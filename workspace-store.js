(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WorkspaceStore=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const KEY='biuret-playground-workspace-v1',FORMAT='biuret-playground-workspace',VERSION=1;
  const tools=['studyflow','focus','json','hash','text'];
  const fail=()=>{throw Error('invalid-backup');};
  const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
  const str=(x,max)=>typeof x==='string'&&x.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x);
  const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{8,80}$/.test(x);
  const time=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(x)&&Number.isFinite(Date.parse(x))&&Date.parse(x)>=Date.UTC(2020,0,1)&&Date.parse(x)<=Date.now()+300000;
  function empty(){return {format:FORMAT,version:VERSION,plans:[],sessions:[],favorites:[],goal:4};}
  function validate(value,planner,catalog){
    if(!object(value)||value.format!==FORMAT||value.version!==VERSION||!Array.isArray(value.plans)||value.plans.length>20||!Array.isArray(value.sessions)||value.sessions.length>1000||!Array.isArray(value.favorites)||value.favorites.length>5||!Number.isInteger(value.goal)||value.goal<1||value.goal>20)fail();
    const plans=value.plans.map(p=>{
      if(!object(p)||!id(p.id)||!str(p.name,80)||!p.name.trim()||!time(p.createdAt)||!time(p.updatedAt)||!object(p.config)||p.engine!==1||!Array.isArray(p.completed))fail();
      const c=p.config;
      if(!Array.isArray(c.days)||c.days.length>7||new Set(c.days).size!==c.days.length)fail();
      const config={template:c.template,level:c.level,minutes:c.minutes,days:[...c.days].sort((a,b)=>a-b),start:c.start};
      let generated;try{generated=planner.createPlan({...config,locale:'en'},catalog);}catch{fail();}
      const signature=generated.sessions.map(s=>[s.kind,s.date,s.minutes,s.part,s.parts].join(':')).join('|');
      if(p.signature!==signature||p.completed.length>generated.sessions.length||p.completed.some(i=>!Number.isInteger(i)||i<0||i>=generated.sessions.length)||new Set(p.completed).size!==p.completed.length)fail();
      return {id:p.id,name:p.name.trim(),engine:1,signature,config,completed:[...p.completed].sort((a,b)=>a-b),createdAt:p.createdAt,updatedAt:p.updatedAt};
    });
    const sessions=value.sessions.map(s=>{if(!object(s)||!id(s.id)||!str(s.task,160)||!Number.isInteger(s.minutes)||s.minutes<1||s.minutes>120||!time(s.at))fail();return {id:s.id,task:s.task,minutes:s.minutes,at:s.at};});
    if(new Set(plans.map(p=>p.id)).size!==plans.length||new Set(sessions.map(s=>s.id)).size!==sessions.length||new Set(value.favorites).size!==value.favorites.length||value.favorites.some(t=>!tools.includes(t)))fail();
    return {...empty(),plans,sessions,favorites:[...value.favorites],goal:value.goal};
  }
  function parse(text,planner,catalog){if(typeof text!=='string'||new TextEncoder().encode(text).length>1048576)fail();let value;try{value=JSON.parse(text);}catch{fail();}return validate(value,planner,catalog);}
  function merge(current,incoming){
    const combined=(a,b)=>{const map=new Map(a.map(x=>[x.id,x]));for(const x of b){const old=map.get(x.id);if(!old)map.set(x.id,x);else if('completed' in x){if(old.signature!==x.signature)throw Error('conflict');map.set(x.id,{...old,completed:[...new Set([...old.completed,...x.completed])].sort((a,b)=>a-b)});}else if(JSON.stringify(old)!==JSON.stringify(x))throw Error('conflict');}return [...map.values()];};
    return {...current,plans:combined(current.plans,incoming.plans),sessions:combined(current.sessions,incoming.sessions),favorites:[...new Set([...current.favorites,...incoming.favorites])]};
  }
  function connect(storage,planner,catalog){
    let issue=null;
    function read(){try{const raw=storage.getItem(KEY);issue=null;return raw===null?null:parse(raw,planner,catalog);}catch{issue='unavailable-or-corrupt';return null;}}
    function write(next){const checked=validate(next,planner,catalog);storage.setItem(KEY,JSON.stringify(checked));issue=null;return checked;}
    return {read,get issue(){return issue;},enable(){const current=read();if(issue)throw Error(issue);return current||write(empty());},update(change){const current=read();if(issue||!current)throw Error(issue||'saving-disabled');return write(change(current));},restore(incoming){return this.update(current=>merge(current,validate(incoming,planner,catalog)));},clear(){storage.removeItem(KEY);issue=null;}};
  }
  function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
  function nextSessions(plan,completed,today=localDay()){
    const remaining=plan.sessions.map((s,i)=>({...s,index:i})).filter(s=>!completed.includes(s.index));
    return {overdue:remaining.filter(s=>s.date<today),today:remaining.filter(s=>s.date===today),next:remaining.find(s=>s.date>today),complete:remaining.length===0};
  }
  function summary(sessions,now=new Date()){
    const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6);const day=localDay(now);
    const week=sessions.filter(s=>new Date(s.at)>=start&&new Date(s.at)<=now),today=week.filter(s=>localDay(new Date(s.at))===day);
    return {today:today.length,todayMinutes:today.reduce((n,s)=>n+s.minutes,0),week:week.length,weekMinutes:week.reduce((n,s)=>n+s.minutes,0)};
  }
  function makePlan(config,name,generated,existing){const stamp=new Date().toISOString();return {id:existing?.id||crypto.randomUUID(),name:name.trim(),engine:1,signature:generated.sessions.map(s=>[s.kind,s.date,s.minutes,s.part,s.parts].join(':')).join('|'),config,completed:existing?.completed||[],createdAt:existing?.createdAt||stamp,updatedAt:stamp};}
  return {KEY,FORMAT,VERSION,tools,empty,validate,parse,merge,connect,localDay,nextSessions,summary,makePlan};
});
