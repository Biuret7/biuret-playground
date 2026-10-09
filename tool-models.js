(function(root){
  const MAX_JSON=1024*1024,MAX_FILE=100*1024*1024;
  function formatJSON(text,compact=false){
    if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_JSON)throw new Error('size');
    if(!text.trim())throw new Error('empty');
    return JSON.stringify(JSON.parse(text),null,compact?0:2);
  }
  function normalizeHash(value){
    const result=String(value).trim().toLowerCase();
    if(!/^[a-f0-9]{64}$/.test(result))throw new Error('hash');
    return result;
  }
  function remaining(state,now){return Math.max(0,state.running?state.remaining-(now-state.started):state.remaining);}
  const api={formatJSON,normalizeHash,remaining,MAX_JSON,MAX_FILE};
  if(typeof module!=='undefined')module.exports=api;else root.PlaygroundTools=api;
})(typeof window==='undefined'?{}:window);
