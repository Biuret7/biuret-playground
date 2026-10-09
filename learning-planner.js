(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./planner.js'));else root.LearningPlanner=factory(root.StudyFlowPlanner);})(typeof globalThis!=='undefined'?globalThis:this,base=>{
  'use strict';
  const DAY=86400000;
  function date(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('date');const d=new Date(value+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value||d.getUTCFullYear()<2020||d.getUTCFullYear()>2100)throw Error('date');return d.getTime();}
  function text(value,max){if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f]/.test(value))throw Error('custom');return value.trim();}
  function normalize(input){
    if(!input||typeof input!=='object'||Array.isArray(input)||!Array.isArray(input.days)||input.days.length>7||new Set(input.days).size!==input.days.length)throw Error('config');
    const config={template:input.template,level:input.level,minutes:input.minutes,days:[...input.days].sort((a,b)=>a-b),start:input.start};
    if(input.locale!==undefined)config.locale=input.locale;
    if(input.deadline!==undefined&&input.deadline!==''){if(date(input.deadline)<date(input.start))throw Error('deadline');config.deadline=input.deadline;}
    if(input.template==='custom'){
      if(!input.custom||!Array.isArray(input.custom.topics)||input.custom.topics.length<1||input.custom.topics.length>8)throw Error('custom');
      const goal=text(input.custom.goal,240),topics=input.custom.topics.map(t=>text(t,100));
      if(new Set(topics.map(t=>t.normalize('NFKC').toLowerCase())).size!==topics.length)throw Error('duplicate-topics');
      config.custom={goal,topics};
    }else if(input.custom!==undefined)throw Error('custom');
    return config;
  }
  function tracks(config,catalog){if(config.template!=='custom')return catalog;return [...catalog,{id:'custom',project:{en:config.custom.goal,ar:config.custom.goal},units:config.custom.topics.map(topic=>({title:{en:topic,ar:topic}}))}];}
  function createPlan(input,catalog){const config=normalize(input);return base.createPlan(config,tracks(config,catalog));}
  function checked(indices,length){if(!Array.isArray(indices)||indices.length>length||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=length))throw Error('checks');return new Set(indices);}
  function reschedule(input,catalog,completed,from,previousDates){
    const plan=createPlan(input,catalog),anchor=date(from);if(anchor<date(plan.config.start))throw Error('from');
    const done=checked(completed,plan.sessions.length),dates=previousDates||plan.sessions.map(s=>s.date);
    if(!Array.isArray(dates)||dates.length!==plan.sessions.length||dates.some(d=>date(d)<date(plan.config.start)))throw Error('schedule');
    // Index identity always follows the original schedule, even when dates move.
    const tasks=plan.sessions.map((s,index)=>({...s,index,dependency:null,gap:0}));
    const track=tracks(plan.config,catalog).find(t=>t.id===plan.config.template);let previous=null;
    for(const unit of track.units){
      const topic=unit.title[plan.config.locale];
      const group=kind=>tasks.filter(t=>t.kind===kind&&t.topic===topic).sort((a,b)=>a.part-b.part);
      let lastLearn=previous;for(const t of group('learn')){t.dependency=lastLearn;lastLearn=t.index;}
      let lastPractice=lastLearn;for(const t of group('practice')){t.dependency=lastPractice;t.gap=t.part===1?1:0;lastPractice=t.index;}
      let lastReview=lastPractice;for(const t of group('review')){t.dependency=lastReview;t.gap=t.part===1?2:0;lastReview=t.index;}
      previous=lastPractice;
    }
    let last=tasks.filter(t=>t.kind==='review').at(-1)?.index;
    for(const t of tasks.filter(t=>t.kind==='project')){t.dependency=last;t.gap=t.part===1?1:0;last=t.index;}
    const placed=new Map([...done].map(i=>[i,{...tasks[i],date:dates[i],time:Math.min(date(dates[i]),anchor)}]));
    const pending=tasks.filter(t=>!done.has(t.index));
    for(let count=0,day=anchor;count<3650&&pending.length;count++,day+=DAY){
      if(new Date(day).getUTCFullYear()>2100)throw Error('schedule');if(!plan.config.days.includes(new Date(day).getUTCDay()))continue;
      let capacity=plan.config.minutes;
      while(capacity>0){const task=pending.find(t=>{
        if(t.minutes>capacity)return false;
        if(t.kind==='project'&&(pending.some(s=>s.kind!=='project')||[...placed.values()].some(s=>s.kind!=='project'&&s.time>=day)))return false;
        const dep=placed.get(t.dependency);return t.dependency===null||(dep&&day>=dep.time+t.gap*DAY);
      });if(!task)break;pending.splice(pending.indexOf(task),1);placed.set(task.index,{...task,date:new Date(day).toISOString().slice(0,10),time:day});capacity-=task.minutes;}
    }
    if(pending.length)throw Error('schedule');
    const metadata={from,completed:[...done].sort((a,b)=>a-b),kept:[...done].sort((a,b)=>a-b).map(index=>({index,date:dates[index]}))};
    return {plan:{...plan,sessions:plan.sessions.map((s,i)=>({...s,date:placed.get(i).date}))},metadata};
  }
  function restorePlan(record,locale,catalog){
    const input={...record.config,locale};if(!record.schedule)return createPlan(input,catalog);
    const original=createPlan(input,catalog),meta=record.schedule,done=checked(meta.completed,original.sessions.length);
    if(!Array.isArray(meta.kept)||meta.kept.length!==done.size||new Set(meta.kept.map(s=>s.index)).size!==done.size)throw Error('schedule');
    const dates=original.sessions.map(s=>s.date);for(const kept of meta.kept){if(!kept||!done.has(kept.index)||date(kept.date)<date(input.start))throw Error('schedule');dates[kept.index]=kept.date;}
    return reschedule(input,catalog,meta.completed,meta.from,dates).plan;
  }
  function deadline(plan,completed=[]){const done=checked(completed,plan.sessions.length),remaining=plan.sessions.filter((s,i)=>!done.has(i)),finish=remaining.map(s=>s.date).sort().at(-1)||null,target=plan.config.deadline||null;return {target,finish,complete:!remaining.length,late:Boolean(target&&finish&&finish>target),remainingMinutes:remaining.reduce((n,s)=>n+s.minutes,0)};}
  return {normalize,createPlan,reschedule,restorePlan,deadline,date};
});
