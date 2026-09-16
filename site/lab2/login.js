(() => {
  'use strict';
  const SESSION_KEY='4b4c.supabase.session.v2';
  const cfg=window.__4B4C2_PREVIEW_CONFIG__||{};
  const q=(id)=>document.getElementById(id);
  const statusBox=q('statusBox'),loginForm=q('loginForm'),connectedActions=q('connectedActions'),errorBox=q('errorBox'),logoutButton=q('logoutButton');
  const setupPanel=q('setupPanel'),copyUserIdButton=q('copyUserIdButton'),copyStatus=q('copyStatus');
  const email=q('email'),password=q('password');
  let currentUserId='';
  const parse=(value)=>{try{return JSON.parse(value)}catch{return null}};
  const save=(session)=>{try{if(session)localStorage.setItem(SESSION_KEY,JSON.stringify(session));else localStorage.removeItem(SESSION_KEY)}catch{}};
  const current=()=>parse(localStorage.getItem(SESSION_KEY));
  const configured=()=>Boolean(cfg.supabaseUrl&&cfg.supabasePublishableKey);
  function showError(message){errorBox.hidden=false;errorBox.textContent=message}
  function clearError(){errorBox.hidden=true;errorBox.textContent=''}
  function renderConnected(user){currentUserId=String(user?.id||'');statusBox.textContent=`Connecté${user?.email?` · ${user.email}`:''}.`;loginForm.hidden=true;connectedActions.hidden=false;setupPanel.hidden=!currentUserId;clearError()}
  function renderDisconnected(message='Connecte-toi avec ton compte 4b4c.'){currentUserId='';statusBox.textContent=message;loginForm.hidden=false;connectedActions.hidden=true;setupPanel.hidden=true;copyStatus.textContent=''}
  async function request(path,init={}){
    const response=await fetch(`${String(cfg.supabaseUrl).replace(/\/$/,'')}${path}`,{...init,headers:{apikey:cfg.supabasePublishableKey,'content-type':'application/json',...(init.headers||{})}});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw Object.assign(new Error(payload?.msg||payload?.message||payload?.error_description||'AUTH_ERROR'),{status:response.status});
    return payload;
  }
  async function verify(){
    if(!configured()){renderDisconnected('Preview non configurée.');loginForm.hidden=true;showError('La configuration publique Supabase manque sur cette preview.');return}
    const session=current();
    if(!session?.access_token){renderDisconnected();return}
    try{
      const user=await request('/auth/v1/user',{headers:{Authorization:`Bearer ${session.access_token}`}});
      renderConnected(user);
    }catch{save(null);renderDisconnected('La session a expiré. Reconnecte-toi.')}
  }
  loginForm.addEventListener('submit',async(event)=>{
    event.preventDefault();clearError();const button=loginForm.querySelector('button');button.disabled=true;
    try{
      const session=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:email.value.trim(),password:password.value})});
      if(!session?.access_token||!session?.refresh_token)throw new Error('AUTH_SESSION_INVALID');
      save(session);password.value='';renderConnected(session.user||null);
    }catch(error){showError(error?.status===400?'Email ou mot de passe incorrect.':'Connexion impossible pour le moment.')}
    finally{button.disabled=false}
  });
  copyUserIdButton.addEventListener('click',async()=>{
    if(!currentUserId)return;
    try{await navigator.clipboard.writeText(currentUserId);copyStatus.textContent='Identifiant copié.'}
    catch{copyStatus.textContent='Copie impossible automatiquement sur ce navigateur.'}
  });
  logoutButton.addEventListener('click',()=>{save(null);renderDisconnected();});
  void verify();
})();
