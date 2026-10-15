#!/usr/bin/env python3
"""Flag visible text whose contrast against its effective background is under 3:1 (desktop width)."""
import sys, subprocess, time
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parent.parent / 'rg'
JS = r"""
() => {
 const P=s=>{const m=s.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0]};
 const L=c=>{const a=c.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*a[0]+.7152*a[1]+.0722*a[2]};
 const bgOf=el=>{let e=el,stack=[];while(e&&e.nodeType===1){const cs=getComputedStyle(e);const c=P(cs.backgroundColor);const a=c.length>3?c[3]:1;
   if(cs.backgroundImage!=='none'&&!cs.backgroundImage.includes('gradient'))return null;
   if(a>0){stack.push([c,a]);if(a>=1)break;} e=e.parentElement;}
   let r=[14,17,20];for(let i=stack.length-1;i>=0;i--){const [c,a]=stack[i];r=r.map((v,k)=>v*(1-a)+c[k]*a)}return r};
 const out=[];
 document.querySelectorAll('main *, .tc-bar *, .tc-dir *').forEach(el=>{
   const t=[...el.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
   if(!t)return; const r=el.getBoundingClientRect(); if(!r.width||!r.height)return;
   const cs=getComputedStyle(el); if(cs.visibility==='hidden'||+cs.opacity===0)return;
   if(el.closest('svg,canvas,.hero__media,[aria-hidden=true]'))return;
   const fg=P(cs.color); const bg=bgOf(el); if(!bg)return;
   const fa=fg.length>3?fg[3]:1; const f=fg.slice(0,3).map((v,k)=>v*fa+bg[k]*(1-fa));
   const [a,b]=[L(f),L(bg)].sort((x,y)=>y-x); const cr=(a+.05)/(b+.05);
   if(cr<3) out.push(cr.toFixed(2)+' | '+el.tagName+'.'+[...el.classList].join('.')+' | '+t.slice(0,50));
 });
 return out;
}"""
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8766', '-d', str(root)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
        for f in sorted(root.glob('*.html')):
            pg.goto(f'http://localhost:8766/{f.name}', wait_until='networkidle')
            bad = pg.evaluate(JS)
            for x in bad[:12]:
                print(f.name, '|', x)
        b.close()
finally:
    srv.terminate()
