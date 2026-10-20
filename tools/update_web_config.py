"""Refresh package metadata when reusing the pinned, checked-in Web runtime."""
import json
import re
from pathlib import Path

page = Path('web/index.html')
text = page.read_text()
match = re.search(r'const GODOT_CONFIG = (\{[^\n]+\});', text)
if not match:
    raise SystemExit('Missing Godot Web configuration')
config = json.loads(match.group(1))
for name in ('index.pck', 'index.wasm'):
    config['fileSizes'][name] = Path('web', name).stat().st_size
page.write_text(text[:match.start(1)] + json.dumps(config, separators=(',', ':')) + text[match.end(1):])
