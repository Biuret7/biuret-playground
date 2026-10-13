(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    const feedback=api.createFeedback(()=>document.documentElement.lang);
    root.PlaygroundUI={...api,message:feedback.message,refresh:feedback.refresh};
    document.addEventListener('playground:language',feedback.refresh);
  }
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  function createFeedback(locale){
    const messages=new Map();
    function paint(node,value){node.textContent=value[locale()==='ar'?1:0];node.dataset.tone=value[2];}
    function message(node,en='',ar='',tone=''){
      if(!node)return;
      const value=[en,ar,tone];
      if(en||ar)messages.set(node,value);else messages.delete(node);
      paint(node,value);
    }
    function refresh(){for(const [node,value]of messages)paint(node,value);}
    return {message,refresh};
  }
  // A paused, unfinished session keeps its original task and duration.
  function focusEditorLocked(state,configuredMinutes,complete){
    return state.running||(!complete&&state.remaining<configuredMinutes*60000);
  }
  function saveFile(text,name,type='text/plain;charset=utf-8'){
    const url=URL.createObjectURL(new Blob([text],{type})),anchor=document.createElement('a');
    anchor.href=url;anchor.download=name;
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  return {createFeedback,focusEditorLocked,saveFile};
});
