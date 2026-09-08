from pathlib import Path

path = Path(__file__).with_name('native-project-progress-migrate.py')
source = path.read_text(encoding='utf-8')
old = '''# Version/cache bust + deployment guards.
for path_name, text in [('boot',boot),('index',index),('worker',worker),('stability',stability),('deploy',deploy)]:
    if OLD not in text:
        raise SystemExit(f'{path_name}: old version marker missing')

boot = boot.replace(OLD, NEW)
index = index.replace(OLD, NEW)
worker = worker.replace(OLD, NEW)
stability = stability.replace(OLD, NEW)
deploy = deploy.replace(OLD, NEW)
'''
new = '''# Version/cache bust + deployment guards. Runtime files are matched by structure,
# so a harmless formatting/cache-query difference cannot block the migration.
boot, n_boot = re.subn(r"const VERSION = 'v[^']+'", f"const VERSION = '{NEW}'", boot, count=1)
index, n_index = re.subn(r'boot\\.js\\?v=[^"\\']+', f'boot.js?v={NEW}', index, count=1)
worker, n_worker = re.subn(r"version: 'v[^']+'", f"version: '{NEW}'", worker, count=1)
if n_boot != 1 or n_index != 1 or n_worker != 1:
    raise SystemExit(f'version markers: boot={n_boot} index={n_index} worker={n_worker}')
if OLD not in stability:
    raise SystemExit('stability: old version marker missing')
if OLD not in deploy:
    raise SystemExit('deploy: old version marker missing')
stability = stability.replace(OLD, NEW)
deploy = deploy.replace(OLD, NEW)
'''
if source.count(old) != 1:
    raise SystemExit(f'runner patch expected one version block, got {source.count(old)}')
source = source.replace(old, new, 1)
ns = {'__file__': str(path), '__name__': '__main__'}
exec(compile(source, str(path), 'exec'), ns, ns)
