# Timbercycle — Recycle Group edition

The Timbercycle pages wrapped in the recycle.net.au design system (nav, footer, Archivo/Inter/Plex Mono, #0E1114 / #F1F0EC / copper #C2804F).
Content comes from the Timbercycle pages in the repo root — edit those, then rebuild.

    python3 rg-build/build.py preview   # -> rg/  (GitHub Pages preview, links out to recycle.net.au)
    python3 rg-build/build.py install   # -> rg-build/out/timbercycle/  (copy into the recycle.net.au repo at /timbercycle/)

QA helpers: rg-build/shoot.py (desktop + phone screenshots), rg-build/contrast.py (flags text under 3:1).
Pages carry noindex while in preview.
