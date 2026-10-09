(() => {
  let locale='en';try{locale=localStorage.getItem('biuret-playground-language')==='ar'?'ar':'en';}catch{}
  const tr=(en,ar)=>locale==='en'?en:ar;
  const form=document.querySelector('#plan-form');
  let filter='all';
  function language(){
    document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';
    document.querySelectorAll('[data-en][data-ar]').forEach(node=>{node.textContent=node.dataset[locale].replaceAll('\\n','\n');});
    const toggle=document.querySelector('[data-language]');toggle.textContent=tr('العربية','English');toggle.setAttribute('aria-label',tr('Switch to Arabic','التبديل إلى الإنجليزية'));
    document.querySelector('.top nav').setAttribute('aria-label',tr('Main navigation','التنقل الرئيسي'));
    if(!document.body.dataset.tool)document.title=form?tr('StudyFlow — Biuret Playground','StudyFlow — مساحة Biuret للتجارب'):tr('Your next task, made simpler — Biuret Playground','مهمتك القادمة، أصبحت أسهل — Biuret Playground');
    else document.title=({focus:tr('Focus Room','مساحة التركيز'),json:tr('JSON Studio','استوديو JSON'),hash:tr('File Fingerprint','بصمة الملفات'),text:tr('Text Studio','استوديو النصوص'),workspace:tr('My Work','أعمالي'),software:tr('Desktop & CLI programs','البرامج المكتبية وCLI')})[document.body.dataset.tool]+' — Biuret Playground';
    document.querySelectorAll('[data-placeholder-en]').forEach(n=>n.placeholder=n.dataset[locale==='en'?'placeholderEn':'placeholderAr']);
    document.querySelectorAll('[data-label-en]').forEach(n=>n.setAttribute('aria-label',n.dataset[locale==='en'?'labelEn':'labelAr']));
    document.querySelector('[aria-label="Timer mode"]')?.setAttribute('aria-label',tr('Timer mode','نوع المؤقّت'));
    document.querySelector('[data-filter]')?.parentElement.setAttribute('aria-label',tr('Filter tools','تصنيف الأدوات'));
    document.dispatchEvent(new Event('playground:language'));
    if(document.querySelector('#tool-count'))filterTools();
    const shot=document.querySelector('[data-desktop-shot]');if(shot){shot.src=`assets/studyflow-desktop-${locale}.png`;shot.alt=tr('StudyFlow desktop application','واجهة تطبيق StudyFlow المكتبي');}
  }
  document.querySelector('[data-language]').addEventListener('click',()=>{locale=locale==='en'?'ar':'en';try{localStorage.setItem('biuret-playground-language',locale);}catch{}language();});
  language();
  function filterTools(){
    const query=(document.querySelector('#tool-search')?.value||'').trim().toLowerCase();
    const cards=[...document.querySelectorAll('[data-category]')];
    for(const card of cards){const terms=[card.textContent,...[...card.querySelectorAll('[data-en]')].flatMap(n=>[n.dataset.en,n.dataset.ar])].join(' ').toLowerCase();card.hidden=(filter!=='all'&&card.dataset.category!==filter)||!terms.includes(query);}
    const count=cards.filter(n=>!n.hidden).length;document.querySelector('#tool-count').textContent=tr(`${count} of ${cards.length} web tools`,`${count} من ${cards.length} أدوات ويب`);document.querySelector('#tools-empty').hidden=count!==0;
  }
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    filter=button.dataset.filter;filterTools();
  }));
  document.querySelector('#tool-search')?.addEventListener('input',filterTools);
  document.querySelector('#tools-reset')?.addEventListener('click',()=>{filter='all';document.querySelector('#tool-search').value='';document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));filterTools();document.querySelector('#tool-search').focus();});
})();
