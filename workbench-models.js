/* Pure transformations. User content is never executed or sent to a service. */
(function(root){
  const MAX_TEXT=200000;
  function sortedJSON(text,compact=false,indent=2){
    if(new TextEncoder().encode(text).length>1024*1024)throw Error('size');
    if(!text.trim())throw Error('empty');
    const value=JSON.parse(text);
    function sort(v,depth=0){
      if(depth>200)throw Error('depth');
      if(Array.isArray(v))return v.map(x=>sort(x,depth+1));
      if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k],depth+1)]));
      return v;
    }
    return JSON.stringify(sort(value),null,compact?0:indent);
  }
  function jsonStats(text){
    const value=JSON.parse(text),stack=[value];let keys=0,arrays=0,objects=0,scalars=0;
    while(stack.length){const v=stack.pop();if(Array.isArray(v)){arrays++;for(const item of v)stack.push(item);}else if(v&&typeof v==='object'){objects++;const entries=Object.values(v);keys+=entries.length;for(const item of entries)stack.push(item);}else scalars++;}
    return {bytes:new TextEncoder().encode(text).length,keys,arrays,objects,scalars};
  }
  function textStats(text,locale='en'){
    if(text.length>MAX_TEXT)throw Error('size');
    let words;
    if(typeof Intl.Segmenter==='function')words=[...new Intl.Segmenter(locale,{granularity:'word'}).segment(text)].filter(s=>s.isWordLike).length;
    else words=(text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;
    return {words,characters:[...text].length,lines:text?text.split(/\r\n|\r|\n/).length:0,paragraphs:text.trim()?text.trim().split(/\n\s*\n/).length:0,minutes:words?Math.max(1,Math.ceil(words/200)):0};
  }
  function cleanText(text,operation){
    if(text.length>MAX_TEXT)throw Error('size');
    if(operation==='spaces')return text.split(/\r\n|\r|\n/).map(s=>s.replace(/[\t ]+/g,' ').trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
    if(operation==='deduplicate'){const seen=new Set();return text.split(/\r\n|\r|\n/).filter(s=>{if(!s.trim())return true;if(seen.has(s))return false;seen.add(s);return true;}).join('\n');}
    if(operation==='upper')return text.toUpperCase();
    if(operation==='lower')return text.toLowerCase();
    throw Error('operation');
  }
  const lengths={'SHA-256':64,'SHA-384':96,'SHA-512':128};
  function expectedDigest(text,algorithm){const v=text.trim().toLowerCase();if(!lengths[algorithm]||v.length!==lengths[algorithm]||!/^[a-f0-9]+$/.test(v))throw Error('hash');return v;}
  function escapeICS(value){return String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');}
  function foldICS(line){let result='',bytes=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>75){result+='\r\n ';bytes=1;}result+=ch;bytes+=n;}return result;}
  function planCalendar(plan,now=new Date()){
    const dates=[...new Set(plan.sessions.map(s=>s.date))],lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Biuret//StudyFlow//EN','CALSCALE:GREGORIAN'];
    const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    for(const date of dates){
      const sessions=plan.sessions.filter(s=>s.date===date),start=date.replaceAll('-','');
      const end=new Date(date+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);
      const identity=[plan.config.template,plan.config.level,plan.config.minutes,plan.config.days.join(''),plan.config.start,date].join('-');
      const ar=plan.config.locale==='ar',minutes=sessions.reduce((n,s)=>n+s.minutes,0);
      lines.push('BEGIN:VEVENT',`UID:${identity}@demos.biuret.dev`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replaceAll('-','')}`,'TRANSP:TRANSPARENT',
        'SUMMARY:'+escapeICS(`StudyFlow · ${minutes} ${ar?'دقيقة':'min'}`),
        'DESCRIPTION:'+escapeICS(sessions.map(s=>`${s.kind}: ${s.topic} (${s.minutes} ${ar?'دقيقة':'min'})`).join('\n')),'END:VEVENT');
    }
    lines.push('END:VCALENDAR');return lines.map(foldICS).join('\r\n')+'\r\n';
  }
  const api={MAX_TEXT,sortedJSON,jsonStats,textStats,cleanText,expectedDigest,planCalendar};
  if(typeof module!=='undefined')module.exports=api;else root.Workbench=api;
})(typeof window==='undefined'?{}:window);
