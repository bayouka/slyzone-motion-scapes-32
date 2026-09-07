const VERSION = '4b4c auth recovery v1.0.0';
const config = window.__4B4C_CONFIG__ || {};
const app = document.getElementById('app');
const SESSION_KEY = '4b4c.supabase.session.v2';

if (!app || !config.supabaseUrl || !config.supabasePublishableKey) {
  console.warn(`${VERSION}: configuration unavailable`);
} else {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const authBase = String(config.supabaseUrl).replace(/\/$/, '');
  const apiKey = config.supabasePublishableKey;
  let modal = null;
  let previousFocus = null;
  let scheduled = false;
  let recoveryState = null;

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }
  function saveSession(session) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
    catch {}
  }
  function cleanRecoveryUrl(targetHash = '#/dashboard') {
    const url = new URL(location.href);
    url.searchParams.delete('recovery');
    url.searchParams.delete('error');
    url.searchParams.delete('error_code');
    url.searchParams.delete('error_description');
    url.hash = targetHash;
    history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
  }
  function captureRecoveryRedirect() {
    const raw = (location.hash || '').replace(/^#/, '');
    const params = new URLSearchParams(raw);
    const type = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error = params.get('error_description') || params.get('error');
    const queryRecovery = new URLSearchParams(location.search).get('recovery') === '1';

    if (error && (queryRecovery || type === 'recovery')) {
      recoveryState = { mode:'error', message:error };
      const url = new URL(location.href);
      url.hash = '#/dashboard';
      history.replaceState({}, '', url.pathname + url.search + url.hash);
      return;
    }
    if (type === 'recovery' && accessToken && refreshToken) {
      const expiresIn = Number(params.get('expires_in') || 3600);
      const now = Math.floor(Date.now() / 1000);
      saveSession({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: params.get('token_type') || 'bearer',
        expires_in: expiresIn,
        expires_at: now + expiresIn,
      });
      recoveryState = { mode:'change', recovery:true };
      const url = new URL(location.href);
      url.searchParams.set('recovery', '1');
      url.hash = '#/dashboard';
      history.replaceState({}, '', url.pathname + url.search + url.hash);
    } else if (queryRecovery) {
      const session = readSession();
      recoveryState = session?.access_token ? { mode:'change', recovery:true } : { mode:'error', message:'Le lien de récupération est invalide ou a expiré.' };
    }
  }

  async function request(path, { method='POST', body=null, token=null } = {}) {
    const response = await fetch(`${authBase}${path}`, {
      method,
      headers: {
        apikey: apiKey,
        'Content-Type':'application/json',
        ...(token ? { Authorization:`Bearer ${token}` } : {})
      },
      body: body === null ? undefined : JSON.stringify(body)
    });
    let payload = null;
    const text = await response.text();
    if (text) {
      try { payload = JSON.parse(text); }
      catch { payload = { message:text }; }
    }
    if (!response.ok) throw new Error(payload?.msg || payload?.message || payload?.error_description || payload?.error || `Erreur ${response.status}`);
    return payload;
  }

  function ensureStyles() {
    if (document.getElementById('auth-recovery-v1-styles')) return;
    const style = document.createElement('style');
    style.id = 'auth-recovery-v1-styles';
    style.textContent = `
      .auth-recovery-link{border:0;background:none;padding:0;color:var(--live-primary,#3867f4);font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none}
      .auth-recovery-link:hover{text-decoration:underline}.auth-recovery-link:focus-visible{outline:3px solid rgba(56,103,244,.28);outline-offset:3px;border-radius:5px}
      .auth-recovery-under-password{display:flex;justify-content:flex-end;margin-top:8px}
      .auth-recovery-backdrop{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(10,18,35,.56);backdrop-filter:blur(5px)}
      .auth-recovery-modal{width:min(520px,100%);max-height:min(720px,calc(100vh - 36px));overflow:auto;background:#fff;border:1px solid rgba(16,24,40,.12);border-radius:22px;box-shadow:0 28px 80px rgba(16,24,40,.24);padding:22px;color:#172033}
      .auth-recovery-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;margin-bottom:18px}.auth-recovery-head h2{margin:3px 0 5px;font-size:22px}.auth-recovery-head p{margin:0;color:#667085;line-height:1.5}.auth-recovery-close{width:40px;height:40px;border:1px solid #e3e8ef;border-radius:12px;background:#fff;cursor:pointer;font-size:21px;color:#667085}
      .auth-recovery-form{display:grid;gap:14px}.auth-recovery-field{display:grid;gap:6px}.auth-recovery-field label{font-weight:700;font-size:13px}.auth-recovery-field input{width:100%;box-sizing:border-box;border:1px solid #d7dee8;border-radius:12px;padding:11px 12px;font:inherit;min-height:44px}.auth-recovery-field input:focus{outline:3px solid rgba(56,103,244,.14);border-color:#3867f4}
      .auth-recovery-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:5px}.auth-recovery-btn{min-height:44px;border:1px solid #d7dee8;border-radius:12px;padding:9px 14px;background:#fff;font:inherit;font-weight:700;cursor:pointer}.auth-recovery-btn.primary{background:#3867f4;color:#fff;border-color:#3867f4}.auth-recovery-btn[disabled]{opacity:.55;cursor:wait}
      .auth-recovery-note{padding:11px 12px;border-radius:12px;background:#f5f8ff;border:1px solid #dfe8ff;color:#475467;font-size:13px;line-height:1.5}.auth-recovery-error{padding:11px 12px;border-radius:12px;background:#fff5f5;border:1px solid #ffd4d4;color:#9b1c1c;font-size:13px;line-height:1.5}.auth-recovery-success{padding:11px 12px;border-radius:12px;background:#f2fbf7;border:1px solid #ccebdc;color:#166443;font-size:13px;line-height:1.5}
      .auth-profile-password{margin-top:10px;width:100%}
      @media(max-width:560px){.auth-recovery-backdrop{padding:0;align-items:end}.auth-recovery-modal{border-radius:22px 22px 0 0;max-height:88vh;padding:19px}.auth-recovery-actions{flex-direction:column-reverse}.auth-recovery-btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function closeModal({ restoreFocus=true } = {}) {
    if (!modal) return;
    modal.remove();
    modal = null;
    if (restoreFocus) previousFocus?.focus?.();
    previousFocus = null;
  }
  function openModal({ title, subtitle, body, onReady }) {
    closeModal({ restoreFocus:false });
    previousFocus = document.activeElement;
    const wrap = document.createElement('div');
    wrap.className = 'auth-recovery-backdrop';
    wrap.innerHTML = `<section class="auth-recovery-modal" role="dialog" aria-modal="true" aria-labelledby="auth-recovery-title"><div class="auth-recovery-head"><div><span style="font-size:12px;font-weight:800;letter-spacing:.08em;color:#3867f4">COMPTE 2B2C</span><h2 id="auth-recovery-title">${esc(title)}</h2><p>${esc(subtitle || '')}</p></div><button class="auth-recovery-close" type="button" aria-label="Fermer">×</button></div>${body}</section>`;
    wrap.addEventListener('click', (event) => { if (event.target === wrap || event.target.closest('.auth-recovery-close')) closeModal(); });
    document.body.appendChild(wrap);
    modal = wrap;
    wrap.querySelector('input,button:not(.auth-recovery-close)')?.focus();
    onReady?.(wrap);
  }

  function showForgot(email = '') {
    openModal({
      title:'Mot de passe oublié',
      subtitle:'Recevez un lien sécurisé pour choisir un nouveau mot de passe.',
      body:`<form class="auth-recovery-form" data-auth-recovery-request><div class="auth-recovery-field"><label for="auth-recovery-email">Adresse email</label><input id="auth-recovery-email" type="email" name="email" autocomplete="email" required value="${esc(email)}"></div><div class="auth-recovery-note">Pour protéger les comptes, 2b2c affiche le même résultat qu’une adresse soit enregistrée ou non.</div><div data-auth-recovery-feedback aria-live="polite"></div><div class="auth-recovery-actions"><button class="auth-recovery-btn" type="button" data-auth-recovery-cancel>Annuler</button><button class="auth-recovery-btn primary" type="submit">Envoyer le lien</button></div></form>`,
      onReady: (wrap) => {
        wrap.querySelector('[data-auth-recovery-cancel]').addEventListener('click', () => closeModal());
        wrap.querySelector('[data-auth-recovery-request]').addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const button = form.querySelector('button[type="submit"]');
          const feedback = form.querySelector('[data-auth-recovery-feedback]');
          const emailValue = String(new FormData(form).get('email') || '').trim().toLowerCase();
          if (!emailValue) return;
          button.disabled = true;
          feedback.innerHTML = '';
          try {
            const redirect = `${location.origin}${location.pathname}?recovery=1`;
            await request(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`, { body:{ email:emailValue } });
            feedback.innerHTML = '<div class="auth-recovery-success"><strong>Email demandé.</strong><br>Si cette adresse possède un compte, un lien de récupération vient d’être envoyé. Vérifiez aussi les courriers indésirables.</div>';
            button.textContent = 'Lien demandé';
          } catch (error) {
            const message = /rate|limit|seconds/i.test(String(error.message)) ? 'Un lien a déjà été demandé récemment. Attendez environ une minute avant de réessayer.' : 'Le lien n’a pas pu être envoyé pour le moment. Réessayez dans quelques instants.';
            feedback.innerHTML = `<div class="auth-recovery-error">${esc(message)}</div>`;
            button.disabled = false;
          }
        });
      }
    });
  }

  function showChangePassword({ recovery=false } = {}) {
    const session = readSession();
    if (!session?.access_token) {
      showForgot('');
      return;
    }
    openModal({
      title: recovery ? 'Choisir un nouveau mot de passe' : 'Changer votre mot de passe',
      subtitle: recovery ? 'Votre lien a été vérifié. Définissez maintenant votre nouveau mot de passe.' : 'Le nouveau mot de passe sera appliqué immédiatement à votre compte.',
      body:`<form class="auth-recovery-form" data-auth-password-change><div class="auth-recovery-field"><label for="auth-new-password">Nouveau mot de passe</label><input id="auth-new-password" type="password" name="password" autocomplete="new-password" minlength="8" required></div><div class="auth-recovery-field"><label for="auth-new-password-confirm">Confirmer le nouveau mot de passe</label><input id="auth-new-password-confirm" type="password" name="confirmation" autocomplete="new-password" minlength="8" required></div><div class="auth-recovery-note">Utilisez au minimum 8 caractères. Évitez un mot de passe déjà utilisé sur un autre service.</div><div data-auth-recovery-feedback aria-live="polite"></div><div class="auth-recovery-actions"><button class="auth-recovery-btn" type="button" data-auth-recovery-cancel>${recovery ? 'Plus tard' : 'Annuler'}</button><button class="auth-recovery-btn primary" type="submit">Enregistrer le mot de passe</button></div></form>`,
      onReady: (wrap) => {
        wrap.querySelector('[data-auth-recovery-cancel]').addEventListener('click', () => {
          if (recovery) cleanRecoveryUrl('#/dashboard');
          recoveryState = null;
          closeModal();
        });
        wrap.querySelector('[data-auth-password-change]').addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const fd = new FormData(form);
          const password = String(fd.get('password') || '');
          const confirmation = String(fd.get('confirmation') || '');
          const button = form.querySelector('button[type="submit"]');
          const feedback = form.querySelector('[data-auth-recovery-feedback]');
          if (password.length < 8) { feedback.innerHTML = '<div class="auth-recovery-error">Le mot de passe doit contenir au moins 8 caractères.</div>'; return; }
          if (password !== confirmation) { feedback.innerHTML = '<div class="auth-recovery-error">Les deux mots de passe ne correspondent pas.</div>'; return; }
          button.disabled = true;
          feedback.innerHTML = '';
          try {
            await request('/auth/v1/user', { method:'PUT', body:{ password }, token:session.access_token });
            feedback.innerHTML = '<div class="auth-recovery-success"><strong>Mot de passe modifié.</strong><br>Votre compte utilise maintenant ce nouveau mot de passe.</div>';
            button.textContent = 'Enregistré';
            recoveryState = null;
            cleanRecoveryUrl('#/profile');
            setTimeout(() => closeModal({ restoreFocus:false }), 900);
          } catch (error) {
            const msg = /expired|jwt|token|session/i.test(String(error.message)) ? 'Votre session de récupération a expiré. Demandez un nouveau lien.' : error.message;
            feedback.innerHTML = `<div class="auth-recovery-error">${esc(msg)}</div>`;
            button.disabled = false;
          }
        });
      }
    });
  }

  function showRecoveryError(message) {
    openModal({
      title:'Lien de récupération inutilisable',
      subtitle:'Ce lien ne permet plus de modifier le mot de passe.',
      body:`<div class="auth-recovery-error">${esc(message || 'Le lien est invalide ou a expiré.')}</div><div class="auth-recovery-actions"><button class="auth-recovery-btn" type="button" data-auth-recovery-close>Retour à la connexion</button><button class="auth-recovery-btn primary" type="button" data-auth-recovery-new>Demander un nouveau lien</button></div>`,
      onReady: (wrap) => {
        wrap.querySelector('[data-auth-recovery-close]').addEventListener('click', () => { recoveryState = null; cleanRecoveryUrl('#/dashboard'); closeModal(); });
        wrap.querySelector('[data-auth-recovery-new]').addEventListener('click', () => { recoveryState = null; cleanRecoveryUrl('#/dashboard'); showForgot(''); });
      }
    });
  }

  function patchLogin() {
    const form = app.querySelector('.auth-card form[data-form="auth"]');
    if (!form || form.dataset.authRecoveryPatched === '1') return;
    const password = form.querySelector('input[name="password"]');
    if (!password) return;
    const submit = form.querySelector('button[type="submit"]');
    const isSignup = /créer/i.test(submit?.textContent || '') && /compte/i.test(submit?.textContent || '');
    if (isSignup) return;
    form.dataset.authRecoveryPatched = '1';
    const row = document.createElement('div');
    row.className = 'auth-recovery-under-password';
    row.innerHTML = '<button class="auth-recovery-link" type="button" data-auth-forgot>Mot de passe oublié ?</button>';
    const passwordWrap = password.closest('.field') || password.parentElement;
    passwordWrap?.insertAdjacentElement('afterend', row);
    row.querySelector('[data-auth-forgot]').addEventListener('click', () => {
      const email = form.querySelector('input[name="email"]')?.value || '';
      showForgot(email);
    });
  }

  function patchProfile() {
    if (!location.hash.startsWith('#/profile')) return;
    const accountCard = [...app.querySelectorAll('.card')].find(card => /Compte\s*&\s*accès/i.test(card.textContent || ''));
    if (!accountCard || accountCard.dataset.authRecoveryProfile === '1') return;
    accountCard.dataset.authRecoveryProfile = '1';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn auth-profile-password';
    button.textContent = 'Changer mon mot de passe';
    button.addEventListener('click', () => showChangePassword({ recovery:false }));
    const signout = accountCard.querySelector('[data-action="signout"]');
    if (signout) accountCard.insertBefore(button, signout);
    else accountCard.appendChild(button);
  }

  function scan() {
    ensureStyles();
    patchLogin();
    patchProfile();
    if (recoveryState && !modal) {
      if (recoveryState.mode === 'change') showChangePassword({ recovery:true });
      else if (recoveryState.mode === 'error') showRecoveryError(recoveryState.message);
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; scan(); });
  }

  captureRecoveryRedirect();
  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList:true, subtree:true });
  window.addEventListener('hashchange', schedule);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal) closeModal(); });
  schedule();
}
