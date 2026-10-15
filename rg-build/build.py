#!/usr/bin/env python3
"""Build the Recycle Group edition of the Timbercycle site.

Takes the Timbercycle pages in the repo root, keeps their content, and wraps each
one in the Recycle Group chrome (recycle.net.au nav, footer, type and colours).

  python3 rg-build/build.py preview   -> ./rg/            (GitHub Pages preview, links to recycle.net.au)
  python3 rg-build/build.py install   -> ./rg-build/out/timbercycle/  (drop into the recycle.net.au repo at /timbercycle/)
"""
import re, sys, shutil, html
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
MODE = sys.argv[1] if len(sys.argv) > 1 else 'preview'

if MODE == 'preview':
    OUT = ROOT / 'rg'
    RG = 'https://recycle.net.au'          # parent-site links
    CSS_MAIN = 'assets/main.css'           # local copy of the RG stylesheet
    RG_LOGO = 'assets/recycle-logo.svg'
    POLISH = 'assets/polish.js'
else:
    OUT = HERE / 'out' / 'timbercycle'
    RG = ''                                # root-relative inside recycle.net.au
    CSS_MAIN = '/css/main.css?v=4'
    RG_LOGO = '/img/recycle-logo.svg'
    POLISH = '/js/polish.js'

# classes Timbercycle shares with the RG stylesheet -> renamed so the two never fight
COLLIDE = ['big', 'btn', 'card', 'cards', 'cmp', 'cta', 'dark', 'eyebrow', 'hero', 'lead', 'note',
           'num', 'rv', 'split', 'steps', 'stream', 'sub', 'tag', 'val', 'wrap']
REN = {c: 't-' + c for c in COLLIDE}

# Timbercycle colours -> Recycle Group colours
COLOURS = {
    '#E2694C': '#C2804F', '#e2694c': '#C2804F',   # jarrah accent on dark -> RG copper
    '#A93A26': '#7A4E2F', '#a93a26': '#7A4E2F',   # accent on light -> deep copper (AA on #F1F0EC)
    '#D45A3D': '#C2804F', '#d45a3d': '#C2804F',   # timber material
    '#8E2D19': '#5E3A22', '#8e2d19': '#5E3A22',
    '#B7432A': '#8F603F', '#b7432a': '#8F603F',
    '#F8E0D8': '#EADBCB', '#f8e0d8': '#EADBCB',
    '#3B140A': '#2A1A0E', '#3b140a': '#2A1A0E',
    '#0B0B0B': '#0E1114', '#0b0b0b': '#0E1114',
    '#141414': '#14181C', '#1F1D1B': '#1C2126', '#1f1d1b': '#1C2126',
    '#1A1918': '#171B1F', '#1a1918': '#171B1F', '#161616': '#14181C',
    '#F7F4EF': '#E8E6E0', '#f7f4ef': '#E8E6E0',
    '#302E2B': '#1E2226', '#302e2b': '#1E2226',
    '#6E6A64': '#565B60', '#6e6a64': '#565B60',
    '#E6DFD4': '#D3D0C9', '#e6dfd4': '#D3D0C9',
    '#8E877E': '#8A9096', '#8e877e': '#8A9096',
    '#A9A39B': '#A6ACB1', '#a9a39b': '#A6ACB1',
    '#5B5650': '#535A60', '#5b5650': '#535A60',
    '#3B3834': '#30363B', '#3b3834': '#30363B',
    '#CFC9C1': '#C6CBCF', '#cfc9c1': '#C6CBCF',
    '#DDD8D1': '#D8DCDF', '#ddd8d1': '#D8DCDF',
    '#B9B3AA': '#B1B7BC', '#b9b3aa': '#B1B7BC',
    '#C8C2B9': '#BCC2C6', '#c8c2b9': '#BCC2C6',
    '#D6D0C7': '#CCD1D5', '#d6d0c7': '#CCD1D5',
    '#B4AEA6': '#B1B7BC', '#b4aea6': '#B1B7BC', '#AFA9A1': '#ADB3B8', '#afa9a1': '#ADB3B8',
    '#98928A': '#959BA0', '#9C968E': '#999FA4', '#726D66': '#6C7277', '#2A2825': '#25292D',
    '#1B1917': '#181C20', '#EE8165': '#D39A6E', '#7a5a30': '#7A4E2F',
}


def recolour(s):
    for a, b in COLOURS.items():
        s = s.replace(a, b)
    return s


def rename_css(s):
    for a, b in REN.items():
        s = re.sub(r'\.' + re.escape(a) + r'(?![\w-])', '.' + b, s)
    return s


# ---------------------------------------------------------------- CSS
def split_blocks(css):
    """Yield (prelude, body) for each top-level block; body may hold nested blocks."""
    i, n = 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        prelude = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        yield prelude, css[j + 1:k - 1]
        i = k


def scope_sel(sel):
    sel = sel.strip()
    if not sel:
        return None
    if sel in (':root', 'html', 'body', '*', '*::before', '*::after'):
        return {'html': None, ':root': '.tc', 'body': '.tc'}.get(sel, '.tc ' + sel if sel.startswith('*') else '.tc')
    if sel.startswith('html.js'):
        return 'html.js .tc' + sel[len('html.js'):]
    if sel.startswith('html'):
        return None
    if sel.startswith('body'):
        return '.tc' + sel[4:]
    return '.tc ' + sel


def scope_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    out = []
    for pre, body in split_blocks(css):
        if pre.startswith('@media') or pre.startswith('@supports'):
            out.append(pre + '{' + scope_css(body) + '}')
        elif pre.startswith('@keyframes') or pre.startswith('@font-face') or pre.startswith('@page'):
            out.append(pre + '{' + body + '}')
        else:
            sels = [scope_sel(s) for s in pre.split(',')]
            sels = [s for s in sels if s]
            if sels:
                out.append(','.join(sels) + '{' + body.strip() + '}')
    return '\n'.join(out)


def build_css():
    src = (ROOT / 'style.css').read_text()
    css = scope_css(src)
    css = rename_css(css)
    css = recolour(css)
    css = css.replace('"Poppins"', '"Archivo"').replace("'Poppins'", '"Archivo"')
    # Recycle Group is square-cornered: drop radii except true circles
    css = re.sub(r'border-radius:\s*([^;}]+)',
                 lambda m: m.group(0) if '50%' in m.group(1) else 'border-radius:0', css)
    return '/* Timbercycle components, scoped to .tc and recoloured to the Recycle Group palette (generated) */\n' + css


# ---------------------------------------------------------------- HTML
SECTION_NAV = [
    ('index.html', 'Overview'),
    ('pallet-recovery.html', 'Pallet recovery'),
    ('timber-recycling.html', 'Timber &amp; mulch'),
    ('bulk-pallet-programs.html', 'Bulk programs'),
    ('products.html', 'Products'),
    ('pallet-calculator.html', 'Calculator'),
    ('program-builder.html', 'Program builder'),
    ('about.html', 'About'),
    ('faq.html', 'Questions'),
]
GROUPS = {
    'for-': ('Industries', 'for-ports-and-shipping.html'),
    'pallet-collection-': ('Where we collect', 'pallet-collection-melbourne.html'),
}


def rg_nav():
    links = [('/solutions/', 'Solutions'), ('/who-we-work-with/', 'Sectors'), ('/case-studies/', 'Case studies'),
             ('/materials/', 'Materials'), ('/infrastructure/', 'Infrastructure'), ('/reporting/', 'Reporting'),
             ('/the-group/', 'Our businesses'), ('/trace/', 'Trace a load')]
    a = ''.join('<a href="%s%s"%s>%s</a>' % (RG, h, ' aria-current="page"' if t == 'Our businesses' else '', t)
                for h, t in links)
    return f'''<nav class="top"><div class="wrap">
  <a href="{RG}/" class="logo" aria-label="Recycle home"><img class="logo-img" src="{RG_LOGO}" alt="Recycle Group" width="519" height="82"></a>
  <div class="nav-links" id="navLinks">{a}</div>
  <div class="nav-right"><a href="contact.html" class="btn btn-solid nav-cta">Let's work together</a>
  <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="navLinks"><span></span></button></div>
</div></nav>'''


def sub_nav(page):
    items = []
    for href, label in SECTION_NAV:
        cur = page == href
        items.append('<a href="%s"%s>%s</a>' % (href, ' aria-current="page"' if cur else '', label))
    for pre, (label, href) in GROUPS.items():
        cur = page.startswith(pre)
        items.append('<a href="%s"%s>%s</a>' % (href, ' aria-current="page"' if cur else '', label))
    return f'''<div class="tc-bar"><div class="wrap">
  <a class="tc-bar-brand" href="index.html"><b>Timbercycle</b><span>A Recycle Group business</span></a>
  <div class="tc-bar-links">{''.join(items)}</div>
  <a class="tc-bar-cta" href="contact.html">Get a quote</a>
</div></div>'''


def tc_directory():
    return '''<section class="tc-dir"><div class="wrap">
  <div class="tc-dir-g">
    <div><div class="eyebrow">Timbercycle</div>
      <p class="tc-dir-lead">Timber pallet recovery, reuse and recycling at scale. Timber only. Victoria first.</p>
      <ul class="tc-dir-l"><li><a href="tel:134455">13 44 55</a> · <a href="tel:0433225511">0433 225 511</a></li>
      <li><a href="mailto:info@timbercycle.com.au">info@timbercycle.com.au</a></li>
      <li>116 Furner Avenue, North Geelong VIC</li></ul></div>
    <div><div class="fh">What we do</div><ul class="tc-dir-l">
      <li><a href="pallet-recovery.html">Pallet recovery &amp; reuse</a></li><li><a href="timber-recycling.html">Timber recycling &amp; mulch</a></li>
      <li><a href="bulk-pallet-programs.html">Bulk pallet programs</a></li><li><a href="pallet-calculator.html">Pallet calculator</a></li>
      <li><a href="program-builder.html">Program builder</a></li><li><a href="products.html">Products</a></li>
      <li><a href="faq.html">Questions</a></li><li><a href="capability-statement.html">Capability statement</a></li><li><a href="about.html">About Timbercycle</a></li></ul></div>
    <div><div class="fh">Industries</div><ul class="tc-dir-l">
      <li><a href="for-ports-and-shipping.html">Ports &amp; shipping</a></li><li><a href="for-freight-and-3pl.html">Freight &amp; 3PL</a></li>
      <li><a href="for-distribution-centres.html">Distribution centres</a></li><li><a href="for-manufacturers.html">Manufacturers</a></li>
      <li><a href="for-councils-and-transfer-stations.html">Councils &amp; transfer stations</a></li></ul></div>
    <div><div class="fh">Where we collect</div><ul class="tc-dir-l">
      <li><a href="pallet-collection-melbourne.html">Melbourne</a></li><li><a href="pallet-collection-geelong.html">Geelong</a></li>
      <li><a href="pallet-collection-laverton-altona.html">Laverton &amp; Altona</a></li><li><a href="pallet-collection-truganina-derrimut.html">Truganina &amp; Derrimut</a></li>
      <li><a href="pallet-collection-dandenong.html">Dandenong</a></li></ul></div>
  </div>
</div></section>'''


def rg_footer():
    company = [('/solutions/', 'Solutions'), ('/approach/', 'Our approach'), ('/who-we-work-with/', 'Sectors'),
               ('/infrastructure/', 'Infrastructure'), ('/materials/', 'Materials'), ('/reporting/', 'Reporting'),
               ('/assurance/', 'Assurance'), ('/scale/', 'Scale'), ('/about/', 'Leadership')]
    group = [('/the-group/', 'Our businesses'), ('/initiatives/', 'Upcoming initiatives'), ('/impact/', 'Impact dashboard')]
    li = lambda xs: ''.join('<li><a href="%s%s">%s</a></li>' % (RG, h, t) for h, t in xs)
    return f'''<footer class="site"><div class="wrap">
  <div class="fgrid">
    <div><a href="{RG}/"><img class="logo-img" src="{RG_LOGO}" alt="Recycle Group" width="519" height="82"></a>
      <p class="fdesc">Recycling solutions for councils, governments, corporations and infrastructure operators, designed, operated and reported on the group's own collection, transfer, processing and reuse infrastructure.</p>
      <ul class="flist" style="margin-top:18px"><li><a href="mailto:info@recycle.net.au">info@recycle.net.au</a></li><li><a href="{RG}/contact/">Let's work together</a></li></ul></div>
    <div class="fsites"><div class="fh">Our sites</div>
      <div class="fsite"><b>Melbourne office</b><span>Level 2/530 Lonsdale Street<br>Melbourne VIC 3000</span></div>
      <div class="fsite"><b>Sydney office</b><span>Suite 1.01, Level 1, 222 Pitt Street<br>Sydney NSW 2000</span></div>
      <div class="fsite"><b>Canberra office</b><span>Ground Floor, 490 Northbourne Avenue<br>Dickson ACT 2602</span></div>
      <div class="fsite"><b>Recycle Resource Recovery Centres</b><span>116 Furner Avenue<br>North Geelong VIC 3215</span><em>Transfer station · The Mattress Recycling Company · Styro · Timbercycle</em></div>
    </div>
    <div><div class="fh">Company</div><ul class="flist">{li(company)}</ul></div>
    <div><div class="fh">The group</div><ul class="flist">{li(group)}<li><a href="index.html">Timbercycle</a></li></ul></div>
  </div>
  <div class="fmeta"><span>© 2026 Recycle Group Pty Ltd · Timbercycle is a Recycle Group business</span><span>Responsible recovery. Sustainable outcomes.</span></div>
</div></footer>'''


FOOT_JS = '''<script>
(function(){var t=document.getElementById('navToggle'),l=document.getElementById('navLinks');if(!t||!l)return;t.addEventListener('click',function(){var o=l.classList.toggle('open');t.setAttribute('aria-expanded',o?'true':'false');});})();
(function(){var b=document.querySelector('.tc-bar-links .is-cur,.tc-bar-links [aria-current]');if(b&&b.scrollIntoView&&innerWidth<1100){var L=b.parentNode;L.scrollLeft=b.getBoundingClientRect().left-L.getBoundingClientRect().left-24;}})();
</script>'''


def rename_classes(soup_node):
    for el in soup_node.find_all(True):
        cl = el.get('class')
        if cl:
            el['class'] = [REN.get(c, c) for c in cl]


def build_page(path):
    raw = path.read_text()
    raw = recolour(raw)
    raw = re.sub(r'(<rect[^>]*?) rx="\d+(\.\d+)?"', r'\1 rx="0"', raw)
    soup = BeautifulSoup(raw, 'lxml')
    title = soup.title.get_text().strip() if soup.title else 'Timbercycle'
    title = re.sub(r'^Timbercycle \| ', '', title)
    title = re.sub(r'\s*\|\s*Timbercycle$', '', title)
    page_title = f'{title} | Timbercycle | Recycle Group'
    desc_tag = soup.find('meta', attrs={'name': 'description'})
    desc = desc_tag['content'] if desc_tag else ''
    ld = soup.find('script', attrs={'type': 'application/ld+json'})
    ld_s = ''
    if ld:
        t = ld.string or ''
        if '"FAQPage"' in t:
            ld_s = '<script type="application/ld+json">' + t + '</script>'
    main = soup.find('main')
    rename_classes(main)
    for br in main.select('.t-hero h1 br'):
        br.replace_with(' ')
    hin = main.select_one('.t-hero .hero__in')
    if hin is not None:
        short = re.sub(r'\s*[|—–-].*$', '', title) if path.name != 'index.html' else ''
        crumb = (f'<div class="tc-crumb"><a href="{RG}/">Recycle Group</a><span>/</span>'
                 f'<a href="{RG}/the-group/">Our businesses</a><span>/</span>'
                 + (f'<a href="index.html">Timbercycle</a><span>/</span><span>{html.escape(short)}</span>' if short else '<span>Timbercycle</span>')
                 + '</div>')
        hin.insert(0, BeautifulSoup(crumb, 'html.parser'))
    inner = main.decode_contents()
    is_home = path.name == 'index.html'
    body = f'''<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(page_title)}</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<meta property="og:title" content="{html.escape(page_title, quote=True)}"><meta property="og:description" content="{html.escape(desc, quote=True)}"><meta property="og:type" content="website">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{CSS_MAIN}">
<link rel="stylesheet" href="assets/timbercycle.css">
<link rel="stylesheet" href="assets/tc-rg.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='101.8 13.97 72 72'%3E%3Crect x='101.8' y='13.97' width='72' height='72' rx='10' fill='%230E1114'/%3E%3Cg transform='translate(137.8 49.97) scale(1.12) translate(-137.8 -49.97)'%3E%3Cpath fill='%23C2804F' d='M116 73V26.93H142.76Q147.85 26.93 151.27 28.84Q154.69 30.76 156.4 34.07Q158.11 37.39 158.11 41.48Q158.11 45.91 156.07 49.36Q154.02 52.82 150.33 54.76L159.59 73H146.17L138.53 56.77H128V73ZM128 47.85H140.41Q142.89 47.85 144.4 46.21Q145.91 44.57 145.91 41.82Q145.91 40.01 145.24 38.73Q144.57 37.46 143.36 36.76Q142.15 36.05 140.41 36.05H128Z'/%3E%3C/g%3E%3C/svg%3E">
{ld_s}
</head>
<body class="tc-page{' tc-home' if is_home else ''}">
{rg_nav()}
{sub_nav(path.name)}
<main class="tc" id="main">
{inner}
</main>
{tc_directory()}
{rg_footer()}
{FOOT_JS}
<script src="assets/site.js"></script>
<script src="{POLISH}" defer></script>
</body>
</html>
'''
    body = body.replace('src="yard.js"', 'src="assets/yard.js"')
    return body


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / 'assets').mkdir(parents=True)
    shutil.copytree(ROOT / 'img', OUT / 'img')
    (OUT / 'img' / 'logo.png').unlink(missing_ok=True)
    (OUT / 'assets' / 'timbercycle.css').write_text(build_css())
    shutil.copy(HERE / 'tc-rg.css', OUT / 'assets' / 'tc-rg.css')
    js = (ROOT / 'site.js').read_text().replace("'.rv'", "'.t-rv'")
    (OUT / 'assets' / 'site.js').write_text(recolour(js))
    (OUT / 'assets' / 'yard.js').write_text(recolour((ROOT / 'yard.js').read_text()).replace('Poppins', 'Archivo'))
    if MODE == 'preview':
        for f in ['main.css', 'recycle-logo.svg', 'polish.js']:
            shutil.copy(HERE / 'rg' / f, OUT / 'assets' / f)
    n = 0
    for p in sorted(ROOT.glob('*.html')):
        (OUT / p.name).write_text(build_page(p))
        n += 1
    print(f'{MODE}: {n} pages -> {OUT}')


if __name__ == '__main__':
    main()
