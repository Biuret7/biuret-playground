(() => {
  const model=PlaygroundTools, tool=document.body.dataset.tool;
  const el=id=>document.getElementById(id), tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
  async function copy(text,status){
    try{await navigator.clipboard.writeText(text);status.textContent=tr('Copied.','تم النسخ.');}
    catch{status.textContent=tr('Could not copy. Select the result and copy it manually.','تعذّر النسخ. حدّد النتيجة وانسخها يدوياً.');}
  }
  if(tool==='focus'){
    let mode='focus',state={remaining:25*60000,running:false,started:0},complete=false;
    const duration=el('duration'),display=el('timer-display'),status=el('timer-status'),button=el('timer-start');
    function render(){
      const left=model.remaining(state,performance.now());
      const sec=Math.ceil(left/1000);display.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
      if(state.running&&left===0){state={remaining:0,running:false,started:0};complete=true;status.textContent=tr('Session complete. Take a moment, then choose your next step.','انتهت الجلسة. خذ لحظة ثم اختر خطوتك القادمة.');}
      button.textContent=state.running?tr('Pause','إيقاف مؤقت'):complete?tr('Start again','ابدأ مجدداً'):tr('Start / resume','ابدأ / تابع');
      el('timer-caption').textContent=state.running?(mode==='focus'?tr('A little progress, one task at a time.','تقدم بسيط، مهمة واحدة في كل مرة.'):tr('Make room for a break.','امنح نفسك استراحة.')):complete?tr('Well done. Choose your next step.','أحسنت. اختر خطوتك المقبلة.'):tr('Ready when you are','ابدأ عندما تكون جاهزاً');
      duration.disabled=state.running;
      document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=state.running);
    }
    function reset(){
      const minutes=Number(duration.value);
      if(!Number.isInteger(minutes)||minutes<1||minutes>120){status.textContent=tr('Choose a whole number from 1 to 120 minutes.','اختر عدداً صحيحاً من 1 إلى 120 دقيقة.');duration.focus();return false;}
      state={remaining:minutes*60000,running:false,started:0};complete=false;status.textContent='';render();return true;
    }
    button.addEventListener('click',()=>{
      if(state.running){state={remaining:model.remaining(state,performance.now()),running:false,started:0};status.textContent=tr('Paused. Resume when ready.','توقف مؤقتاً. تابع عندما تكون جاهزاً.');}
      else{if(complete&&!reset())return;if(!duration.checkValidity()){reset();return;}state={...state,running:true,started:performance.now()};status.textContent=tr('Timer started. Keep this tab open.','بدأ المؤقّت. أبقِ هذا التبويب مفتوحاً.');}
      render();
    });
    el('timer-reset').addEventListener('click',reset);duration.addEventListener('change',reset);
    document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
      mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));duration.value=mode==='focus'?25:5;reset();
    }));
    document.addEventListener('playground:language',()=>{status.textContent='';render();});
    document.addEventListener('visibilitychange',render);setInterval(render,250);render();
  }
  if(tool==='json'){
    const input=el('json-input'),output=el('json-output'),status=el('json-status');
    function clearResult(){output.value='';el('json-copy').disabled=el('json-download').disabled=true;status.textContent='';status.dataset.tone='';}
    function format(compact){
      clearResult();
      try{output.value=model.formatJSON(input.value,compact);el('json-copy').disabled=el('json-download').disabled=false;status.dataset.tone='success';status.textContent=tr('Valid JSON. Result ready.','JSON صحيح. النتيجة جاهزة.');}
      catch(e){status.dataset.tone='error';status.textContent=e.message==='size'?tr('Input exceeds 1 MiB. Use a smaller sample.','المدخلات تتجاوز 1 MiB. استخدم عينة أصغر.'):e.message==='empty'?tr('Paste JSON or load the example first.','ألصق JSON أو حمّل المثال أولاً.'):tr('Invalid JSON. Check quotes, commas and brackets. ','JSON غير صحيح. راجع علامات الاقتباس والفواصل والأقواس. ')+(e instanceof SyntaxError?e.message.slice(0,240):'');}
    }
    input.addEventListener('input',clearResult);
    el('json-format').addEventListener('click',()=>format(false));el('json-compact').addEventListener('click',()=>format(true));
    el('json-example').addEventListener('click',()=>{input.value='{"project":"Biuret","tools":["StudyFlow","Focus Room"],"private":true}';clearResult();input.focus();});
    el('json-clear').addEventListener('click',()=>{input.value='';clearResult();input.focus();});
    el('json-copy').addEventListener('click',()=>copy(output.value,status));
    el('json-download').addEventListener('click',()=>{
      if(!output.value)return;const url=URL.createObjectURL(new Blob([output.value],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='biuret-formatted.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=tr('JSON downloaded.','تم تنزيل JSON.');
    });
    document.addEventListener('playground:language',()=>{status.textContent='';});
  }
  if(tool==='hash'){
    const file=el('hash-file'),expected=el('expected-hash'),status=el('hash-status'),button=el('hash-calculate');let digest='',busy=false;
    function clear(){digest='';el('hash-output').value='';el('hash-result').hidden=true;status.textContent='';status.dataset.tone='';}
    function comparison(){
      if(!digest)return;
      if(!expected.value.trim()){status.textContent=tr('Fingerprint ready. Add an expected SHA-256 to compare.','البصمة جاهزة. أضف البصمة المتوقعة للمقارنة.');status.dataset.tone='';return;}
      try{const match=model.normalizeHash(expected.value)===digest;status.dataset.tone=match?'success':'error';status.textContent=match?tr('Match. The file matches this expected fingerprint.','تطابق. الملف يطابق هذه البصمة المتوقعة.'):tr('No match. This file differs from the expected fingerprint.','لا يوجد تطابق. الملف يختلف عن البصمة المتوقعة.');}
      catch{status.dataset.tone='error';status.textContent=tr('Expected SHA-256 must contain 64 hexadecimal characters (0–9, a–f).','يجب أن تتكوّن البصمة المتوقعة من 64 رمزاً ست عشرياً (0–9، a–f).');}
    }
    file.addEventListener('change',clear);expected.addEventListener('input',comparison);
    el('hash-copy').addEventListener('click',()=>copy(digest,status));
    el('hash-form').addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;const chosen=file.files[0];clear();
      if(!chosen)return;
      if(chosen.size>model.MAX_FILE){status.dataset.tone='error';status.textContent=tr('This file exceeds 100 MiB. Choose a smaller file.','هذا الملف يتجاوز 100 MiB. اختر ملفاً أصغر.');return;}
      if(!window.isSecureContext||!crypto.subtle){status.textContent=tr('Open this tool over HTTPS to calculate file fingerprints.','افتح هذه الأداة عبر HTTPS لحساب بصمات الملفات.');return;}
      busy=true;button.disabled=file.disabled=true;status.textContent=tr('Calculating locally…','جارٍ الحساب محلياً…');
      try{digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await chosen.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('');el('hash-output').value=digest;el('hash-result').hidden=false;comparison();}
      catch{status.dataset.tone='error';status.textContent=tr('Could not read this file. Choose it again and retry.','تعذّرت قراءة الملف. اختره مجدداً وحاول.');}
      finally{busy=false;button.disabled=file.disabled=false;}
    });
    document.addEventListener('playground:language',comparison);
  }
})();
