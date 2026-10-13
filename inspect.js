(() => {
  const $=id=>document.getElementById(id),tool=document.body.dataset.tool,models=window.InspectionModels;
  if(!['compare','url'].includes(tool)||!models)return;
  const tr=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
  let result=null,report='',notice='',tone='';
  const element=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el;};
  function render(){
    $('inspect-result').hidden=!result;$('inspect-status').textContent=notice?tr(...notice):'';$('inspect-status').dataset.tone=tone;
    $('copy-report').disabled=$('export-report').disabled=!result;if(!result)return;
    if(tool==='compare'){
      $('diff-count').replaceChildren(element('span',tr(`${result.added} added`,`${result.added} مضاف`)),element('span',tr(`${result.removed} removed`,`${result.removed} محذوف`)),element('span',tr(`${result.unchanged} unchanged`,`${result.unchanged} دون تغيير`)));
      const lines=$('only-changes').checked?result.rows.filter(r=>r.kind!=='same'):result.rows;
      $('diff-lines').replaceChildren(...lines.map(r=>{
        const row=element('div','',r.kind),numbers=element('span',`${r.before??'—'} → ${r.after??'—'}`,'diff-number'),text=element('span',`${r.kind==='added'?'+':r.kind==='removed'?'-':' '} ${r.text}`,'diff-content');
        numbers.setAttribute('aria-label',tr(`Original line ${r.before??'none'}, updated line ${r.after??'none'}`,`السطر الأصلي ${r.before??'لا يوجد'}، السطر المعدل ${r.after??'لا يوجد'}`));
        text.dir='auto';row.append(numbers,text);return row;
      }));
      if(!lines.length)$('diff-lines').append(element('p',tr('No differences.','لا توجد فروق.')));
      report=tr('Biuret Text Compare','Biuret · مقارنة النصوص')+'\n'+tr(`${result.added} added · ${result.removed} removed · ${result.unchanged} unchanged`,`${result.added} مضاف · ${result.removed} محذوف · ${result.unchanged} دون تغيير`)+'\n\n'+result.rows.map(r=>`${r.kind==='added'?'+':r.kind==='removed'?'-':' '} ${r.text}`).join('\n');
    }else{
      const values=[[tr('Protocol','البروتوكول'),result.scheme],[tr('Actual hostname','المضيف الحقيقي'),result.host],[tr('Port','المنفذ'),result.port==='default'?tr('Default','افتراضي'):result.port],[tr('Path','المسار'),result.path],[tr('Query fields','معاملات الاستعلام'),result.query.map(r=>`${r.key} = ${r.value}`).join('\n')||tr('None','لا يوجد')],[tr('Fragment','جزء الصفحة'),result.fragment||tr('None','لا يوجد')],[tr('Embedded credentials','بيانات اعتماد مضمنة'),result.credentials?tr('Present — not displayed','موجودة — لا تعرض هنا'):tr('None','لا يوجد')]];
      $('url-facts').replaceChildren(...values.flatMap(([label,value])=>{const detail=element('dd',value);detail.dir='auto';return [element('dt',label),detail];}));
      const notes={http:['HTTP does not provide TLS transport protection.','HTTP لا يوفر حماية النقل بتشفير TLS.'],userinfo:['Text before @ is user information, not the destination hostname. Credentials are omitted from this report.','النص قبل @ بيانات مستخدم وليس اسم المضيف المقصود. بيانات الاعتماد غير مدرجة في التقرير.'],idn:['Internationalized domain detected. Review the ASCII hostname carefully; this alone does not imply a malicious link.','نطاق دولي. راجع اسم المضيف بصيغة ASCII بعناية؛ وجوده لا يعني وحده أن الرابط ضار.'],ip:['The destination is an IP address. Verify who operates it before trusting it.','الوجهة عنوان IP. تحقق من الجهة المشغلة قبل الوثوق بها.'],port:['An explicit port is present. Confirm the expected service.','الرابط يحدد منفذاً صريحاً. تحقق من الخدمة المتوقعة.'],query:['Query fields can contain private tokens. Review the report before copying or exporting.','قد تحتوي معاملات الاستعلام رموزاً خاصة. راجع التقرير قبل نسخه أو تصديره.']};
      $('url-flags').replaceChildren(...result.flags.map(code=>element('li',tr(...notes[code]))));
      $('url-flags').append(element('li',tr('Structure inspection is not a safety verdict. HTTPS alone does not prove a site is trustworthy.','فحص البنية ليس حكماً بالأمان. HTTPS وحده لا يثبت موثوقية الموقع.')));
      report='Biuret URL structure report\n'+values.map(([key,value])=>`${key}: ${value}`).join('\n')+'\n\n'+$('url-flags').innerText;
    }
  }
  function invalidate(){result=null;report='';tone='';notice=['Input changed. Run the check again.','تغيرت المدخلات. أعد الفحص.'];render();}
  $('inspect-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      if(tool==='compare'&&!$('before').value&&!$('after').value)throw Error('empty');
      result=tool==='compare'?models.compareText($('before').value,$('after').value):models.inspectURL($('url-input').value);
      tone='success';notice=['Checked locally. Nothing was uploaded.','تم الفحص محلياً دون رفع البيانات.'];
    }catch(error){
      result=null;report='';tone='error';
      const errors={
        empty:['Paste at least one version, or try the sample.','ألصق نسخة واحدة على الأقل أو جرّب العينة.'],
        lines:['Use no more than 150 lines per version.','استخدم 150 سطراً كحد أقصى لكل نسخة.'],
        size:['Use no more than 25,000 characters per version.','استخدم 25,000 محرف كحد أقصى لكل نسخة.'],
        protocol:['Only complete HTTP and HTTPS links are supported.','تُدعم روابط HTTP وHTTPS الكاملة فقط.'],
        url:['Enter a complete HTTP or HTTPS link without spaces or backslashes (up to 4,096 characters).','أدخل رابط HTTP أو HTTPS كاملاً دون مسافات أو شرطات مائلة عكسية (حتى 4,096 محرفاً).']
      };
      notice=errors[error.message]||['Could not check this input. Review it and try again.','تعذّر فحص المدخلات. راجعها وحاول مجدداً.'];
    }
    render();
  });
  $('sample').addEventListener('click',()=>{if(tool==='compare'){$('before').value='title = StudyFlow\nmode = local\nreview = weekly';$('after').value='title = Biuret StudyFlow\nmode = local\nreview = daily\nexport = enabled';}else $('url-input').value='https://account.training.example@training.example:8443/lesson?topic=identity#practice';invalidate();$('inspect-form').requestSubmit();});
  $('clear').addEventListener('click',()=>{for(const input of $('inspect-form').querySelectorAll('textarea,input'))input.value='';result=null;report='';tone='';notice=['Inputs cleared.','تم مسح المدخلات.'];render();$('inspect-form').querySelector('textarea,input').focus();});
  for(const input of $('inspect-form').querySelectorAll('textarea,input'))input.addEventListener('input',invalidate);
  $('only-changes')?.addEventListener('change',render);
  $('copy-report').addEventListener('click',async()=>{if(!report)return;try{await navigator.clipboard.writeText(report);tone='success';notice=['Report copied.','تم نسخ التقرير.'];}catch{tone='error';notice=['Copy unavailable. Download the report instead.','تعذر النسخ. نزّل التقرير بدلاً منه.'];}render();});
  $('export-report').addEventListener('click',()=>{if(!report)return;PlaygroundUI.saveFile(report,`biuret-${tool}-report.txt`);});
  document.addEventListener('playground:language',render);render();
})();
