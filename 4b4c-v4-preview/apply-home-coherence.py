from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parent
SITE = ROOT / 'site'
JS = SITE / 'assets' / 'live.js'
CSS = SITE / 'assets' / 'live.css'

BASE_JS_SHA = 'b4de25fc4290f263f79e624e959f6c205678cb5ed103fea31d353957db743e9e'
BASE_CSS_SHA = 'd3cf80e1f10ff4599e341ce73a7fd5dcc66f7a662b285f2b72eec3f363f5911d'
OUT_JS_SHA = '73571cd156f8bf3e01fda13a2068cdcf0e72c03e6d1a09d18302a90373a44ec7'
OUT_CSS_SHA = 'ba8d85153fb525849df5b83b1ef86625f428ace125ae85ab12e7b95673e37683'


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, got {count}')
    return text.replace(old, new, 1)


if sha(JS) != BASE_JS_SHA or sha(CSS) != BASE_CSS_SHA:
    raise SystemExit('Refusing to patch: source is not the exact deployed V4.2.2 baseline')

js = JS.read_text()
js = replace_once(
    js,
    "window.addEventListener('hashchange', () => render());",
    "window.addEventListener('hashchange', () => { state.mobileMenuOpen=false; state.userMenuOpen=false; state.notificationOpen=false; render(); });\n  window.addEventListener('resize', () => { if (window.innerWidth > 767 && state.mobileMenuOpen) { state.mobileMenuOpen=false; document.documentElement.classList.remove('mobile-menu-open'); document.body.classList.remove('mobile-menu-open'); render(); } });",
    'mobile menu route safety',
)
js = replace_once(
    js,
    "${attention.length?`${attention.length} élément${attention.length>1?'s':''} pour vous`:'Vous êtes à jour'}",
    "${attention.length?`${attention.length} élément${attention.length>1?'s':''} à traiter`:'Vous êtes à jour'}",
    'attention wording',
)
js = replace_once(
    js,
    "${state.projects.slice(0,6).map(projectCardV3).join('')}",
    "${state.projects.slice(0,3).map(projectCardV3).join('')}",
    'home project count',
)
JS.write_text(js)

css_append = r'''

/* 4b4c V4.2.2 — Home coherence pass: hierarchy, density and mobile navigation safety */
.v422-home-head{min-height:76px!important;padding:0 2px 10px!important;overflow:visible!important}
.v422-home-head h1{font-size:31px!important;color:#243047!important;letter-spacing:-.035em!important;margin:4px 0 3px!important}
.v422-home-head p{font-size:12px!important;color:#5f6d83!important}
.v422-home-head .eyebrow{color:#7a879b!important}
.home-head-orb{width:92px!important;height:58px!important;margin-right:8px!important;opacity:.62!important}

.v422-home-grid{grid-template-columns:minmax(0,1fr) 310px!important;gap:15px 18px!important;align-items:start!important}
.v422-focus-card{grid-column:1!important;grid-row:1!important}
.v422-meeting-card{grid-column:2!important;grid-row:1!important}
.v422-catchup{grid-column:1!important;grid-row:2!important}
.v422-deadlines{grid-column:2!important;grid-row:2!important}
.v422-projects{grid-column:1 / -1!important;grid-row:3!important;margin-top:2px!important}
.v422-waiting{grid-column:1 / -1!important;grid-row:4!important}
.v422-signals{grid-column:1 / -1!important;grid-row:5!important}
.v422-signals:has(.signal-clear){display:none!important}

.v422-focus-card,.v422-catchup,.v422-meeting-card,.v422-deadlines,.v422-signals,.v422-waiting{box-shadow:0 12px 34px rgba(45,63,94,.07),inset 0 1px 0 rgba(255,255,255,.92)!important}
.v422-focus-card .section-head h2{color:#303b50!important}
.v422-catchup.is-empty{padding:12px 15px!important;min-height:0!important}
.v422-catchup.is-empty .section-head{display:none!important}
.v422-catchup.is-empty .catchup-empty-v421{display:grid!important;grid-template-columns:auto auto 1fr!important;align-items:center!important;justify-content:start!important;gap:7px!important;min-height:34px!important;padding:0!important;border:0!important;background:transparent!important}
.v422-catchup.is-empty .catchup-empty-v421 strong{font-size:11.5px!important;color:#46536a!important}
.v422-catchup.is-empty .catchup-empty-v421 span:last-child{font-size:10px!important;color:#8b96a7!important}
.v422-projects .section-head{margin-bottom:10px!important}
.v422-projects .section-head h2{color:#27344a!important}
.v422-projects .v42-project-card{min-height:216px!important}
.v422-signals .rail-card-head{margin-bottom:10px!important}
.v422-signals .v422-signal-summary{grid-template-columns:repeat(3,minmax(0,1fr))!important;max-width:620px}

@media(max-width:767px){
  .v422-shell .live-sidebar{display:none!important}
  .v422-shell .live-main{width:100%!important;max-width:100%!important}
  .mobile-menu-backdrop{cursor:pointer!important}
  .mobile-drawer{left:0!important;right:auto!important}
  .mobile-drawer-close{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
  .mobile-drawer .mobile-nav-label{display:block!important;visibility:visible!important;opacity:1!important}

  .v422-home-head{min-height:68px!important;padding:4px 1px 7px!important}
  .v422-home-head h1{font-size:27px!important;margin:3px 0 2px!important}
  .v422-home-head p{font-size:11px!important;line-height:1.4!important}

  .v422-home-grid{display:flex!important;flex-direction:column!important;gap:11px!important}
  .v422-focus-card{order:1!important}
  .v422-catchup{order:2!important}
  .v422-projects{order:3!important;width:100%!important;overflow:visible!important;margin-top:1px!important}
  .v422-meeting-card{order:4!important}
  .v422-deadlines{order:5!important}
  .v422-waiting{order:6!important}
  .v422-signals{order:7!important}

  .v422-catchup.is-empty{padding:11px 12px!important}
  .v422-catchup.is-empty .catchup-empty-v421{grid-template-columns:auto 1fr!important;gap:5px!important}
  .v422-catchup.is-empty .catchup-empty-v421 strong{font-size:11px!important}
  .v422-catchup.is-empty .catchup-empty-v421 span:last-child{grid-column:2!important;font-size:9.5px!important}

  .v422-projects .v42-project-grid{display:grid!important;grid-template-columns:1fr!important;overflow:visible!important;overflow-x:visible!important;gap:10px!important;padding:0!important;margin:0!important;scroll-snap-type:none!important}
  .v422-projects .v42-project-card{display:block!important;flex:none!important;width:100%!important;max-width:none!important;min-height:188px!important;scroll-snap-align:none!important;margin:0!important}
  .v422-projects .v42-project-card:hover{transform:none!important}
  .v422-projects>.section-head{align-items:flex-end!important}
  .v422-projects>.section-head h2{font-size:20px!important}
  .v422-projects>.section-head .section-link{font-size:10px!important}

  .v422-signals .v422-signal-summary{grid-template-columns:repeat(3,minmax(0,1fr))!important}
}

@media(max-width:420px){
  .mobile-drawer{width:min(330px,92vw)!important}
  .v422-projects .v42-project-card{width:100%!important;max-width:none!important}
}
'''
CSS.write_text(CSS.read_text() + css_append)

if sha(JS) != OUT_JS_SHA or sha(CSS) != OUT_CSS_SHA:
    raise SystemExit(f'Unexpected output hashes: js={sha(JS)} css={sha(CSS)}')

print('Home coherence output verified')
print('live.js', sha(JS))
print('live.css', sha(CSS))
