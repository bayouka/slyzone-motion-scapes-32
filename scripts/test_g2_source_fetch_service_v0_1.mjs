import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fetchEvidenceSourceCandidate, G2SourceFetchServiceError, G2_SOURCE_FETCH_SERVICE_CONTRACT } from '../src/source-fetch-service-candidate.js';
import { G2SourceFetchError } from '../src/idea-source-fetch-candidate.js';

await assert.rejects(
  ()=>fetchEvidenceSourceCandidate(null,{fetchSource:async()=>({})}),
  e=>e instanceof G2SourceFetchServiceError&&e.code==='SRC_SERVICE_LOCATOR_REQUIRED'
);
await assert.rejects(
  ()=>fetchEvidenceSourceCandidate('x'.repeat(4097),{fetchSource:async()=>({})}),
  e=>e instanceof G2SourceFetchServiceError&&e.code==='SRC_SERVICE_LOCATOR_TOO_LONG'
);
await assert.rejects(
  ()=>fetchEvidenceSourceCandidate('https://127.0.0.1/',{fetchSource:async()=>{throw new G2SourceFetchError('SRC_PRIVATE_IP_FORBIDDEN')}}),
  e=>e instanceof G2SourceFetchServiceError&&e.code==='SRC_PRIVATE_IP_FORBIDDEN'
);
await assert.rejects(
  ()=>fetchEvidenceSourceCandidate('https://example.com/',{fetchSource:async()=>({extracted_text:'body',content_hash:'bad'})}),
  e=>e instanceof G2SourceFetchServiceError&&e.code==='SRC_FETCH_HASH_INVALID'
);

const out=await fetchEvidenceSourceCandidate('  https://example.com/research  ',{
  fetchSource:async locator=>{
    assert.equal(locator,'https://example.com/research');
    return {
      final_url:'https://example.com/research',
      content_type:'text/plain',
      extracted_text:'Les artisans veulent un devis clair.',
      content_hash:'a'.repeat(64),
      fetched_at:'2026-09-16T00:00:00.000Z',
      redirect_count:0
    };
  }
});
assert.equal(out.contract,'g2-source-fetch-service-v0.1');
assert.equal(out.content_hash,'a'.repeat(64));
assert.equal(out.extracted_text,'Les artisans veulent un devis clair.');
assert.equal(G2_SOURCE_FETCH_SERVICE_CONTRACT.public_network_only,true);
assert.equal(G2_SOURCE_FETCH_SERVICE_CONTRACT.browser_access,false);
assert.equal(G2_SOURCE_FETCH_SERVICE_CONTRACT.service_binding_only,true);

const worker=await fs.readFile(new URL('../src/source-fetch-worker-candidate.js',import.meta.url),'utf8');
assert.match(worker,/WorkerEntrypoint/);
assert.match(worker,/fetchEvidenceSource\(locator\)/);
assert.match(worker,/serviceHealth\(\)/);
assert.match(worker,/return new Response\('Not found',\{status:404/);
assert.doesNotMatch(worker,/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_PUBLISHABLE_KEY|TAVILY_API_KEY/);

const config=JSON.parse(await fs.readFile(new URL('../wrangler.source-fetch.jsonc',import.meta.url),'utf8'));
assert.equal(config.name,'4b4c-source-fetch');
assert.equal(config.main,'src/source-fetch-worker-candidate.js');
assert.equal(config.workers_dev,false);
assert.equal(config.preview_urls,false);
assert.deepEqual(config.compatibility_flags,['global_fetch_strictly_public']);
assert.ok(config.compatibility_date>='2024-04-03');

const mainConfig=await fs.readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8');
assert.doesNotMatch(mainConfig,/global_fetch_strictly_public/);
assert.doesNotMatch(mainConfig,/4b4c-source-fetch|SOURCE_FETCH/);

console.log('G2 isolated strictly-public source-fetch service V0.1 candidate tests PASS');
