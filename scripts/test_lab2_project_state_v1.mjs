import fs from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

const source=await fs.readFile(new URL('../site/lab2/project-state.js',import.meta.url),'utf8');
const store=new Map();
globalThis.window={};
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
globalThis.localStorage={getItem:key=>store.has(key)?store.get(key):null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)};
new Function(source)();
const state=window.Lab2ProjectState;
if(!state)throw new Error('LAB2_PROJECT_STATE_NOT_EXPOSED');

const raw=await state.setRawIdea({name:'Test',description:'Une idée suffisamment détaillée pour le test.',references:[]});
if(raw.status!=='CONFIRMED'||raw.confirmed!==true)throw new Error('LAB2_RAW_IDEA_MUST_BE_CONFIRMED');
const understanding=await state.setArtifact('understanding',{status:'READY',contractVersion:'lab2-understanding-v4',inputFingerprint:raw.outputFingerprint,data:{one_liner:'Une idée comprise',problem:'Un problème compris'}});
state.confirmArtifact('understanding',{expectedOutputFingerprint:understanding.outputFingerprint});
await state.setArtifact('research',{status:'READY',contractVersion:'lab2-research-v3',inputFingerprint:understanding.outputFingerprint,data:{ok:true}});
await state.setArtifact('improvements',{status:'READY',contractVersion:'lab2-improvements-v2',data:{proposals:[1,2,3]}});
await state.setArtifact('definition',{status:'CONFIRMED',contractVersion:'lab2-definition-v1',data:{brief:'v1'}});
await state.setArtifact('feasibility',{status:'CONFIRMED',contractVersion:'lab2-feasibility-v1',data:{level:'LOW',resolved_decisions:{}}});
await state.setArtifact('structure',{status:'CONFIRMED',contractVersion:'lab2-structure-v3',data:{pages:['/']}});
await state.setArtifact('design',{status:'CONFIRMED',contractVersion:'lab2-design-v1',data:{direction:'d1'}});
await state.setArtifact('mockups',{status:'READY',contractVersion:'lab2-mockups-v1',data:{pages:['home']}});
await state.setArtifact('presentation',{status:'READY',contractVersion:'lab2-presentation-v1',data:{slides:10}});

await state.setArtifact('feasibility',{status:'CONFIRMED',contractVersion:'lab2-feasibility-v1',data:{level:'MEDIUM',resolved_decisions:{'Paiement ?':'Oui'}}});
let snapshot=state.read();
for(const stage of ['structure','design','mockups','presentation'])if(snapshot.artifacts[stage].status!=='STALE')throw new Error(`LAB2_FEASIBILITY_DEPENDENCY_INVALIDATION_FAILED_${stage.toUpperCase()}`);

await state.setArtifact('structure',{status:'CONFIRMED',contractVersion:'lab2-structure-v3',data:{pages:['/']}});
await state.setArtifact('design',{status:'CONFIRMED',contractVersion:'lab2-design-v1',data:{direction:'d1'}});
await state.setArtifact('mockups',{status:'READY',contractVersion:'lab2-mockups-v1',data:{pages:['home']}});
await state.setArtifact('presentation',{status:'READY',contractVersion:'lab2-presentation-v1',data:{slides:10}});
await state.setArtifact('structure',{status:'CONFIRMED',contractVersion:'lab2-structure-v3',data:{pages:['/','/contact']}});
snapshot=state.read();
if(snapshot.artifacts.design.status!=='STALE'||snapshot.artifacts.mockups.status!=='STALE'||snapshot.artifacts.presentation.status!=='STALE')throw new Error('LAB2_STRUCTURE_DEPENDENCY_INVALIDATION_FAILED');

await state.setArtifact('design',{status:'CONFIRMED',contractVersion:'lab2-design-v1',data:{direction:'d2'}});
await state.setArtifact('mockups',{status:'READY',contractVersion:'lab2-mockups-v1',data:{pages:['home','contact']}});
await state.setArtifact('presentation',{status:'READY',contractVersion:'lab2-presentation-v1',data:{slides:11}});
await state.setArtifact('design',{status:'CONFIRMED',contractVersion:'lab2-design-v1',data:{direction:'d3'}});
snapshot=state.read();
if(snapshot.artifacts.structure.status==='STALE')throw new Error('LAB2_DESIGN_CHANGE_MUST_NOT_INVALIDATE_STRUCTURE');
if(snapshot.artifacts.mockups.status!=='STALE'||snapshot.artifacts.presentation.status!=='STALE')throw new Error('LAB2_DESIGN_DEPENDENCY_INVALIDATION_FAILED');

await state.setRawIdea({name:'Test',description:'Une idée modifiée suffisamment détaillée.',references:[]});
snapshot=state.read();
for(const stage of state.STAGES.filter(stage=>stage!=='rawIdea')){
  const artifact=snapshot.artifacts[stage];
  if(artifact.data&&artifact.status!=='STALE')throw new Error(`LAB2_RAW_CHANGE_MUST_STALE_${stage.toUpperCase()}`);
}
console.log('lab2-project-state-v1: ok (feasibility + downstream dependency invalidation verified)');
