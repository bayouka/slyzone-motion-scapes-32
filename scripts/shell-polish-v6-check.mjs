import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const boot=read('site/assets/boot.js');
const index=read('site/index.html');
const shell=read('site/assets/shell-polish-v6.js');
const live=read('site/assets/live.js');

const fail=(message)=>{console.error(`SHELL POLISH V6 CHECK FAILED: ${message}`);process.exit(1);};

const callPos=boot.indexOf('./call-incoming-v2.js?');
const shellPos=boot.indexOf('./shell-polish-v6.js?');
const homePos=boot.indexOf('./home-v6.js?');
if([callPos,shellPos,homePos].some(pos=>pos<0))fail('boot chain missing call receiver, shell polish or Home V6');
if(!(callPos<shellPos&&shellPos<homePos))fail('shell polish must load after incoming receiver and before Home V6');
if(!index.includes('assets/boot.js?build=522'))fail('shell polish release candidate must expose build 522');

for(const marker of [
  '__4B4C_SHELL_POLISH_V6_OWNER__',
  'a[href="#/calendar"]',
  "'Agenda'",
  'Agenda →',
  '.shell-v6-message-count',
  '.v52-mobile-primary a[href="#/messages"] b',
  'setInterval',
  '2500',
]) if(!shell.includes(marker)) fail(`shell polish missing ${marker}`);

for(const forbidden of ['MutationObserver','SupabaseBrowserClient','api.rpc','api.insert','api.update','api.remove','fetch(']) {
  if(shell.includes(forbidden))fail(`shell polish must remain presentation-only: ${forbidden}`);
}

for(const marker of ['get_message_badges_v2','get_workspace_sync_digest_v1','unreadMessages','#/calendar']) {
  if(!live.includes(marker))fail(`runtime prerequisite missing ${marker}`);
}

console.log('shell polish v6: OK (build 522)');
