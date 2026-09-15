// 4b4c / 2b2c — dedicated source-fetch Worker candidate V0.1
// Designed for Service Binding RPC only. No public workers.dev route in its Wrangler config.

import { WorkerEntrypoint } from 'cloudflare:workers';
import { fetchEvidenceSourceCandidate, G2_SOURCE_FETCH_SERVICE_CONTRACT } from './source-fetch-service-candidate.js';

export default class SourceFetchWorker extends WorkerEntrypoint {
  async fetchEvidenceSource(locator){
    return fetchEvidenceSourceCandidate(locator);
  }

  async serviceHealth(){
    return {
      ok:true,
      service:'4b4c-source-fetch',
      contract:G2_SOURCE_FETCH_SERVICE_CONTRACT.code,
      public_network_only:true,
      browser_access:false
    };
  }

  async fetch(_request){
    return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
  }
}
