import re,sys
sys.path.insert(0,'tools')
from source_content import *
for path,content in json.loads((ROOT/'tools/source-cache/resources-base.json').read_text(encoding='utf8')).items(): (ROOT/path).write_text(content.replace('\r\n','\n').replace('\r',''),encoding='utf8')
# Retain source subheadings at article level, while omitting the page heading.
for key in PAGES:
    for i,b in enumerate(PAGES[key]['blocks']):
        if i and b['type']=='html': b['html']=b['html'].replace('<h1>','<h2>').replace('</h1>','</h2>')
def add(path,body): append_content(path,body)
def images(key,path): return render(key,path,skip_text=True)
def edit(path,fn):
    f=ROOT/path;f.write_text(fn(f.read_text(encoding='utf8')),encoding='utf8')
add('pages/tevams/index.html',section('tėvams','pages/tevams/index.html','Bendruomenės veiklos archyvas')+section('tėvams/naudingos-nuorodos','pages/tevams/index.html','Naudingos nuorodos','naudingos-nuorodos'))
for key,path in [('tėvams/tėvų-komitetas','pages/tevams/tevu-komitetas.html'),('tėvams/amazon-wishlist','pages/tevams/amazon-wishlist.html'),('tėvams/budėjimai','pages/tevams/budejimai.html')]:add(path,images(key,path))
add('pages/tevams/atributika.html',section('tėvams/mokyklos-atributika','pages/tevams/atributika.html','Genio atributikos parduotuvė'))
edit('pages/tevams/mokslo-kainos.html',lambda x:x.replace('2025–2026','2026–2027').replace('rugsėjo 6 d.','rugsėjo 12 d.').replace('spalio 4 d.','spalio 3 d.'))
# The source document is already embedded in the existing page; retain one copy.
edit('pages/tevams/mokslo-kainos.html',lambda x:x.replace('MOKSLO MOKESČIŲ DOKUMENTAS','ARCHYVINIS KAINININKAS · 2021–2022').replace('title="SF Genys mokslo mokesčių dokumentas"','title="SF Genys archyvinis 2021–2022 mokslo mokesčių dokumentas"'))
edit('pages/pedagogams.html',lambda x:re.sub(r'<h1>Rugsėjo mokytojų susitikimas</h1>.*?</article>','<h1>Informacija pedagogams</h1><p>Seminarų medžiaga, įrašai ir mokyklos komandos pranešimų archyvas.</p></article>',x,flags=re.S))
add('pages/pedagogams.html',section('pedagogams','pages/pedagogams.html','Seminarai ir 2025–2026 mokslo metų skelbimų archyvas')+section('pedagogams/naudingos-nuorodos','pages/pedagogams.html','Naudingos nuorodos','naudingos-nuorodos'))
edit('pages/partneriams.html',lambda x:re.sub(r'src="https://lh3.googleusercontent.com/sitesv/[^"]+"','src="../assets/google-site/d78bb4d490364f87.png"',x).replace('2023–2024','2026–2027').replace('https://gofund.me/8a72b933','https://gofund.me/41ccc1c1'))
add('pages/partneriams.html',images('partneriai/parama-fundraising','pages/partneriams.html').replace('<figure class="source-image"><img src="../assets/google-site/d78bb4d490364f87.png" alt="parama fundraising – mokyklos archyvo vaizdas" loading="lazy"></figure>','')+section('partneriai','pages/partneriams.html','Mūsų rėmėjai ir partneriai','partneriai'))
edit('pages/kontaktai.html',lambda x:x if 'mailto:info@sfgenys.org' in x else x.replace('<p class="contact-actions">','<p><a href="mailto:info@sfgenys.org">info@sfgenys.org</a></p><p class="contact-actions">',1))
# The existing Street View already covers the address; import source images only.
contact_blocks=PAGES['kontaktai']['blocks']
PAGES['kontaktai']['blocks']=[b for b in contact_blocks if b['type']=='image']
add('pages/kontaktai.html',images('kontaktai','pages/kontaktai.html'))
PAGES['kontaktai']['blocks']=contact_blocks
add('pages/kalendorius.html',section('tėvams/kalendorius','pages/kalendorius.html','Mokyklos kalendorius ir prenumerata'))
add('pages/registracija.html','<p><a href="mokslo-metu-info.html">2026–2027 mokslo metų pradžios informacija →</a></p><details class="source-section"><summary>2025–2026 mokslo metų registracijos archyvas</summary><p>Šie pranešimai ir registracijos nuorodos skirti ankstesniems 2025–2026 mokslo metams.</p>'+render('tėvams/registracija','pages/registracija.html')+'</details>')
new_page('pages/mokslo-metu-info.html','2026–2027 mokslo metų informacija',render('naujienos/2026-2027-mokslo-metų-info','pages/mokslo-metu-info.html')+'<p><a href="registracija.html">Registracija →</a> · <a href="naujienos.html">Visos naujienos →</a></p>')
# News body link was updated in the initial content pass; preserve its cards and Facebook feed.
edit('pages/naujienos-archyvas.html',lambda x:x.replace('<p>Šiame archyvo įraše saugome svarbią mokyklos bendruomenės akimirką. Nuotraukas ir papildomą informaciją galima papildyti šiame straipsnyje, nekeičiant naujienų sąrašo.</p>',''))
# Preserve each historical announcement and embed, with explicit time context.
news=PAGES['naujienos']['blocks'];parts=[]
for start,end,title in [(0,6,'2026–2027 mokslo metų registracija'),(6,60,'Ankstesni bendruomenės pranešimai ir renginiai'),(60,124,'2021–2022 mokslo metų archyvas')]:
    PAGES['_news_segment']={'blocks':news[start:end]}
    parts.append(section('_news_segment','pages/naujienos-archyvas.html',title))
add('pages/naujienos-archyvas.html','<section class="source-section" id="mokyklos-archyvas"><h2>Mokyklos pranešimų archyvas</h2><p>Istoriniai pranešimai iš mokyklos svetainės. Ankstesnių metų renginių datos, registracijos formos ir 2021–2022 mokslo metų sveikatos reikalavimai išsaugoti kaip archyvo medžiaga.</p>'+''.join(parts)+'</section>')
print('Updated resource pages and created school-year information page.')

for path in json.loads((ROOT/'tools/source-cache/resources-base.json').read_text(encoding='utf8')):
    f=ROOT/path;f.write_text(f.read_text(encoding='utf8').rstrip()+'\n',encoding='utf8')
