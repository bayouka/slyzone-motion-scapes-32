(() => {
  'use strict';

  const STORAGE_KEY='4b4c2.lab2.project-state.v1';
  const VERSION=1;
  const STAGES=['rawIdea','understanding','research','improvements','definition','feasibility','structure','design','mockups','presentation'];
  const VALID_STATUS=new Set(['NOT_STARTED','RUNNING','NEEDS_INPUT','READY','CONFIRMED','STALE','ERROR']);

  const parse=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const now=()=>new Date().toISOString();
  const stable=(value)=>{
    if(Array.isArray(value))return value.map(stable);
    if(value&&typeof value==='object')return Object.keys(value).sort().reduce((out,key)=>{out[key]=stable(value[key]);return out;},{});
    return value;
  };
  const hash=async(value)=>{
    const bytes=new TextEncoder().encode(JSON.stringify(stable(value)));
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  };
  const emptyArtifact=(stage)=>({
    stage,status:'NOT_STARTED',contractVersion:null,inputFingerprint:null,outputFingerprint:null,
    confirmed:false,data:null,provenance:[],updatedAt:null,confirmedAt:null
  });
  const emptyState=()=>({
    version:VERSION,updatedAt:now(),artifacts:Object.fromEntries(STAGES.map(stage=>[stage,emptyArtifact(stage)]))
  });
  const normalizeArtifact=(stage,value)=>({
    ...emptyArtifact(stage),
    ...(value&&typeof value==='object'?value:{}),
    stage,
    status:VALID_STATUS.has(value?.status)?value.status:'NOT_STARTED',
    confirmed:value?.confirmed===true,
    provenance:Array.isArray(value?.provenance)?value.provenance.slice(0,50):[]
  });
  const read=()=>{
    const saved=parse(localStorage.getItem(STORAGE_KEY));
    if(!saved||saved.version!==VERSION||!saved.artifacts)return emptyState();
    return {
      version:VERSION,
      updatedAt:saved.updatedAt||now(),
      artifacts:Object.fromEntries(STAGES.map(stage=>[stage,normalizeArtifact(stage,saved.artifacts[stage])]))
    };
  };
  const write=(state)=>{
    const next={...state,version:VERSION,updatedAt:now()};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
    return next;
  };
  const invalidateAfterInState=(state,stage,reason='upstream_changed')=>{
    const start=STAGES.indexOf(stage);
    if(start<0)return state;
    for(let index=start+1;index<STAGES.length;index+=1){
      const name=STAGES[index];
      const current=normalizeArtifact(name,state.artifacts[name]);
      if(current.status==='NOT_STARTED'&&!current.data)continue;
      state.artifacts[name]={...current,status:'STALE',confirmed:false,confirmedAt:null,provenance:[...current.provenance,{type:'INVALIDATED',reason,at:now()}].slice(-50)};
    }
    return state;
  };
  const getArtifact=(stage)=>read().artifacts[stage]||null;
  const setArtifact=async(stage,{status='READY',contractVersion=null,inputFingerprint=null,data=null,provenance=[]}={})=>{
    if(!STAGES.includes(stage))throw new Error('LAB2_PROJECT_STATE_STAGE_INVALID');
    if(!VALID_STATUS.has(status))throw new Error('LAB2_PROJECT_STATE_STATUS_INVALID');
    const state=read();
    const previous=normalizeArtifact(stage,state.artifacts[stage]);
    const outputFingerprint=data==null?null:await hash(data);
    const changed=Boolean(
      previous.contractVersion!==contractVersion||previous.inputFingerprint!==inputFingerprint||
      previous.outputFingerprint!==outputFingerprint
    );
    if(changed)invalidateAfterInState(state,stage,`${stage}_changed`);
    state.artifacts[stage]={
      stage,status,contractVersion,inputFingerprint,outputFingerprint,confirmed:false,data,
      provenance:Array.isArray(provenance)?provenance.slice(0,50):[],updatedAt:now(),confirmedAt:null
    };
    write(state);
    return state.artifacts[stage];
  };
  const confirmArtifact=(stage,{expectedInputFingerprint=null,expectedOutputFingerprint=null}={})=>{
    if(!STAGES.includes(stage))throw new Error('LAB2_PROJECT_STATE_STAGE_INVALID');
    const state=read();
    const artifact=normalizeArtifact(stage,state.artifacts[stage]);
    if(!artifact.data||!['READY','NEEDS_INPUT','CONFIRMED'].includes(artifact.status))throw new Error('LAB2_PROJECT_STATE_NOT_READY');
    if(expectedInputFingerprint&&artifact.inputFingerprint!==expectedInputFingerprint)throw new Error('LAB2_PROJECT_STATE_INPUT_MISMATCH');
    if(expectedOutputFingerprint&&artifact.outputFingerprint!==expectedOutputFingerprint)throw new Error('LAB2_PROJECT_STATE_OUTPUT_MISMATCH');
    artifact.status='CONFIRMED';artifact.confirmed=true;artifact.confirmedAt=now();artifact.updatedAt=now();
    artifact.provenance=[...artifact.provenance,{type:'HUMAN_CONFIRMATION',at:artifact.confirmedAt}].slice(-50);
    state.artifacts[stage]=artifact;write(state);return artifact;
  };
  const setRawIdea=async(draft,inputFingerprint=null)=>{
    const fp=inputFingerprint||await hash(draft);
    return setArtifact('rawIdea',{status:'CONFIRMED',contractVersion:'lab2-raw-idea-v1',inputFingerprint:fp,data:draft,provenance:[{type:'USER_FACT',at:now()}]});
  };
  const markStatus=(stage,status,{reason=null}={})=>{
    if(!STAGES.includes(stage)||!VALID_STATUS.has(status))return null;
    const state=read();const artifact=normalizeArtifact(stage,state.artifacts[stage]);
    artifact.status=status;artifact.confirmed=status==='CONFIRMED'&&artifact.confirmed;artifact.updatedAt=now();
    if(reason)artifact.provenance=[...artifact.provenance,{type:'STATUS',status,reason,at:now()}].slice(-50);
    state.artifacts[stage]=artifact;write(state);return artifact;
  };
  const invalidateAfter=(stage,reason='manual_invalidation')=>{const state=read();invalidateAfterInState(state,stage,reason);return write(state)};
  const clear=()=>localStorage.removeItem(STORAGE_KEY);

  window.Lab2ProjectState=Object.freeze({
    STORAGE_KEY,VERSION,STAGES:[...STAGES],read,write,hash,getArtifact,setArtifact,confirmArtifact,setRawIdea,markStatus,invalidateAfter,clear
  });
})();