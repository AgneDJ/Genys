import html, re
from bs4 import BeautifulSoup
from source_content import *
path='pages/apie-mus/klases.html';file=ROOT/path;original=file.read_text(encoding='utf8')
base=ROOT/'tools/source-cache/classes-base.html'
if not base.exists():base.write_text(original,encoding='utf8')
original=base.read_text(encoding='utf8')
overview=render('klasės',path)
original=original.replace('<section class="class-list">', '<section class="source-section"><h2>Mokyklos klasės</h2>'+overview+'</section><section class="class-list">',1)
original=original.replace('</head>','<link rel="stylesheet" href="../source-content.css">\n</head>',1)
labels={'apie-mus':'Apie mus','tvarkaraštis':'Tvarkaraštis','klasės-ritualai':'Klasės ritualai','šventės':'Šventės','mūsų-klasės-taisyklės':'Mūsų klasės taisyklės','konkursai':'Konkursai','nuotraukos':'Nuotraukos','mokymo-priemonės':'Mokymo priemonės','skaitomos-knygos':'Skaitomos knygos','pasiekimai':'Pasiekimai','mes-dalyvaujame-konkursuose':'Mes dalyvaujame konkursuose','pamokos':'Pamokos','2022-šokių-šventė-registracija':'2022 m. šokių šventė – informacija','2016-šokių-šventė':'2016 m. šokių šventė','2015-dainų-šventė':'2015 m. dainų šventė'}
for group,panel_id in CLASS_IDS.items():
    key='klasės/'+group
    pattern=r'(<section class="class-panel(?: active)?" id="'+re.escape(panel_id)+r'">)(.*?)(</section>)'
    found=re.search(pattern,original,re.S)
    if not found:raise RuntimeError('missing panel '+panel_id)
    content=found.group(2)
    added=['<div class="source-section"><h3>Klasės veiklos archyvas</h3><p>Čia saugoma klasės veikla ir ankstesnių mokslo metų medžiaga. Nuotolinių pamokų tvarkaraščiai ir renginių registracija priklauso šiam archyvui.</p>']
    if group=='4-klasė':added.append('<p>Šaltinio puslapio antraštė – „5 KLASĖ“; išsaugota joje pateikta mokymo medžiaga.</p>')
    if group=='5-6-klasė':
        base_images={b['src'] for b in clean_blocks(key) if b['type']=='image'}
        pics=[b for b in clean_blocks(key+'/apie-mus') if b['type']=='image' and b['src'] not in base_images]
        for pic in pics:
            asset=MANIFEST['assets'].get(pic['src'])
            if asset:
                content=re.sub(r'(src=")https://lh3.googleusercontent.com/sitesv/[^"]+',lambda m:m[1]+rel(path,asset),content,count=1)
    if group=='5-6-klasė':added.append('<p>Šaltinio puslapio antraštė – „6–8 KLASĖ“.</p>')
    if group=='priešmokyklinė-klasė':
        photo=next((b for b in clean_blocks(key) if b['type']=='image'),None)
        if photo and MANIFEST['assets'].get(photo['src']):
            content=re.sub(r'(<img class="pm-photo" src=")[^"]+',lambda m:m[1]+rel(path,MANIFEST['assets'][photo['src']]),content, count=1)
    elif group!='2-3-klasė':added.append(render(key,path))
    for sub in PAGES:
        if not sub.startswith(key+'/'):continue
        title=labels.get(sub.split('/')[-1],sub.split('/')[-1].replace('-',' ').capitalize())
        # The existing showcase already displays both pictures from this about subtab.
        if group=='5-6-klasė' and sub.endswith('/apie-mus'):
            blocks=clean_blocks(sub)
            source=render(sub,path)
            soup=BeautifulSoup(source,'html.parser')
            for figure in soup.select('figure.source-image'):figure.decompose()
            source=str(soup)
            added.append('<section class="source-section"><h3>'+html.escape(title)+'</h3>'+source+'</section>')
        else:
            source=render(sub,path)
            # Avoid repeating the rules preview already included above.
            if group=='2-3-klasė' and sub.endswith('/mūsų-klasės-taisyklės') and '1HVHROVUbGBH14RLzN4br2W54ZBSzBsN6' in source:
                soup=BeautifulSoup(source,'html.parser')
                for iframe in soup.select('iframe'):
                    if '1HVHROVUbGBH14RLzN4br2W54ZBSzBsN6' in iframe.get('src',''):iframe.parent.decompose()
                source=str(soup)
            soup=BeautifulSoup(source,'html.parser')
            existing_embeds={normalize_url(f.get('src','')) for f in BeautifulSoup(content,'html.parser').find_all('iframe')}
            for iframe in soup.select('.source-embed iframe'):
                if normalize_url(iframe.get('src','')) in existing_embeds:iframe.parent.decompose()
            source=str(soup)
            added.append('<section class="source-section"><h3>'+html.escape(title)+'</h3>'+source+'</section>')
    added.append('</div>')
    replacement=found.group(1)+content+'\n'+'\n'.join(added)+found.group(3)
    original=original[:found.start()]+replacement+original[found.end():]
file.write_text(original,encoding='utf8')
print('Updated seven class panels; all class subtabs mapped into existing panels.')
