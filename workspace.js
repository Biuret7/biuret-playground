(() => {
  const feedback=PlaygroundUI.message;
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
  function error(){feedback(message,'Could not save. Existing data has not been replaced. Download a backup if available, or try another browser.','تعذّر الحفظ. لم تُستبدل بياناتك السابقة. نزّل نسخة احتياطية إن أمكن أو جرّب متصفحاً آخر.');}
  function renderStorage(){
    bar.setAttribute('aria-label',tr('Device saving','الحفظ على الجهاز'));
    const saved=store.read();bar.dataset.enabled=String(Boolean(saved));heading.textContent=saved?tr('Saved on this device','محفوظ على هذا الجهاز'):tr('Device saving is off','الحفظ على الجهاز متوقف');description.textContent=tr('Optional: save plans, completed focus sessions and favorites in this browser. No account or automatic sync. Browser cleanup can erase them.','اختياري: احفظ الخطط وجلسات التركيز المكتملة والمفضلة في هذا المتصفح. دون حساب أو مزامنة تلقائية. مسح بيانات المتصفح قد يحذفها.');actions.replaceChildren();
    if(saved)actions.append(document.body.dataset.tool==='workspace'?link(tr('Manage storage ↓','إدارة التخزين ↓'),'#backup'):link(tr('My Work ↗','أعمالي ↗'),'workspace.html'));
    else{actions.append(action(tr('Enable device saving','فعّل الحفظ على الجهاز'),()=>{try{store.enable();feedback(message,'Enabled. Save a plan explicitly; future completed focus sessions save automatically.','تم التفعيل. احفظ خطتك بالزر؛ تُحفظ جلسات التركيز المكتملة التالية تلقائياً.');renderStorage();notify();}catch{error();}},'primary'));}
    if(store.issue){actions.replaceChildren(link(tr('Recovery options','خيارات الاستعادة'),'workspace.html#backup'));feedback(message,'Saved data is unreadable or browser storage is blocked. Nothing was overwritten.','البيانات المحفوظة غير قابلة للقراءة أو التخزين محظور. لم نستبدل أي بيانات.');}
  }
  function favorites(){
    const saved=store.read();document.querySelectorAll('[data-favorite]').forEach(b=>{
      const on=saved?.favorites.includes(b.dataset.favorite)||false;b.setAttribute('aria-pressed',String(on));b.disabled=!saved;
      if(b.dataset.compactFavorite==='true'){
        const name=b.closest('article').querySelector('h3').textContent;
        const label=!saved?tr('Enable device saving to favorite: ','فعّل الحفظ لإضافة الأداة للمفضلة: ')+name:(on?tr('Remove from favorites: ','أزل من المفضلة: '):tr('Save to favorites: ','أضف للمفضلة: '))+name;
        b.setAttribute('aria-label',label);b.title=label;
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill',on?'currentColor':'none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('aria-hidden','true');path.setAttribute('d','m12 3 2.8 5.7 6.3.9-4.55 4.44 1.08 6.26L12 17.35l-5.63 2.95 1.08-6.26L2.9 9.6l6.3-.9L12 3z');svg.append(path);b.replaceChildren(svg);
      }else{b.textContent=on?tr('★ Saved tool','★ أداة مفضلة'):tr('☆ Save tool','☆ أضف للمفضلة');b.title=saved?'':tr('Enable device saving first','فعّل الحفظ على الجهاز أولاً');}
    });
  }
  document.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>{try{store.update(s=>({...s,favorites:s.favorites.includes(b.dataset.favorite)?s.favorites.filter(x=>x!==b.dataset.favorite):[...s.favorites,b.dataset.favorite]}));favorites();notify();}catch{error();}}));
  let candidate=null,importRevision=0,renderBackup=()=>{};
  let editingPlan=null;
  function editPlan(record){
    editingPlan={id:record.id,name:record.name};
    $('rename-plan-name').value=record.name;feedback($('rename-plan-status'));
    $('rename-plan-dialog').showModal();$('rename-plan-name').focus();$('rename-plan-name').select();
  }
  function dashboard(){
    if(!$('saved-plans'))return;
    const current=store.read(),unavailable=Boolean(store.issue),data=current||model.empty(),locale=document.documentElement.lang;
    const number=value=>new Intl.NumberFormat(locale).format(value);
    const date=value=>new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(value+'T12:00:00'));
    const sum=model.summary(data.sessions);
    feedback($('workspace-title'),'My Work','أعمالي');document.title=tr('My Work — Biuret Playground','أعمالي — Biuret Playground');
    $('workspace-stats').replaceChildren();
    for(const [value,text] of [[data.plans.length,tr('Saved plans','خطط محفوظة')],[sum.todayMinutes,tr('Focus minutes today','دقائق التركيز اليوم')],[sum.weekMinutes,tr('Focus minutes · last 7 days','دقائق التركيز · آخر 7 أيام')],[data.favorites.length,tr('Favorite tools','أدوات مفضلة')]]){const n=element('div');n.append(element('strong',unavailable?'—':number(value)),element('span',text));$('workspace-stats').append(n);}
    const overviews=data.plans.map(p=>model.planOverview(p,LearningPlanner,StudyFlowCatalog,locale));
    const selected=model.selectPlans(overviews,{query:$('plan-search').value,status:$('plan-filter').value,sort:$('plan-sort').value,locale});
    for(const id of ['plan-search','plan-filter','plan-sort'])$(id).disabled=unavailable||!data.plans.length;
    $('plans-unavailable').hidden=!unavailable;$('plans-empty').hidden=unavailable||data.plans.length>0;
    $('plans-no-match').hidden=unavailable||!data.plans.length||selected.length>0;
    feedback($('plan-results-count'),unavailable?'Saved plan count is unavailable.':`${selected.length} of ${data.plans.length} plans`,unavailable?'عدد الخطط المحفوظة غير متاح.':`${number(selected.length)} من ${number(data.plans.length)} خطة`);
    $('saved-plans').replaceChildren();
    for(const overview of selected){
      const {record:p,generated,next,task,remainingMinutes,percent}=overview;
      const card=element('article',undefined,'saved-plan'),head=element('div',undefined,'saved-plan-head'),title=element('h3',p.name);
      title.dir='auto';
      const rename=action('',()=>editPlan(p),'plan-rename');
      rename.dataset.renamePlan=p.id;rename.setAttribute('aria-label',tr('Rename plan: ','غيّر اسم الخطة: ')+p.name);rename.title=tr('Rename plan','غيّر اسم الخطة');
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('width','18');icon.setAttribute('height','18');icon.setAttribute('fill','none');icon.setAttribute('stroke','currentColor');icon.setAttribute('stroke-width','1.5');icon.setAttribute('aria-hidden','true');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M4 17v3h3L20 7l-3-3L4 17zm10-10 3 3M4 20h16');icon.append(path);rename.append(icon);head.append(title,rename);card.append(head);
      const state=element('span',next.complete?tr('Completed','مكتملة'):p.completed.length?tr('In progress','قيد التعلم'):tr('Ready to start','جاهزة للبدء'),'plan-state');state.dataset.complete=String(next.complete);card.append(state);
      card.append(element('p',`${number(p.completed.length)} / ${number(generated.sessions.length)} · `+tr('sessions checked','جلسة محددة كمنجزة')+` · ${number(percent)}%`,'small muted'));
      const progress=element('progress');progress.max=generated.sessions.length;progress.value=p.completed.length;progress.setAttribute('aria-label',tr('Self-reported progress','التقدم المسجل ذاتياً'));card.append(progress);
      card.append(element('p',tr(`${number(remainingMinutes)} min remaining in the plan`,`${number(remainingMinutes)} دقيقة متبقية في الخطة`),'small planned-effort'));
      const note=next.complete?tr('All sessions checked. Reflect on what you built.','حدّدت جميع الجلسات كمنجزة. راجع ما بنيته.'):next.overdue.length?tr('Continue an earlier unfinished session first.','تابع جلسة سابقة غير مكتملة أولاً.'):next.today.length?tr('Your next step today','خطوتك التالية اليوم'):tr('Your next scheduled session','جلستك التالية المجدولة');card.append(element('strong',note,'next-label'));
      if(task){const label=element('p',model.sessionLabel(task,locale));label.dir='auto';card.append(label,element('p',date(task.date)+tr(` · ${number(task.minutes)} min`,` · ${number(task.minutes)} دقيقة`),'small muted'));}
      const deadline=LearningPlanner.deadline(generated,p.completed);if(deadline.target)card.append(element('p',tr('Target: ','الموعد: ')+date(deadline.target)+' · '+(deadline.complete?tr('All checked','كل الجلسات محددة كمنجزة'):deadline.late?tr('Adjust routine or target','عدّل الروتين أو الموعد'):tr('Routine fits target','الروتين يناسب الموعد')),'small deadline-note'));
      const actions=element('div',undefined,'tool-actions');
      actions.append(link(tr('Continue plan ↗','تابع الخطة ↗'),`studyflow.html?plan=${encodeURIComponent(p.id)}#planner`,'primary'));
      if(task){const focus=link(tr('Focus on next session ↗','ركّز على الجلسة التالية ↗'),`focus.html?plan=${encodeURIComponent(p.id)}&session=${task.index}#focus-context`);focus.target='_blank';focus.rel='noopener';actions.append(focus);}
      card.append(actions);$('saved-plans').append(card);
    }
    const names={studyflow:['StudyFlow','منظّم التعلم'],focus:['Focus Room','مساحة التركيز'],json:['JSON Studio','استوديو JSON'],hash:['File Fingerprint','بصمة الملفات'],text:['Text Studio','استوديو النصوص'],compare:['Text Compare','مقارنة النصوص'],url:['URL Inspector','فاحص الروابط']};
    $('favorite-tools').replaceChildren();$('favorites-empty').hidden=unavailable||data.favorites.length>0;for(const id of data.favorites)$('favorite-tools').append(link(names[id][locale==='ar'?1:0]+' ↗',id+'.html'));
    $('backup-export').disabled=!store.read();$('backup-preview').disabled=!store.read();$('backup-file').disabled=!store.read();$('backup-apply').disabled=!candidate||!store.read();$('workspace-clear').disabled=!store.read()&&!store.issue;
  }
  if($('plan-search')){
    $('plan-search').addEventListener('input',dashboard);$('plan-filter').addEventListener('change',dashboard);$('plan-sort').addEventListener('change',dashboard);
    $('plan-reset').addEventListener('click',()=>{$('plan-search').value='';$('plan-filter').value='all';dashboard();$('plan-search').focus();});
    $('rename-plan-cancel').addEventListener('click',()=>$('rename-plan-dialog').close());
    $('rename-plan-dialog').addEventListener('close',()=>{editingPlan=null;});
    $('rename-plan-form').addEventListener('submit',event=>{
      event.preventDefault();if(!editingPlan)return;
      try{
        const editing=editingPlan,name=$('rename-plan-name').value;
        store.update(current=>model.renamePlan(current,editing.id,name,editing.name));
        $('rename-plan-dialog').close();notify();
        feedback($('plan-action-status'),'Plan name saved. Your schedule and checks are unchanged.','حُفظ اسم الخطة. لم يتغير الجدول أو علامات الإنجاز.','success');
        const button=[...document.querySelectorAll('[data-rename-plan]')].find(b=>b.dataset.renamePlan===editing.id);
        (button||$('plan-search')).focus();
      }catch(error){
        const notice=error.message==='name-conflict'?['The name changed in another tab. Cancel and reopen Rename to review the latest name.','تغيّر الاسم في تبويب آخر. أغلق النافذة وافتح تعديل الاسم مجدداً لمراجعة آخر اسم.']:error.message==='invalid-name'?['Enter a name with 1–80 characters.','أدخل اسماً من 1 إلى 80 محرفاً.']:['Could not rename this plan. Your saved work has not been replaced.','تعذّر تعديل الاسم. لم نستبدل أعمالك المحفوظة.'];
        feedback($('rename-plan-status'),...notice,'error');
      }
    });
  }
  if($('backup-export')){
    $('backup-export').addEventListener('click',()=>{const data=store.read();if(!data)return;PlaygroundUI.saveFile(JSON.stringify(data,null,2),'biuret-playground-backup.json','application/json');feedback($('backup-status'),'Backup downloaded. Keep it private; it includes plan names and focus task labels.','نُزّلت النسخة. احتفظ بها بخصوصية؛ تتضمن أسماء الخطط وعناوين مهام التركيز.');});
    const invalidate=()=>{importRevision++;candidate=null;$('backup-apply').disabled=true;feedback($('backup-review'));};
    $('backup-input').addEventListener('input',invalidate);
    $('backup-file').addEventListener('change',async()=>{invalidate();const started=importRevision,file=$('backup-file').files[0];if(!file)return;if(file.size>1048576){feedback($('backup-status'),'Backup exceeds 1 MiB.','تتجاوز النسخة 1 MiB.');return;}try{const text=await file.text();if(started!==importRevision)return;$('backup-input').value=text;preview();}catch{if(started===importRevision)feedback($('backup-status'),'Could not read this file.','تعذرت قراءة الملف.');}});
    function preview(){invalidate();try{candidate=model.parse($('backup-input').value,LearningPlanner,StudyFlowCatalog);const merged=model.merge(store.read()||model.empty(),candidate);model.validate(merged,LearningPlanner,StudyFlowCatalog);feedback($('backup-review'),`Valid backup: ${candidate.plans.length} plans, ${candidate.sessions.length} sessions, ${candidate.favorites.length} favorites. Restore merges into existing data; matching plans keep both sets of completed checks and their existing saved schedule.`, `نسخة صالحة: ${candidate.plans.length} خطة، ${candidate.sessions.length} جلسة، ${candidate.favorites.length} أداة مفضلة. الاستعادة تدمج البيانات؛ تحتفظ الخطط المطابقة بعلامات الإنجاز من النسختين وجدولها المحفوظ الحالي.`);$('backup-apply').disabled=!store.read();feedback($('backup-status'));}catch{candidate=null;feedback($('backup-status'),'Invalid, unsupported or conflicting backup. Your saved work is unchanged.','نسخة غير صالحة أو غير مدعومة أو متعارضة. أعمالك المحفوظة لم تتغير.');}}
    renderBackup=()=>{if(candidate)preview();};
    $('backup-preview').addEventListener('click',preview);
    $('backup-apply').addEventListener('click',()=>{if(!candidate)return;try{store.restore(candidate);invalidate();feedback($('backup-status'),'Restored and merged. Your saved work is ready.','تمت الاستعادة والدمج. أعمالك المحفوظة جاهزة.');notify();}catch{feedback($('backup-status'),'Could not restore. Existing data is unchanged; check storage space or backup limits.','تعذرت الاستعادة. البيانات السابقة لم تتغير؛ تحقق من مساحة التخزين أو حدود النسخة.');}});
    $('workspace-clear').addEventListener('click',()=>{$('clear-dialog').showModal();});
    $('clear-cancel').addEventListener('click',()=>$('clear-dialog').close());
    $('clear-confirm').addEventListener('click',()=>{try{store.clear();$('clear-dialog').close();invalidate();$('backup-input').value='';feedback(message,'Device saving disabled and saved work deleted. Downloaded backups are unaffected.','توقف الحفظ وحُذفت الأعمال المحفوظة. النسخ المنزلة لم تتغير.');renderStorage();notify();}catch{error();}});
  }
  document.addEventListener('playground:language',()=>{renderBackup();renderStorage();favorites();dashboard();});
  document.addEventListener('playground:workspace',()=>{favorites();dashboard();});
  window.addEventListener('storage',e=>{if(e.key===model.KEY||e.key===null){renderStorage();notify();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)dashboard();});
  renderStorage();favorites();dashboard();
})();
