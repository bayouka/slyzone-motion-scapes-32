from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parent
SITE = ROOT / 'site'
JS = SITE / 'assets' / 'live.js'
CSS = SITE / 'assets' / 'live.css'

BASE_JS_SHA = 'b4de25fc4290f263f79e624e959f6c205678cb5ed103fea31d353957db743e9e'
BASE_CSS_SHA = 'd3cf80e1f10ff4599e341ce73a7fd5dcc66f7a662b285f2b72eec3f363f5911d'
OUT_JS_SHA = '0dadac6203ba1b4f66d4b2c38a88a8efb8ebda6ad3bfcfe01abaf3feaadb3efc'
OUT_CSS_SHA = '0f4ff8c0fe36d392cb47039042ec63041587b5ec338d3b9b4bcc09997fec5d65'


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

# Recompose only the Home dashboard's layout wrapper. The actual cards and
# business logic remain byte-for-byte the V4.2.2 implementations.
grid_start_marker = '    <div class="v422-home-grid">'
grid_end_marker = '    </div>`;'
grid_start = js.index(grid_start_marker)
grid_end = js.index(grid_end_marker, grid_start) + len(grid_end_marker)
old_block = js[grid_start:grid_end]
lines = old_block.splitlines()


def unique_line(needle: str) -> str:
    matches = [line for line in lines if needle in line]
    if len(matches) != 1:
        raise SystemExit(f'Home layout marker {needle!r}: expected 1 line, got {len(matches)}')
    return matches[0]


focus = unique_line('v422-focus-card')
meeting = unique_line('v422-meeting-card')
catchup = unique_line('v422-catchup')
deadlines = unique_line('v422-deadlines')
waiting = unique_line('v422-waiting')
projects = unique_line('v422-projects')
unique_line('v422-signals')

new_block = '\n'.join([
    grid_start_marker,
    '      <div class="v422-main-flow">',
    focus,
    '',
    catchup,
    '',
    projects,
    '      </div>',
    '',
    '      <aside class="v422-rail-flow" aria-label="À venir">',
    meeting,
    '',
    deadlines,
    '',
    waiting,
    '      </aside>',
    grid_end_marker,
])
js = js[:grid_start] + new_block + js[grid_end:]
JS.write_text(js)

css_append = r'''

/* 4b4c V4.2.2 — Home coherence pass 2
   Independent main/rail flows, denser projects, no redundant signal card. */
.v422-home-head{min-height:72px!important;padding:0 2px 8px!important;overflow:visible!important}
.v422-home-head h1{font-size:31px!important;color:#1f2c44!important;letter-spacing:-.035em!important;margin:3px 0 3px!important}
.v422-home-head p{font-size:12px!important;color:#617087!important}
.v422-home-head .eyebrow{color:#748197!important}
.home-head-orb{width:88px!important;height:54px!important;margin-right:7px!important;opacity:.58!important}

.v422-home-grid{display:grid!important;grid-template-columns:minmax(0,1fr) 300px!important;gap:18px!important;align-items:start!important}
.v422-main-flow,.v422-rail-flow{display:flex!important;flex-direction:column!important;gap:14px!important;min-width:0!important}
.v422-main-flow>* ,.v422-rail-flow>*{grid-column:auto!important;grid-row:auto!important;margin-top:0!important;box-sizing:border-box!important}
.v422-rail-flow>*{width:100%!important;max-width:none!important}

.v422-focus-card,.v422-catchup,.v422-meeting-card,.v422-deadlines,.v422-waiting{box-shadow:0 11px 30px rgba(45,63,94,.065),inset 0 1px 0 rgba(255,255,255,.92)!important}
.v422-focus-card .section-head.compact{display:flex!important;flex-direction:row!important;align-items:flex-end!important;justify-content:space-between!important;gap:12px!important;flex-wrap:nowrap!important}
.v422-focus-card .section-head.compact>div{min-width:0!important}
.v422-focus-card .section-link{white-space:nowrap!important;flex:none!important}
.v422-focus-card .section-head h2{color:#29364d!important}

.v422-catchup.is-empty{padding:11px 14px!important;min-height:0!important}
.v422-catchup.is-empty .section-head{display:none!important}
.v422-catchup.is-empty .catchup-empty-v421{display:grid!important;grid-template-columns:auto auto 1fr!important;align-items:center!important;justify-content:start!important;gap:7px!important;min-height:32px!important;padding:0!important;border:0!important;background:transparent!important}
.v422-catchup.is-empty .catchup-empty-v421 strong{font-size:11.5px!important;color:#46536a!important}
.v422-catchup.is-empty .catchup-empty-v421 span:last-child{font-size:10px!important;color:#8793a5!important}

.v422-projects{min-width:0!important;margin-top:0!important}
.v422-projects .section-head{margin-bottom:9px!important}
.v422-projects .section-head h2{color:#243149!important}
.v422-projects .v42-project-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;gap:12px!important;overflow:visible!important;padding:0!important;margin:0!important}
.v422-projects .v42-project-card{min-height:205px!important;padding:14px 14px 12px!important}
.v422-projects .project-symbol{width:35px!important;height:35px!important}
.v422-projects .project-title-line{margin:9px 0 8px!important}
.v422-projects .project-title-line h3{font-size:16px!important}
.v422-projects .project-phase-v42{margin-bottom:7px!important}
.v422-projects .v42-project-card .project-personal{min-height:45px!important;padding:7px 9px!important}
.v422-projects .project-progress-row{padding-top:8px!important}
.v422-projects .v42-project-card .progress{margin:6px 0 7px!important}

.mobile-drawer-foot>button{background:rgba(140,48,44,.055)!important;border-color:rgba(225,95,86,.075)!important;color:#d8a29e!important}

@media(max-width:1120px) and (min-width:768px){
  .v422-home-grid{grid-template-columns:minmax(0,1fr) 270px!important;gap:15px!important}
  .v422-projects .v42-project-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))!important}
}

@media(max-width:767px){
  .v422-shell .live-sidebar{display:none!important}
  .v422-shell .live-main{width:100%!important;max-width:100%!important}
  .mobile-menu-backdrop{cursor:pointer!important}
  .mobile-drawer{left:0!important;right:auto!important;width:min(326px,88vw)!important}
  .mobile-drawer-close{display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
  .mobile-drawer .mobile-nav-label{display:block!important;visibility:visible!important;opacity:1!important}

  .v422-home-head{min-height:64px!important;padding:3px 1px 6px!important}
  .v422-home-head h1{font-size:27px!important;margin:2px 0!important;color:#202e47!important}
  .v422-home-head p{font-size:11px!important;line-height:1.4!important;color:#65748a!important}
  .home-head-orb{display:none!important}

  .v422-home-grid{display:block!important}
  .v422-main-flow,.v422-rail-flow{display:flex!important;flex-direction:column!important;gap:11px!important;width:100%!important;min-width:0!important}
  .v422-rail-flow{margin-top:11px!important}
  .v422-main-flow>* ,.v422-rail-flow>*{width:100%!important;max-width:none!important;margin:0!important;box-sizing:border-box!important}

  .v422-focus-card .section-head.compact{display:flex!important;flex-direction:row!important;align-items:flex-end!important;justify-content:space-between!important;gap:8px!important;flex-wrap:nowrap!important}
  .v422-focus-card .section-head.compact h2{font-size:19px!important;line-height:1.15!important}
  .v422-focus-card .section-link{font-size:10px!important;white-space:nowrap!important;margin:0 0 2px!important}

  .v422-catchup.is-empty{padding:10px 12px!important}
  .v422-catchup.is-empty .catchup-empty-v421{grid-template-columns:auto 1fr!important;gap:4px 6px!important}
  .v422-catchup.is-empty .catchup-empty-v421 strong{font-size:11px!important}
  .v422-catchup.is-empty .catchup-empty-v421 span:last-child{grid-column:2!important;font-size:9.5px!important}

  .v422-projects .v42-project-grid{display:grid!important;grid-template-columns:1fr!important;overflow:visible!important;overflow-x:visible!important;gap:9px!important;padding:0!important;margin:0!important;scroll-snap-type:none!important}
  .v422-projects .v42-project-card{display:block!important;flex:none!important;width:100%!important;max-width:none!important;min-height:0!important;padding:13px 14px 11px!important;scroll-snap-align:none!important;margin:0!important}
  .v422-projects .v42-project-card:hover{transform:none!important}
  .v422-projects .project-symbol{width:34px!important;height:34px!important}
  .v422-projects .project-title-line{margin:8px 0 7px!important}
  .v422-projects .project-phase-v42{margin-bottom:6px!important}
  .v422-projects .v42-project-card .project-personal{min-height:42px!important;padding:7px 9px!important}
  .v422-projects .project-progress-row{padding-top:7px!important}
  .v422-projects .v42-project-card .progress{margin:5px 0 6px!important}
  .v422-projects>.section-head{align-items:flex-end!important}
  .v422-projects>.section-head h2{font-size:20px!important}
  .v422-projects>.section-head .section-link{font-size:10px!important;white-space:nowrap!important}

  .v422-meeting-card,.v422-deadlines,.v422-waiting{width:100%!important;max-width:none!important}
}

@media(max-width:420px){
  .mobile-drawer{width:min(318px,90vw)!important}
}
'''
CSS.write_text(CSS.read_text() + css_append)

if sha(JS) != OUT_JS_SHA or sha(CSS) != OUT_CSS_SHA:
    raise SystemExit(f'Unexpected output hashes: js={sha(JS)} css={sha(CSS)}')

print('Home coherence pass 2 output verified')
print('live.js', sha(JS))
print('live.css', sha(CSS))
