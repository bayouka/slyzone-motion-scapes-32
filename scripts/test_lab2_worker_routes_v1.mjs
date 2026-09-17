import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../src/worker-entry.js',import.meta.url),'utf8');
const importNeedle="import { handleLab2IdeaFeasibility } from './lab2-idea-feasibility.js';";
const routeNeedle="if(url.pathname==='/api/lab2/feasibility')return withSecurityHeaders(await handleLab2IdeaFeasibility(request,lab2Env));";
if(!worker.includes(importNeedle))throw new Error('LAB2_FEASIBILITY_HANDLER_IMPORT_MISSING');
if(!worker.includes(routeNeedle))throw new Error('LAB2_FEASIBILITY_ROUTE_MISSING');
if(worker.indexOf(routeNeedle)>worker.lastIndexOf('return worker.fetch(request,env,ctx);'))throw new Error('LAB2_FEASIBILITY_ROUTE_AFTER_FALLBACK');
console.log('lab2-worker-routes-v1: ok (feasibility route wired before fallback)');