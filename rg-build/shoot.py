#!/usr/bin/env python3
"""Screenshot built pages at desktop and phone widths. usage: shoot.py outdir page1.html [page2.html ...] [--full]"""
import sys, subprocess, time, os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent / 'rg'
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
pages = [a for a in sys.argv[2:] if not a.startswith('--')]
full = '--full' in sys.argv
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '-d', str(root)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w, h, tag in [(1440, 900, 'd'), (390, 844, 'm')]:
            ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, reduced_motion='reduce')
            pg = ctx.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            for name in pages:
                pg.goto(f'http://localhost:8765/{name}', wait_until='networkidle')
                pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
                pg.wait_for_timeout(700)
                ow = pg.evaluate('document.documentElement.scrollWidth')
                pg.screenshot(path=str(out / f'{name[:-5]}-{tag}.png'), full_page=full)
                print(name, tag, 'scrollWidth', ow, 'errors', errs[-3:] if errs else '')
                errs.clear()
            ctx.close()
        b.close()
finally:
    srv.terminate()
