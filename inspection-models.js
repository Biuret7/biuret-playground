(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InspectionModels=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  function compareText(before,after){
    if(typeof before!=='string'||typeof after!=='string'||before.length>25000||after.length>25000)throw Error('size');
    const a=before?before.replace(/\r\n?/g,'\n').split('\n'):[],b=after?after.replace(/\r\n?/g,'\n').split('\n'):[];
    if(a.length>150||b.length>150)throw Error('lines');
    const table=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
    for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)table[i][j]=a[i]===b[j]?table[i+1][j+1]+1:Math.max(table[i+1][j],table[i][j+1]);
    const rows=[];let i=0,j=0;
    while(i<a.length||j<b.length){
      if(i<a.length&&j<b.length&&a[i]===b[j]){rows.push({kind:'same',text:a[i],before:++i,after:++j});}
      else if(j<b.length&&(i===a.length||table[i][j+1]>table[i+1][j]))rows.push({kind:'added',text:b[j],before:null,after:++j});
      else rows.push({kind:'removed',text:a[i],before:++i,after:null});
    }
    return {rows,added:rows.filter(r=>r.kind==='added').length,removed:rows.filter(r=>r.kind==='removed').length,unchanged:rows.filter(r=>r.kind==='same').length};
  }
  function inspectURL(text){
    if(typeof text!=='string'||text.length>4096||/[\u0000-\u0020\\]/.test(text.trim()))throw Error('url');
    let url;try{url=new URL(text.trim());}catch{throw Error('url');}
    if(!['http:','https:'].includes(url.protocol))throw Error('protocol');
    const flags=[];
    if(url.protocol==='http:')flags.push('http');
    if(url.username||url.password)flags.push('userinfo');
    if(url.hostname.includes('xn--'))flags.push('idn');
    if(/^\d+(\.\d+){3}$/.test(url.hostname)||url.hostname.startsWith('['))flags.push('ip');
    if(url.port)flags.push('port');
    if(url.search)flags.push('query');
    return {scheme:url.protocol.slice(0,-1),host:url.hostname,port:url.port||'default',path:url.pathname,query:[...url.searchParams].map(([key,value])=>({key,value})),fragment:url.hash.slice(1),credentials:!!(url.username||url.password),flags};
  }
  return {compareText,inspectURL};
});
