(() => {
  const $=id=>document.getElementById(id),tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
  const model=WorkspaceStore;
  let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('unavailable');},setItem(){throw Error('unavailable');}};}
  const store=model.connect(storage,LearningPlanner,StudyFlowCatalog);
  window.PlaygroundWorkspace=store;
  if(document.body.dataset.tool==='workspace'){const current=document.querySelector('.top nav a[href="workspace.html"]');current?.setAttribute('aria-current','page');}
  function element(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
  function action(text,handler,cls='secondary'){const b=element('button',text,cls);b.type='button';b.addEventListener('click',handler);return b;}
  function link(text,href,cls='secondary'){const a=element('a',text,cls);a.href=href;return a;}
  const bar=element('section',undefined,'storage-bar');bar.setAttribute('aria-label',tr('Device saving','الحفظ على الجهاز'));
  const label=element('div'),heading=element('strong'),description=element('p',undefined,'small muted'),actions=element('div',undefined,'tool-actions'),message=element('p',undefined,'small');message.setAttribute('role','status');label.append(heading,description);bar.append(label,actions,message);
  if(document.body.dataset.tool!=='software')document.querySelector('main').prepend(bar);
  function notify(){document.dispatchEvent(new Event('playground:workspace'));}
  function error(){message.textContent=tr('Could not save. Existing data has not been replaced. Download a backup if available, or try another browser.','تعذّر الحفظ. لم تُستبدل بياناتك السابقة. نزّل نسخة احتياطية إن أمكن أو جرّب متصفحاً آخر.');}
  function renderStorage(){
    bar.setAttribute('aria-label',tr('Device saving','الحفظ على الجهاز'));
    const saved=store.read();bar.dataset.enabled=String(Boolean(saved));heading.textContent=saved?tr('Saved on this device','محفوظ على هذا الجهاز'):tr('Device saving is off','الحفظ على الجهاز متوقف');description.textContent=tr('Optional: save plans, completed focus sessions and favorites in this browser. No account or automatic sync. Browser cleanup can erase them.','اختياري: احفظ الخطط وجلسات التركيز المكتملة والمفضلة في هذا المتصفح. دون حساب أو مزامنة تلقائية. مسح بيانات المتصفح قد يحذفها.');actions.replaceChildren();
    if(saved)actions.append(document.body.dataset.tool==='workspace'?link(tr('Manage storage ↓','إدارة التخزين ↓'),'#backup'):link(tr('My Work ↗','أعمالي ↗'),'workspace.html'));
    else{actions.append(action(tr('Enable device saving','فعّل الحفظ على الجهاز'),()=>{try{store.enable();message.textContent=tr('Enabled. Save a plan explicitly; future completed focus sessions save automatically.','تم التفعيل. احفظ خطتك بالزر؛ تُحفظ جلسات التركيز المكتملة التالية تلقائياً.');renderStorage();notify();}catch{error();}},'primary'));}
    if(store.issue){actions.replaceChildren(link(tr('Recovery options','خيارات الاستعادة'),'workspace.html#backup'));message.textContent=tr('Saved data is unreadable or browser storage is blocked. Nothing was overwritten.','البيانات المحفوظة غير قابلة للقراءة أو التخزين محظور. لم نستبدل أي بيانات.');}
  }
  function favorites(){
    const saved=store.read();document.querySelectorAll('[data-favorite]').forEach(b=>{const on=saved?.favorites.includes(b.dataset.favorite)||false;b.setAttribute('aria-pressed',String(on));b.textContent=on?tr('★ Saved tool','★ أداة مفضلة'):tr('☆ Save tool','☆ أضف للمفضلة');b.disabled=!saved;b.title=saved?'':tr('Enable device saving first','فعّل الحفظ على الجهاز أولاً');});
  }
  document.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>{try{store.update(s=>({...s,favorites:s.favorites.includes(b.dataset.favorite)?s.favorites.filter(x=>x!==b.dataset.favorite):[...s.favorites,b.dataset.favorite]}));favorites();notify();}catch{error();}}));
  let candidate=null,importRevision=0;
  function dashboard(){
    if(!$('saved-plans'))return;
    const data=store.read()||model.empty(),locale=document.documentElement.lang;
    const sum=model.summary(data.sessions);
    $('workspace-title').textContent=tr('My Work','أعمالي');document.title=tr('My Work — Biuret Playground','أعمالي — Biuret Playground');
    $('workspace-stats').replaceChildren();
    for(const [value,text] of [[data.plans.length,tr('Saved plans','خطط محفوظة')],[sum.todayMinutes,tr('Focus minutes today','دقائق التركيز اليوم')],[sum.weekMinutes,tr('Focus minutes · last 7 days','دقائق التركيز · آخر 7 أيام')],[data.favorites.length,tr('Favorite tools','أدوات مفضلة')]]){const n=element('div');n.append(element('strong',new Intl.NumberFormat(locale).format(value)),element('span',text));$('workspace-stats').append(n);}
    $('saved-plans').replaceChildren();$('plans-empty').hidden=data.plans.length>0;
    for(const p of [...data.plans].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))){const generated=LearningPlanner.restorePlan(p,locale,StudyFlowCatalog),next=model.nextSessions(generated,p.completed);const card=element('article',undefined,'saved-plan');card.append(element('h3',p.name),element('p',`${p.completed.length} / ${generated.sessions.length} · `+tr('sessions checked','جلسة محددة كمنجزة'),'small muted'));const progress=element('progress');progress.max=generated.sessions.length;progress.value=p.completed.length;progress.setAttribute('aria-label',tr('Self-reported progress','التقدم المسجل ذاتياً'));card.append(progress);
      let task=next.overdue[0]||next.today[0]||next.next;
      const note=next.complete?tr('All sessions checked. Reflect on what you built.','حدّدت جميع الجلسات كمنجزة. راجع ما بنيته.'):next.overdue.length?tr('Continue an earlier unfinished session first.','تابع جلسة سابقة غير مكتملة أولاً.'):next.today.length?tr('Your next step today','خطوتك التالية اليوم'):tr('Your next scheduled session','جلستك التالية المجدولة');card.append(element('strong',note,'next-label'));
      if(task)card.append(element('p',task.topic),element('p',task.date+tr(` · ${task.minutes} min`,` · ${task.minutes} دقيقة`),'small muted'));
      const deadline=LearningPlanner.deadline(generated,p.completed);if(deadline.target)card.append(element('p',tr('Target: ','الموعد: ')+deadline.target+' · '+(deadline.complete?tr('All checked','كل الجلسات محددة كمنجزة'):deadline.late?tr('Adjust routine or target','عدّل الروتين أو الموعد'):tr('Routine fits target','الروتين يناسب الموعد')),'small deadline-note'));card.append(link(tr('Continue plan ↗','تابع الخطة ↗'),`studyflow.html?plan=${encodeURIComponent(p.id)}#planner`,'primary'));$('saved-plans').append(card);
    }
    const names={studyflow:['StudyFlow','منظّم التعلم'],focus:['Focus Room','مساحة التركيز'],json:['JSON Studio','استوديو JSON'],hash:['File Fingerprint','بصمة الملفات'],text:['Text Studio','استوديو النصوص']};
    $('favorite-tools').replaceChildren();$('favorites-empty').hidden=data.favorites.length>0;for(const id of data.favorites)$('favorite-tools').append(link(names[id][locale==='ar'?1:0]+' ↗',id+'.html'));
    $('backup-export').disabled=!store.read();$('backup-preview').disabled=!store.read();$('backup-file').disabled=!store.read();$('backup-apply').disabled=!candidate||!store.read();$('workspace-clear').disabled=!store.read()&&!store.issue;
  }
  if($('backup-export')){
    $('backup-export').addEventListener('click',()=>{const data=store.read();if(!data)return;const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=link('','');a.href=url;a.download='biuret-playground-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('backup-status').textContent=tr('Backup downloaded. Keep it private; it includes plan names and focus task labels.','نُزّلت النسخة. احتفظ بها بخصوصية؛ تتضمن أسماء الخطط وعناوين مهام التركيز.');});
    const invalidate=()=>{importRevision++;candidate=null;$('backup-apply').disabled=true;$('backup-review').textContent='';};
    $('backup-input').addEventListener('input',invalidate);
    $('backup-file').addEventListener('change',async()=>{invalidate();const started=importRevision,file=$('backup-file').files[0];if(!file)return;if(file.size>1048576){$('backup-status').textContent=tr('Backup exceeds 1 MiB.','تتجاوز النسخة 1 MiB.');return;}try{const text=await file.text();if(started!==importRevision)return;$('backup-input').value=text;preview();}catch{if(started===importRevision)$('backup-status').textContent=tr('Could not read this file.','تعذرت قراءة الملف.');}});
    function preview(){invalidate();try{candidate=model.parse($('backup-input').value,LearningPlanner,StudyFlowCatalog);const merged=model.merge(store.read()||model.empty(),candidate);model.validate(merged,LearningPlanner,StudyFlowCatalog);$('backup-review').textContent=tr(`Valid backup: ${candidate.plans.length} plans, ${candidate.sessions.length} sessions, ${candidate.favorites.length} favorites. Restore merges into existing data; matching plans keep both sets of completed checks and their existing saved schedule.`, `نسخة صالحة: ${candidate.plans.length} خطة، ${candidate.sessions.length} جلسة، ${candidate.favorites.length} أداة مفضلة. الاستعادة تدمج البيانات؛ تحتفظ الخطط المطابقة بعلامات الإنجاز من النسختين وجدولها المحفوظ الحالي.`);$('backup-apply').disabled=!store.read();$('backup-status').textContent='';}catch{candidate=null;$('backup-status').textContent=tr('Invalid, unsupported or conflicting backup. Your saved work is unchanged.','نسخة غير صالحة أو غير مدعومة أو متعارضة. أعمالك المحفوظة لم تتغير.');}}
    $('backup-preview').addEventListener('click',preview);
    $('backup-apply').addEventListener('click',()=>{if(!candidate)return;try{store.restore(candidate);invalidate();$('backup-status').textContent=tr('Restored and merged. Your saved work is ready.','تمت الاستعادة والدمج. أعمالك المحفوظة جاهزة.');notify();}catch{$('backup-status').textContent=tr('Could not restore. Existing data is unchanged; check storage space or backup limits.','تعذرت الاستعادة. البيانات السابقة لم تتغير؛ تحقق من مساحة التخزين أو حدود النسخة.');}});
    $('workspace-clear').addEventListener('click',()=>{$('clear-dialog').showModal();});
    $('clear-cancel').addEventListener('click',()=>$('clear-dialog').close());
    $('clear-confirm').addEventListener('click',()=>{try{store.clear();$('clear-dialog').close();invalidate();$('backup-input').value='';message.textContent=tr('Device saving disabled and saved work deleted. Downloaded backups are unaffected.','توقف الحفظ وحُذفت الأعمال المحفوظة. النسخ المنزلة لم تتغير.');renderStorage();notify();}catch{error();}});
  }
  document.addEventListener('playground:language',()=>{message.textContent='';if($('backup-status')){$('backup-status').textContent='';$('backup-review').textContent='';candidate=null;importRevision++;}renderStorage();favorites();dashboard();});
  document.addEventListener('playground:workspace',()=>{favorites();dashboard();});
  window.addEventListener('storage',e=>{if(e.key===model.KEY||e.key===null){renderStorage();notify();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)dashboard();});
  renderStorage();favorites();dashboard();
})();
