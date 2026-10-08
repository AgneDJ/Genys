"""Archive Google Sites content and media without importing its navigation or styling."""
import concurrent.futures, hashlib, html, json, pathlib, re, subprocess, urllib.parse, sys
sys.stdout.reconfigure(encoding='utf8')
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parent.parent
CACHE=ROOT/'tools/source-cache'
ASSETS=ROOT/'assets/google-site'
CACHE.mkdir(exist_ok=True); ASSETS.mkdir(exist_ok=True)
BASE='https://sites.google.com'
def download(url,path):
    if path.exists() and path.stat().st_size: return True
    r=subprocess.run(['curl.exe','-f','-sS','-L','--retry','2','--max-time','90',url,'-o',str(path)],capture_output=True)
    return r.returncode==0
seed=BeautifulSoup((ROOT/'.codex/source-apie-mus.html').read_text(encoding='utf8'),'html.parser')
paths=list(dict.fromkeys(a['href'] for a in seed.select('a[href]') if a['href'].startswith('/sfgenys.org/sfgenys/')))
def read_page(path):
    key=hashlib.sha256(path.encode()).hexdigest()[:12]
    target=CACHE/(key+'.html')
    ok=download(BASE+urllib.parse.quote(path,safe='/:%'),target)
    if not ok: return {'path':path,'error':'download failed'}
    soup=BeautifulSoup(target.read_text(encoding='utf8'),'html.parser')
    sections=soup.select('section.yaqOZd')
    blocks=[]; media=[]
    def render(node):
        if not getattr(node,'name',None): return html.escape(str(node))
        tag=node.name
        if tag=='br':return '<br>'
        if tag=='a':
            url=node.get('href','')
            if url.startswith('/sfgenys.org/'):url=BASE+url
            return '<a href="'+html.escape(url,quote=True)+'">'+''.join(render(c) for c in node.children)+'</a>'
        if tag in ('strong','b','em','i'):return '<'+tag+'>'+''.join(render(c) for c in node.children)+'</'+tag+'>'
        return ''.join(render(c) for c in node.children)
    for section in sections:
        for node in section.find_all(['h1','h2','h3','p','ul','ol','table','img','iframe','div']):
            if any(p.name in ('h1','h2','h3','p','ul','ol','table') for p in node.parents if p is not section):continue
            tag=node.name
            if tag=='div':
                if node.get('data-embed-open-url') and not node.find('iframe'):
                    url=node['data-embed-open-url']; label=node.get_text(' ',strip=True) or 'Atverti dokumentą'
                    blocks.append({'type':'html','html':'<p><a href="'+html.escape(url,quote=True)+'">'+html.escape(label)+'</a></p>','text':label})
                code=node.get('data-code')
                if code:
                    for frame in BeautifulSoup(code,'html.parser').find_all('iframe'):
                        src=frame.get('src','')
                        if src:blocks.append({'type':'embed','src':src,'title':frame.get('title','Įterptas turinys')})
                elif node.get('data-url') and not node.find('iframe'):
                    blocks.append({'type':'embed','src':node['data-url'],'title':'Įterptas turinys'})
                continue
            if tag=='img':
                src=node.get('src',''); alt=node.get('alt','')
                if src and not src.startswith('data:') and 'www.gstatic.com/images/icons/' not in src:
                    media.append(src);block={'type':'image','src':src,'alt':alt}
                    parent_link=node.find_parent('a')
                    if parent_link and parent_link.get('href'):block['href']=parent_link['href']
                    blocks.append(block)
            elif tag=='iframe':
                src=node.get('src') or node.get('data-src')
                if src and 'intermediate-frame-minified' in src:
                    wrapper=node.find_parent('div',attrs={'data-url':True})
                    if wrapper:src=wrapper['data-url']
                if src:blocks.append({'type':'embed','src':src,'title':node.get('title') or node.get('aria-label') or 'Įterptas turinys'})
            elif node.get_text(strip=True):
                if tag in ('ul','ol'):content='<'+tag+'>'+''.join('<li>'+render(li)+'</li>' for li in node.find_all('li',recursive=False))+'</'+tag+'>'
                elif tag=='table':content=str(node)
                else:content='<'+tag+'>'+render(node)+'</'+tag+'>'
                blocks.append({'type':'html','html':content,'text':node.get_text(' ',strip=True)})
    return {'path':path,'title':soup.title.get_text() if soup.title else path,'blocks':blocks,'media':media}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:pages=list(pool.map(read_page,paths))
media=list(dict.fromkeys(src for page in pages for src in page.get('media',[])))
def save_image(src):
    key=hashlib.sha256(src.encode()).hexdigest()[:16]
    target=ASSETS/(key+'.jpg')
    for ext in ('.png','.gif','.webp','.jpg'):
        existing=ASSETS/(key+ext)
        if existing.exists() and existing.stat().st_size:return src,existing.relative_to(ROOT).as_posix()
    ok=download(src,target)
    if ok:
        sig=target.read_bytes()[:16]
        ext='.png' if sig.startswith(b'\x89PNG') else '.gif' if sig.startswith(b'GIF8') else '.webp' if sig[8:12]==b'WEBP' else '.jpg'
        final=ASSETS/(key+ext)
        if final!=target:target.replace(final)
        return src,final.relative_to(ROOT).as_posix()
    return src,None
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:assets=dict(pool.map(save_image,media))
manifest={'source':BASE+'/sfgenys.org/sfgenys/apie-mus','pages':pages,'assets':assets}
(CACHE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'pages':len(pages),'images':len(media),'failed_pages':[p['path'] for p in pages if 'error' in p],'failed_images':sum(v is None for v in assets.values())}))
for p in pages:print(urllib.parse.unquote(p['path'])+' | '+str(len(p.get('blocks',[])))+' blocks')
