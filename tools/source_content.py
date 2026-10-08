"""Shared rendering helpers for the content-only Google Sites migration."""
import collections, html, json, os, pathlib, re, urllib.parse
from bs4 import BeautifulSoup
ROOT=pathlib.Path(__file__).resolve().parent.parent
MANIFEST=json.loads((ROOT/'tools/source-cache/manifest.json').read_text(encoding='utf8'))
PAGES={p['path'].split('/sfgenys/')[-1]:p for p in MANIFEST['pages']}
FREQUENCY=collections.Counter(src for p in MANIFEST['pages'] for src in set(p.get('media',[])))
MAP={'apie-mus':'pages/apie-mus/index.html','apie-mus/vadovės-žodis':'pages/apie-mus/vadoves-zodis.html','apie-mus/misija-ir-tikslai':'pages/apie-mus/misija-ir-tikslai.html','apie-mus/mokytojos':'pages/apie-mus/mokytojai.html','apie-mus/mokykla-spaudoje':'pages/apie-mus/mokykla-spaudoje.html','veikla':'pages/apie-mus/veikla.html','veikla/dalyvavimas-ir-pasiekimai':'pages/apie-mus/veikla.html#dalyvavimas-ir-pasiekimai','veikla/2009-2014-mokyklos-videos':'pages/apie-mus/veikla.html#mokyklos-videos','naujienos':'pages/naujienos.html','naujienos/2026-2027-mokslo-metų-info':'pages/mokslo-metu-info.html','tėvams':'pages/tevams/index.html','tėvams/kalendorius':'pages/kalendorius.html','tėvams/registracija':'pages/registracija.html','tėvams/tėvų-komitetas':'pages/tevams/tevu-komitetas.html','tėvams/mokyklos-atributika':'pages/tevams/atributika.html','tėvams/naudingos-nuorodos':'pages/tevams/index.html#naudingos-nuorodos','tėvams/mokslo-kainos':'pages/tevams/mokslo-kainos.html','tėvams/amazon-wishlist':'pages/tevams/amazon-wishlist.html','tėvams/budėjimai':'pages/tevams/budejimai.html','pedagogams':'pages/pedagogams.html','pedagogams/naudingos-nuorodos':'pages/pedagogams.html#naudingos-nuorodos','partneriai':'pages/partneriams.html#partneriai','partneriai/parama-fundraising':'pages/partneriams.html','kontaktai':'pages/kontaktai.html','klasės':'pages/apie-mus/klases.html'}
CLASS_IDS={'priešmokyklinė-klasė':'pm-d','2-3-klasė':'2-3','4-klasė':'4','5-6-klasė':'5-6','7-8-klasė':'7-8','šokiai-dainavimas-ir-šventės':'sokiai','išleistuvės':'isleistuves'}
for key in PAGES:
    if key.startswith('klasės/'):
        group=key.split('/')[1]; MAP[key]='pages/apie-mus/klases.html#'+CLASS_IDS.get(group,'pm-d')
def rel(path,target):
    base,sep,frag=target.partition('#')
    return os.path.relpath(ROOT/base,(ROOT/path).parent).replace('\\','/')+(sep+frag if sep else '')
def normalize_url(url):
    parsed=urllib.parse.urlsplit(html.unescape(url))
    if parsed.netloc in ('www.google.com','google.com') and parsed.path=='/url':
        q=urllib.parse.parse_qs(parsed.query); return (q.get('q') or q.get('url') or [url])[0]
    if parsed.netloc in ('www.youtube.com','youtube.com') and parsed.path.startswith('/embed/'):
        return 'https://www.youtube.com'+parsed.path
    return html.unescape(url)
def clean_blocks(key):
    blocks=PAGES[key]['blocks']; output=[]; seen=set(); first_heading=True
    for b in blocks:
        if b.get('text','').strip() in ('DRAUGAUKIME FACEBOOK!','TAPKITE RĖMĖJU!'):break
        if b['type']=='image' and FREQUENCY[b['src']]>30:continue
        if b['type']=='html' and b.get('html','').startswith('<h1>'):
            if first_heading and key!='naujienos' and not key.startswith('_news_'):
                first_heading=False; continue
            b=dict(b);b['html']=b['html'].replace('<h1>','<h2>').replace('</h1>','</h2>')
        b=dict(b)
        if b['type']=='embed':b['src']=normalize_url(b['src'])
        signature=json.dumps(b,sort_keys=True)
        if signature in seen:continue
        seen.add(signature); output.append(b)
    return output
def render(key,path,skip_text=False):
    result=[];context=key.split('/')[-1].replace('-',' ')
    for b in clean_blocks(key):
        if b['type']=='html':
            if skip_text:continue
            soup=BeautifulSoup(b['html'],'html.parser')
            for a in soup.find_all('a'):
                href=normalize_url(a.get('href',''));a['href']=href
                if not a.get_text(strip=True) and not a.find('img'):a.decompose();continue
                decoded=urllib.parse.unquote(href)
                if '/sfgenys.org/sfgenys/' in decoded:
                    k=decoded.split('/sfgenys.org/sfgenys/')[-1].split('?')[0].rstrip('/')
                    if k in MAP:a['href']=rel(path,MAP[k])
                if href.startswith('#h.'):a.unwrap()
            for node in soup.find_all(True):
                for attr in list(node.attrs):
                    if attr not in ('href','colspan','rowspan'):del node[attr]
            text=soup.get_text(' ',strip=True)
            if not text:continue
            if soup.find(['h2','h3']):context=text
            result.append(str(soup))
        elif b['type']=='image':
            asset=MANIFEST['assets'].get(b['src'])
            alt=b.get('alt') or context+' – mokyklos archyvo vaizdas'
            if asset:
                image='<img src="'+html.escape(rel(path,asset),quote=True)+'" alt="'+html.escape(alt,quote=True)+'" loading="lazy">'
                if b.get('href'):image='<a href="'+html.escape(normalize_url(b['href']),quote=True)+'">'+image+'</a>'
                result.append('<figure class="source-image">'+image+'</figure>')
            else:
                result.append('<p class="source-media-link"><a href="'+html.escape(b['src'],quote=True)+'">'+html.escape(context)+' – atverti šaltinio vaizdą</a></p>')
        else:
            src=b['src']; title=b.get('title')
            if not title or title=='Įterptas turinys':title=context+' – įterptas turinys'
            video=('youtube.com' in src or 'vimeo.com' in src)
            result.append('<div class="source-embed'+(' source-video' if video else '')+'"><iframe src="'+html.escape(src,quote=True)+'" title="'+html.escape(title,quote=True)+'" loading="lazy" allowfullscreen></iframe></div><p class="source-media-link"><a href="'+html.escape(src,quote=True)+'">Atverti '+html.escape(context)+' ↗</a></p>')
    return '\n'.join(result)
def section(key,path,title=None,id=None):
    title=title or key.split('/')[-1].replace('-',' ').capitalize()
    return '<section class="source-section"'+(' id="'+id+'"' if id else '')+'><h2>'+html.escape(title)+'</h2>\n'+render(key,path)+'</section>'
def append_content(path,content):
    file=ROOT/path; original=file.read_text(encoding='utf8')
    if 'source-content.css' not in original:
        css=rel(path,'pages/source-content.css');original=original.replace('</head>','<link rel="stylesheet" href="'+css+'">\n</head>',1)
    original=original.replace('</article>',content+'\n</article>',1)
    file.write_text(original,encoding='utf8')
def new_page(path,title,content):
    css=rel(path,'pages/article.css');extra=rel(path,'pages/source-content.css');nav=rel(path,'pages/site-nav.js')
    file=ROOT/path; file.parent.mkdir(parents=True,exist_ok=True)
    file.write_text('<!doctype html>\n<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+' | SF Genys</title><link rel="stylesheet" href="'+css+'"><link rel="stylesheet" href="'+extra+'"></head><body><main class="page"><article class="article"><p class="eyebrow">SF GENYS</p><h1>'+html.escape(title)+'</h1>'+content+'</article></main><script src="'+nav+'" defer></script></body></html>',encoding='utf8')
