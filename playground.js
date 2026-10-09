(() => {
  let locale='en';try{locale=localStorage.getItem('biuret-playground-language')==='ar'?'ar':'en';}catch{}
  const tr=(en,ar)=>locale==='en'?en:ar;
  const form=document.querySelector('#plan-form');
  const status=document.querySelector('#plan-status');
  let plan=null,lastInput=null,visible=8,busy=false,completed=new Set(),filter='all',activePlanId=null;
  function language(){
    document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
    document.querySelectorAll('[data-en][data-ar]').forEach(node=>{node.textContent=node.dataset[locale].replaceAll('\\n','\n');});
    const toggle=document.querySelector('[data-language]');toggle.textContent=tr('العربية','English');toggle.setAttribute('aria-label',tr('Switch to Arabic','التبديل إلى الإنجليزية'));
    document.querySelector('.top nav').setAttribute('aria-label',tr('Main navigation','التنقل الرئيسي'));
    if(!document.body.dataset.tool)document.title=form?tr('StudyFlow — Biuret Playground','StudyFlow — مساحة Biuret للتجارب'):tr('Biuret Playground — Small tools, real possibilities','Biuret Playground — أدوات صغيرة وإمكانات حقيقية');
    else document.title=({focus:tr('Focus Room','مساحة التركيز'),json:tr('JSON Studio','استوديو JSON'),hash:tr('File Fingerprint','بصمة الملفات'),text:tr('Text Studio','استوديو النصوص'),workspace:tr('My Work','أعمالي')})[document.body.dataset.tool]+' — Biuret Playground';
    document.querySelectorAll('[data-placeholder-en]').forEach(n=>n.placeholder=n.dataset[locale==='en'?'placeholderEn':'placeholderAr']);
    document.querySelectorAll('[data-label-en]').forEach(n=>n.setAttribute('aria-label',n.dataset[locale==='en'?'labelEn':'labelAr']));
    document.querySelector('[aria-label="Timer mode"]')?.setAttribute('aria-label',tr('Timer mode','نوع المؤقّت'));
    document.querySelector('[data-filter]')?.parentElement.setAttribute('aria-label',tr('Filter tools','تصنيف الأدوات'));
    document.dispatchEvent(new Event('playground:language'));
    if(document.querySelector('#tool-count'))filterTools();
    const shot=document.querySelector('[data-desktop-shot]');if(shot){shot.src=`assets/studyflow-desktop-${locale}.png`;shot.alt=tr('StudyFlow desktop application','واجهة تطبيق StudyFlow المكتبي');}
  }
  document.querySelector('[data-language]').addEventListener('click',()=>{locale=locale==='en'?'ar':'en';try{localStorage.setItem('biuret-playground-language',locale);}catch{}language();if(plan&&lastInput)generate(lastInput,false);});
  language();
  function filterTools(){
    const query=(document.querySelector('#tool-search')?.value||'').trim().toLowerCase();
    const cards=[...document.querySelectorAll('[data-category]')];
    for(const card of cards){const terms=[card.textContent,...[...card.querySelectorAll('[data-en]')].flatMap(n=>[n.dataset.en,n.dataset.ar])].join(' ').toLowerCase();card.hidden=(filter!=='all'&&card.dataset.category!==filter)||!terms.includes(query);}
    const count=cards.filter(n=>!n.hidden).length;document.querySelector('#tool-count').textContent=tr(`${count} of ${cards.length} tools`,`${count} من ${cards.length} أدوات`);document.querySelector('#tools-empty').hidden=count!==0;
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    filter=button.dataset.filter;filterTools();
  }));
  document.querySelector('#tool-search')?.addEventListener('input',filterTools);
  document.querySelector('#tools-reset')?.addEventListener('click',()=>{filter='all';document.querySelector('#tool-search').value='';document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));filterTools();document.querySelector('#tool-search').focus();});
  if(!form)return;
  const start=document.querySelector('#start');const now=new Date();start.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const kind={learn:['Learn','تعلّم'],practice:['Practice','تطبيق'],review:['Review','مراجعة'],project:['Final project','المشروع النهائي']};
  const number=n=>new Intl.NumberFormat(locale).format(n);
  const formatDate=d=>new Intl.DateTimeFormat(locale,{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(new Date(d+'T12:00:00'));
  function progress(){document.querySelector('#study-progress').max=plan.sessions.length;document.querySelector('#study-progress').value=completed.size;document.querySelector('#study-progress-label').textContent=tr(`${number(completed.size)} / ${number(plan.sessions.length)} sessions checked`,`${number(completed.size)} / ${number(plan.sessions.length)} جلسة محددة كمنجزة`);today();}
  function today(){
    const target=document.querySelector('#today-step'),next=WorkspaceStore.nextSessions(plan,[...completed]);target.replaceChildren();
    const h=document.createElement('h4');h.textContent=tr('What should I study today?','ماذا أدرس اليوم؟');target.append(h);
    const p=document.createElement('p'),s=next.overdue[0]||next.today[0]||next.next;
    p.textContent=next.complete?tr('All sessions checked. Reflect on your final project.','حدّدت جميع الجلسات كمنجزة. راجع مشروعك النهائي.'):next.overdue.length?tr('Begin with an earlier unfinished session; no need to rush through the whole backlog.','ابدأ بجلسة سابقة غير مكتملة؛ لا تحتاج لإنجاز كل المتأخرات دفعة واحدة.'):next.today.length?tr('Follow the first unfinished session below.','تابع أول جلسة غير مكتملة أدناه.'):tr('Your next scheduled session:','جلستك التالية المجدولة:');target.append(p);
    if(s){const detail=document.createElement('p');detail.textContent=s.date+' · '+kind[s.kind][locale==='en'?0:1]+' · '+s.topic+tr(` · ${s.minutes} min`,` · ${s.minutes} دقيقة`);target.append(detail);const a=document.createElement('a');a.href='focus.html';a.className='secondary';a.textContent=tr('Open Focus Room ↗','افتح مساحة التركيز ↗');target.append(a);}
  }
  function saveCheck(index,checked){
    if(!activePlanId)return;
    try{PlaygroundWorkspace.update(data=>{const saved=data.plans.find(p=>p.id===activePlanId);if(!saved)throw Error('missing-plan');const set=new Set(saved.completed);checked?set.add(index):set.delete(index);saved.completed=[...set].sort((a,b)=>a-b);saved.updatedAt=new Date().toISOString();completed=new Set(saved.completed);return data;});document.querySelector('#plan-save-status').textContent=tr('Progress saved on this device.','حُفظ التقدم على هذا الجهاز.');document.dispatchEvent(new Event('playground:workspace'));}
    catch{document.querySelector('#plan-save-status').textContent=tr('This check is only in this tab; saving failed. Export your checklist, or save the plan again.','هذه العلامة في التبويب فقط؛ تعذّر الحفظ. صدّر قائمة الإنجاز أو احفظ الخطة مجدداً.');}
  }
  function render(){
    if(!plan)return;
    document.querySelector('#plan-empty').hidden=true;document.querySelector('#plan-output').hidden=false;
    const heading=document.querySelector('#result-heading');heading.replaceChildren();
    const h=document.createElement('h3');h.textContent=tr('Your plan, one step at a time.','خطتك، خطوة بخطوة.');
    const days=[...new Set(plan.sessions.map(s=>s.date))];const total=plan.sessions.reduce((n,s)=>n+s.minutes,0);
    const summary=document.createElement('p');summary.textContent=tr(`${number(plan.sessions.length)} sessions · ${number(days.length)} study days · ${number(total)} estimated minutes`,`${number(plan.sessions.length)} جلسة · ${number(days.length)} يوم دراسة · ${number(total)} دقيقة تقديرية`);
    const end=document.createElement('p');end.textContent=tr('Estimated finish: ','النهاية التقديرية: ')+formatDate(days.at(-1));
    const project=document.createElement('p');project.textContent=plan.project;heading.append(h,summary,end,project);
    const schedule=document.querySelector('#schedule');schedule.replaceChildren();
    for(const day of days.slice(0,visible)){const li=document.createElement('li');const title=document.createElement('h4');title.textContent=formatDate(day);li.append(title);
      for(const session of plan.sessions.filter(s=>s.date===day)){const row=document.createElement('label');row.className='session';const check=document.createElement('input');check.type='checkbox';check.checked=completed.has(plan.sessions.indexOf(session));check.setAttribute('aria-label',tr('Mark complete: ','حدّد كمنجز: ')+session.topic+' · '+kind[session.kind][locale==='en'?0:1]+' · '+session.part);check.addEventListener('change',()=>{const i=plan.sessions.indexOf(session);check.checked?completed.add(i):completed.delete(i);saveCheck(i,check.checked);row.classList.toggle('done',check.checked);progress();});row.classList.toggle('done',check.checked);const topic=document.createElement('span');const type=document.createElement('b');type.className='kind';type.textContent=kind[session.kind][locale==='en'?0:1]+': ';topic.append(type,document.createTextNode(session.topic));if(session.parts>1)topic.append(document.createTextNode(tr(` (part ${number(session.part)}/${number(session.parts)})`,` (الجزء ${number(session.part)}/${number(session.parts)})`)));const minutes=document.createElement('small');minutes.textContent=number(session.minutes)+tr(' min',' دقيقة');row.append(check,topic,minutes);li.append(row);}schedule.append(li);}
    document.querySelector('#more').hidden=visible>=days.length;
    progress();
  }
  async function generate(config,focus=true){
    if(busy)return;busy=true;document.querySelector('#generate').disabled=true;
    document.querySelector('[data-language]').disabled=true;
    status.textContent=tr('Calculating your local plan…','جارٍ حساب خطتك محلياً…');
    try{const next=StudyFlowPlanner.createPlan({...config,locale},StudyFlowCatalog);if(JSON.stringify(config)!==JSON.stringify(lastInput)){completed.clear();activePlanId=null;document.querySelector('#plan-save-status').textContent='';if(lastInput){const url=new URL(location.href);url.searchParams.delete('plan');history.replaceState(null,'',url);}}plan=next;lastInput=config;visible=8;render();savingState();status.textContent=activePlanId?tr('Saved plan ready. Your checks save automatically.','الخطة المحفوظة جاهزة. تُحفظ علاماتك تلقائياً.'):tr('Plan ready. Save it below to keep your progress.','الخطة جاهزة. احفظها أدناه للاحتفاظ بتقدمك.');if(focus)document.querySelector('#result-heading').focus();}
    catch{status.textContent=tr('Could not create a plan. Check the study days, date and daily time (15–120 whole minutes).','تعذّر إنشاء الخطة. تحقق من الأيام والتاريخ والوقت اليومي (عدد صحيح من 15 إلى 120 دقيقة).');}
    finally{busy=false;document.querySelector('#generate').disabled=false;document.querySelector('[data-language]').disabled=false;}
  }
  form.addEventListener('submit',event=>{event.preventDefault();const days=[...form.querySelectorAll('[name=day]:checked')].map(i=>Number(i.value));if(!days.length){status.textContent=tr('Choose at least one study day.','اختر يوم دراسة واحداً على الأقل.');form.querySelector('[name=day]').focus();return;}generate({template:document.querySelector('#template').value,level:document.querySelector('#level').value,minutes:Number(document.querySelector('#minutes').value),days,start:start.value});});
  document.querySelector('#more').addEventListener('click',()=>{visible+=8;render();});
  function savingState(){const saved=PlaygroundWorkspace.read();document.querySelector('#plan-save').disabled=!saved;document.querySelector('#plan-save').textContent=activePlanId?tr('Update saved plan','حدّث الخطة المحفوظة'):tr('Save plan on this device','احفظ الخطة على الجهاز');if(!saved)document.querySelector('#plan-save-status').textContent=tr('Enable device saving at the top of this page to save a named plan.','فعّل الحفظ أعلى الصفحة للاحتفاظ بالخطة بعد تسميتها.');}
  document.querySelector('#plan-save').addEventListener('click',()=>{if(!plan||!lastInput)return;const name=document.querySelector('#plan-name');if(!name.value.trim()){document.querySelector('#plan-save-status').textContent=tr('Give your plan a name first.','أعطِ خطتك اسماً أولاً.');name.focus();return;}try{let savedId;PlaygroundWorkspace.update(data=>{const existing=data.plans.find(p=>p.id===activePlanId),saved=WorkspaceStore.makePlan(lastInput,name.value,plan,existing);saved.completed=[...completed];if(!existing&&data.plans.length>=20)throw Error('limit');savedId=saved.id;data.plans=existing?data.plans.map(p=>p.id===saved.id?saved:p):[...data.plans,saved];return data;});activePlanId=savedId;const url=new URL(location.href);url.searchParams.set('plan',savedId);history.replaceState(null,'',url);document.querySelector('#plan-save-status').textContent=tr('Plan saved. Future checks save automatically. Find it in My Work.','حُفظت الخطة. تُحفظ العلامات التالية تلقائياً. تجدها في أعمالي.');savingState();document.dispatchEvent(new Event('playground:workspace'));}catch{document.querySelector('#plan-save-status').textContent=tr('Could not save. Limit: 20 plans. Export a backup or check browser storage; your previous work is unchanged.','تعذّر الحفظ. الحد 20 خطة. صدّر نسخة أو تحقق من التخزين؛ أعمالك السابقة لم تتغير.');}});
  document.addEventListener('playground:workspace',savingState);
  window.addEventListener('storage',e=>{if(e.key!==WorkspaceStore.KEY&&e.key!==null)return;const saved=PlaygroundWorkspace.read()?.plans.find(p=>p.id===activePlanId);if(saved){completed=new Set(saved.completed);render();}else if(activePlanId){activePlanId=null;savingState();}});
  const restoreId=new URLSearchParams(location.search).get('plan');
  if(restoreId){const saved=PlaygroundWorkspace.read()?.plans.find(p=>p.id===restoreId);if(saved){document.querySelector('#template').value=saved.config.template;document.querySelector('#level').value=saved.config.level;document.querySelector('#minutes').value=saved.config.minutes;start.value=saved.config.start;form.querySelectorAll('[name=day]').forEach(i=>i.checked=saved.config.days.includes(Number(i.value)));generate(saved.config,false).then(()=>{activePlanId=saved.id;completed=new Set(saved.completed);document.querySelector('#plan-name').value=saved.name;render();savingState();status.textContent=tr('Saved plan restored. Continue from your next unfinished session.','استُعيدت خطتك. تابع من الجلسة التالية غير المكتملة.');});}else{status.textContent=tr('This plan is not saved in this browser. Open My Work or restore a backup.','هذه الخطة غير محفوظة في هذا المتصفح. افتح أعمالي أو استعد نسخة احتياطية.');}}
  function exportFile(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.querySelector('#calendar').addEventListener('click',()=>{if(!plan)return;exportFile(Workbench.planCalendar(plan),'studyflow-calendar.ics','text/calendar;charset=utf-8');status.textContent=tr('Calendar file ready. Import it into your calendar as all-day reminders.','ملف التقويم جاهز. استورده في تقويمك كتذكيرات ليوم كامل.');});
  document.querySelector('#plan-notes').addEventListener('click',()=>{if(!plan)return;const text=[plan.project,'',...plan.sessions.map((s,i)=>`${completed.has(i)?'[x]':'[ ]'} ${s.date} · ${kind[s.kind][locale==='en'?0:1]} · ${s.topic} · ${s.minutes} min`)].join('\n');exportFile(text,'studyflow-checklist.txt','text/plain;charset=utf-8');});
  document.querySelector('#download').addEventListener('click',()=>{if(!plan)return;const blob=new Blob([JSON.stringify({format:'biuret-playground-preview-v1',...plan},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='studyflow-plan-preview.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=tr('Preview downloaded. This is not a desktop backup.','نُزّلت المعاينة. هذه ليست نسخة احتياطية للتطبيق.');});
})();
