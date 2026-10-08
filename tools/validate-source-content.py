import json,re,urllib.parse
from bs4 import BeautifulSoup
from source_content import *
def norm(s):return ''.join(c.lower() for c in s if c.isalnum())
errors=[];missing_text=[];missing_media=[];files=list((ROOT/'pages').rglob('*.html'))+list((ROOT/'articles').rglob('*.html'))
for file in files:
    soup=BeautifulSoup(file.read_text(encoding='utf8'),'html.parser')
    for tag in soup.select('[href],[src]'):
        ref=tag.get('href') or tag.get('src')
        if not ref or ref.startswith(('http:','https:','mailto:','tel:','#','data:','javascript:')):continue
        target=(file.parent/urllib.parse.unquote(ref.split('#')[0].split('?')[0])).resolve()
        if not target.exists():errors.append([str(file.relative_to(ROOT)),ref])
    for iframe in soup.select('iframe'):
        if not iframe.get('title'):errors.append([str(file.relative_to(ROOT)),'iframe without title'])
for key in PAGES:
    dest=MAP[key].split('#')[0]
    if key=='naujienos':dest='pages/naujienos-archyvas.html'
    targets=[ROOT/dest]
    if key=='apie-mus/mokytojos':targets+=list((ROOT/'articles/mokytojai').glob('*.html'))
    local=' '.join(f.read_text(encoding='utf8') for f in targets)
    text=norm(BeautifulSoup(local,'html.parser').get_text(' ',strip=True))
    for b in clean_blocks(key):
        if b['type']=='image':
            asset=MANIFEST['assets'].get(b['src'])
            if asset and asset.split('/')[-1] not in local:missing_media.append([key,asset])
            elif not asset and html.escape(b['src'],quote=True) not in local:missing_media.append([key,b['src']])
        if b['type']=='html':
            value=BeautifulSoup(b['html'],'html.parser').get_text(' ',strip=True)
            if len(value)>160 and norm(value) not in text:missing_text.append([key,value])
report={'source_pages':len(PAGES),'broken_links_or_titles':errors,'missing_media':missing_media,'paragraphs_to_review':missing_text,'unavailable_source_images':[u for u,a in MANIFEST['assets'].items() if not a]}
(ROOT/'tools/source-cache/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('Source pages:',len(PAGES),'Link/title errors:',len(errors),'Missing media:',len(missing_media),'Paragraphs to review:',len(missing_text))
for item in errors+missing_media+missing_text:print(json.dumps(item,ensure_ascii=False))
