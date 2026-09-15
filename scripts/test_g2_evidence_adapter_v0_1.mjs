import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { advanceEvidenceCandidate, G2CandidateError } from '../src/idea-evidence-adapter-candidate.js';

const idea={id:'00000000-0000-0000-0000-000000000001',engine_revision:7,blueprint_id:'SITE_VITRINE',blueprint_version:'0.5',blueprint_status:'active'};

function emptyPlan(){return {gate_id:'G2',gate_status:'IN_PROGRESS',missing_requirements:[],eligible_system_actions:[],supportive_capabilities:[],inflight_requirements:[],recoverable_action_runs:[],recovery_blocked_action_runs:[],capability_blocked_requirements:[],dominant_user_action:null,projection_fingerprint:'fp'};}

let plannerArgs=null;
const rpc=async(name,args)=>{
  if(name==='plan_idea_evidence_context_candidate_v11'){plannerArgs=args;return emptyPlan();}
  throw new Error(`unexpected rpc ${name}`);
};
const refreshProjection=async()=>({idea,capabilities:{can_write:true}});

const result=await advanceEvidenceCandidate({env:{},idea,canWrite:true,rpc,refreshProjection});
assert.deepEqual(plannerArgs.p_available_paths,['CALC']);
assert.equal(plannerArgs.p_raw_context_available,false);
assert.equal(result.executed_actions,0);

await assert.rejects(
  ()=>advanceEvidenceCandidate({env:{},idea,canWrite:false,rpc,refreshProjection}),
  e=>e instanceof G2CandidateError&&e.status===403&&e.code==='IDEA_WRITE_REQUIRED'
);

await assert.rejects(
  ()=>advanceEvidenceCandidate({env:{},idea:{...idea,blueprint_version:'0.4'},canWrite:true,rpc,refreshProjection}),
  e=>e instanceof G2CandidateError&&e.status===409&&e.code==='G2_BLUEPRINT_0_5_NOT_ACTIVE'
);

const endpoint=await fs.readFile(new URL('../src/idea-evidence-endpoint.js',import.meta.url),'utf8');
assert.match(endpoint,/const executorCapabilities=\{\};/);
assert.match(endpoint,/advanceEvidenceCandidate\(\{env:executorCapabilities/);
assert.match(endpoint,/classify_g2_action_promotion_candidate_v1/);
assert.match(endpoint,/finalize_g2_action_no_resolution_candidate_v1/);
assert.match(endpoint,/promote_g2_system_action_result_candidate_v1/);
assert.match(endpoint,/if\(!projection\.capabilities\?\.can_write\)throw new G2CandidateError\(403,'IDEA_WRITE_REQUIRED'\)/);

console.log('G2 evidence adapter guard tests PASS');
