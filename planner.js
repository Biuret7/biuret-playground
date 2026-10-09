/* Browser edition of StudyFlow's prerequisite-aware scheduler. No network or storage. */
(function(root){
  function createPlan(value,tracks){
    const track=tracks.find(t=>t.id===value.template), locale=value.locale;
    if(!track||!['en','ar'].includes(locale)||!['beginner','intermediate','advanced'].includes(value.level)
      ||!Number.isInteger(value.minutes)||value.minutes<15||value.minutes>120
      ||!Array.isArray(value.days)||!value.days.length||value.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw new Error('config');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value.start))throw new Error('date');
    let day=new Date(value.start+'T00:00:00Z');
    if(!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==value.start||day.getUTCFullYear()<2020||day.getUTCFullYear()>2100)throw new Error('date');
    const budget=value.minutes, tasks=[], placed=new Map(), workload={beginner:[60,60,20],intermediate:[40,75,25],advanced:[30,90,30]}[value.level];
    function parts(kind,total,topic,dependency,gap){
      const count=Math.ceil(total/budget);
      for(let part=0;part<count;part++){
        const id=tasks.length;
        tasks.push({id,kind,topic,minutes:Math.floor(total/count)+(part<total%count?1:0),part:part+1,parts:count,dependency,gap:part?0:gap});
        dependency=id;
      }
      return dependency;
    }
    let previous=null;
    for(const unit of track.units){
      const learned=parts('learn',workload[0],unit.title[locale],previous,0);
      previous=parts('practice',workload[1],unit.title[locale],learned,1);
      parts('review',workload[2],unit.title[locale],previous,2);
    }
    parts('project',90,track.project[locale],tasks.at(-1).id,1);
    const pending=tasks.slice(), DAY=86400000;
    for(let n=0;n<3650&&pending.length;n++,day=new Date(day.getTime()+DAY)){
      if(day.getUTCFullYear()>2100)throw new Error('schedule');
      if(!value.days.includes(day.getUTCDay()))continue;
      let capacity=budget;
      while(capacity>0){
        const task=pending.find(t=>{
          if(t.minutes>capacity)return false;
          if(t.kind==='project'&&(pending.some(s=>s.kind!=='project')||[...placed.values()].some(s=>s.time>=day.getTime())))return false;
          const dep=placed.get(t.dependency);
          return t.dependency===null||(dep&&day.getTime()>=dep.time+t.gap*DAY);
        });
        if(!task)break;
        pending.splice(pending.indexOf(task),1);placed.set(task.id,{...task,date:day.toISOString().slice(0,10),time:day.getTime()});capacity-=task.minutes;
      }
    }
    if(pending.length)throw new Error('schedule');
    return {config:{...value},project:track.project[locale],sessions:[...placed.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id).map(({kind,topic,minutes,date,part,parts})=>({kind,topic,minutes,date,part,parts}))};
  }
  if(typeof module!=='undefined')module.exports={createPlan};else root.StudyFlowPlanner={createPlan};
})(typeof window==='undefined'?{}:window);
