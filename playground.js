(() => {
  let locale='en';try{locale=localStorage.getItem('biuret-playground-language')==='ar'?'ar':'en';}catch{}
  const tr=(en,ar)=>locale==='en'?en:ar;
  const form=document.querySelector('#plan-form');
  const status=document.querySelector('#plan-status');
  let plan=null,lastInput=null,visible=8,busy=false;
  function language(){
    document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
    document.querySelectorAll('[data-en][data-ar]').forEach(node=>{node.textContent=node.dataset[locale].replaceAll('\\n','\n');});
    const toggle=document.querySelector('[data-language]');toggle.textContent=tr('العربية','English');toggle.setAttribute('aria-label',tr('Switch to Arabic','التبديل إلى الإنجليزية'));
    document.querySelector('.top nav').setAttribute('aria-label',tr('Main navigation','التنقل الرئيسي'));
    if(!document.body.dataset.tool)document.title=form?tr('StudyFlow — Biuret Playground','StudyFlow — مساحة Biuret للتجارب'):tr('Biuret Playground — Small tools, real possibilities','Biuret Playground — أدوات صغيرة وإمكانات حقيقية');
    else document.title=({focus:tr('Focus Room','مساحة التركيز'),json:tr('JSON Studio','استوديو JSON'),hash:tr('File Fingerprint','بصمة الملفات')})[document.body.dataset.tool]+' — Biuret Playground';
    document.querySelectorAll('[data-placeholder-en]').forEach(n=>n.placeholder=n.dataset[locale==='en'?'placeholderEn':'placeholderAr']);
    document.querySelector('[aria-label="Timer mode"]')?.setAttribute('aria-label',tr('Timer mode','نوع المؤقّت'));
    document.querySelector('[data-filter]')?.parentElement.setAttribute('aria-label',tr('Filter tools','تصنيف الأدوات'));
    document.dispatchEvent(new Event('playground:language'));
    if(document.querySelector('#tool-count'))updateCount();
    const shot=document.querySelector('[data-desktop-shot]');if(shot){shot.src=`assets/studyflow-desktop-${locale}.png`;shot.alt=tr('StudyFlow desktop application','واجهة تطبيق StudyFlow المكتبي');}
  }
  document.querySelector('[data-language]').addEventListener('click',()=>{locale=locale==='en'?'ar':'en';try{localStorage.setItem('biuret-playground-language',locale);}catch{}language();if(plan&&lastInput)generate(lastInput,false);});
  language();
  function updateCount(){const count=[...document.querySelectorAll('[data-category]')].filter(n=>!n.hidden).length;document.querySelector('#tool-count').textContent=tr(`${count} tools available`,`${count} أدوات متاحة`);}
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelectorAll('[data-category]').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter);updateCount();
  }));
  if(!form)return;
  const start=document.querySelector('#start');const now=new Date();start.value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const kind={learn:['Learn','تعلّم'],practice:['Practice','تطبيق'],review:['Review','مراجعة'],project:['Final project','المشروع النهائي']};
  const number=n=>new Intl.NumberFormat(locale).format(n);
  const formatDate=d=>new Intl.DateTimeFormat(locale,{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(new Date(d+'T12:00:00'));
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
      for(const session of plan.sessions.filter(s=>s.date===day)){const row=document.createElement('div');row.className='session';const topic=document.createElement('span');const type=document.createElement('b');type.className='kind';type.textContent=kind[session.kind][locale==='en'?0:1]+': ';topic.append(type,document.createTextNode(session.topic));if(session.parts>1)topic.append(document.createTextNode(tr(` (part ${number(session.part)}/${number(session.parts)})`,` (الجزء ${number(session.part)}/${number(session.parts)})`)));const minutes=document.createElement('small');minutes.textContent=number(session.minutes)+tr(' min',' دقيقة');row.append(topic,minutes);li.append(row);}schedule.append(li);}
    document.querySelector('#more').hidden=visible>=days.length;
  }
  async function generate(config,focus=true){
    if(busy)return;busy=true;document.querySelector('#generate').disabled=true;
    document.querySelector('[data-language]').disabled=true;
    status.textContent=tr('Calculating your local plan…','جارٍ حساب خطتك محلياً…');
    try{plan=StudyFlowPlanner.createPlan({...config,locale},StudyFlowCatalog);lastInput=config;visible=8;render();status.textContent=tr('Plan ready. Nothing was saved to your desktop application.','الخطة جاهزة. لم تُحفظ في تطبيقك المكتبي.');if(focus)document.querySelector('#result-heading').focus();}
    catch{status.textContent=tr('Could not create a plan. Check the study days, date and daily time (15–120 whole minutes).','تعذّر إنشاء الخطة. تحقق من الأيام والتاريخ والوقت اليومي (عدد صحيح من 15 إلى 120 دقيقة).');}
    finally{busy=false;document.querySelector('#generate').disabled=false;document.querySelector('[data-language]').disabled=false;}
  }
  form.addEventListener('submit',event=>{event.preventDefault();const days=[...form.querySelectorAll('[name=day]:checked')].map(i=>Number(i.value));if(!days.length){status.textContent=tr('Choose at least one study day.','اختر يوم دراسة واحداً على الأقل.');form.querySelector('[name=day]').focus();return;}generate({template:document.querySelector('#template').value,level:document.querySelector('#level').value,minutes:Number(document.querySelector('#minutes').value),days,start:start.value});});
  document.querySelector('#more').addEventListener('click',()=>{visible+=8;render();});
  document.querySelector('#download').addEventListener('click',()=>{if(!plan)return;const blob=new Blob([JSON.stringify({format:'biuret-playground-preview-v1',...plan},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='studyflow-plan-preview.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=tr('Preview downloaded. This is not a desktop backup.','نُزّلت المعاينة. هذه ليست نسخة احتياطية للتطبيق.');});
})();
