"""Import the missing About and Activity content from the archived Google Site."""
import html
import sys
from pathlib import Path

from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
import source_content as source

MARK = '<!-- google-site-about-import -->'


def insert_once(path, content, marker=MARK):
    file = source.ROOT / path
    text = file.read_text(encoding='utf8')
    if marker in text:
        return
    if 'source-content.css' not in text:
        css = source.rel(path, 'pages/source-content.css')
        text = text.replace('</head>', f'<link rel="stylesheet" href="{css}">\n</head>', 1)
    text = text.replace('</article>', f'{marker}\n{content}\n</article>', 1)
    file.write_text(text, encoding='utf8')


def render_blocks(key, path, blocks):
    original = source.PAGES[key]['blocks']
    try:
        source.PAGES[key]['blocks'] = blocks
        return source.render(key, path)
    finally:
        source.PAGES[key]['blocks'] = original


def remove_notice(path):
    file = source.ROOT / path
    soup = BeautifulSoup(file.read_text(encoding='utf8'), 'html.parser')
    for node in soup.select('.notice'):
        node.decompose()
    file.write_text('<!doctype html>\n' + str(soup), encoding='utf8')


def reset_generated(path, selectors, link_href=None):
    file = source.ROOT / path
    soup = BeautifulSoup(file.read_text(encoding='utf8'), 'html.parser')
    for selector in selectors:
        for node in soup.select(selector):
            node.decompose()
    for node in soup.find_all(string=lambda value: isinstance(value, str) and
                              ('google-site-about-import' in value or 'about-contact-import' in value)):
        node.extract()
    if link_href:
        for node in soup.find_all('a', href=link_href):
            if node.get_text(strip=True).startswith('Skaitykite apie mokyklą spaudoje'):
                node.parent.decompose()
    file.write_text('<!doctype html>\n' + str(soup), encoding='utf8')


# The landing page already contains the current introduction and learning model.
# Import the remaining posts as a clearly labeled archive, preserving their own dates.
landing = 'pages/apie-mus/index.html'
reset_generated(landing, ['#archyvas', '#kontaktai-apie-mus'])
landing_blocks = source.clean_blocks('apie-mus')
archive_start = next(i for i,b in enumerate(landing_blocks) if b.get('text')=='ADVENTO KNYGIUKAI')
landing_images = render_blocks('apie-mus', landing, [b for b in landing_blocks[:archive_start] if b['type']=='image'])
contact = render_blocks('apie-mus', landing, [landing_blocks[i] for i in (5, 6, 7, 11, 12)])
insert_once(landing, '<section class="source-section" id="kontaktai-apie-mus"><h2>Kur mus rasti</h2>'
            + landing_images + contact + '</section>', '<!-- about-contact-import -->')
archive = render_blocks('apie-mus', landing, landing_blocks[archive_start:])
insert_once(landing, '<section class="source-section" id="archyvas"><h2>Ankstesni mokyklos įrašai</h2>'
            '<p>Čia pateikiami išsaugoti ankstesni mokyklos pranešimai; jų datos nurodytos pačiuose įrašuose.</p>'
            + archive + '</section>')

# The existing director's letter already contains the source text. Add its source photos only.
letter_path = 'pages/apie-mus/vadoves-zodis.html'
reset_generated(letter_path, ['.source-section'])
letter_images = [b for b in source.clean_blocks('apie-mus/vadovės-žodis') if b['type'] == 'image']
letter_photos = render_blocks('apie-mus/vadovės-žodis', letter_path, letter_images)
insert_once(letter_path, '<section class="source-section"><h2>Mokyklos akimirkos</h2>' + letter_photos + '</section>')

# Replace the placeholder note with the full source mission, activities, and affiliation details.
mission_path = 'pages/apie-mus/misija-ir-tikslai.html'
remove_notice(mission_path)
reset_generated(mission_path, ['.source-section'])
insert_once(mission_path, source.section('apie-mus/misija-ir-tikslai', mission_path,
                                         'Misija, veikla ir bendruomenė'))

# Add all archived teacher-page imagery as community photos, without assigning a person to a photo.
teachers_path = 'pages/apie-mus/mokytojai.html'
reset_generated(teachers_path, ['.source-section'])
teacher_images = [b for b in source.clean_blocks('apie-mus/mokytojos') if b['type'] == 'image']
teacher_photos = render_blocks('apie-mus/mokytojos', teachers_path, teacher_images)
insert_once(teachers_path, '<section class="source-section"><h2>Mokytojų ir mokinių akimirkos</h2>'
            + teacher_photos + '</section>')

# Expand the local profile summaries with meaningful details that the archived bios contain.
profile_details = {
    'agne': 'Agnė primena, kad lietuvių kalbos mokymas JAV gali būti iššūkis, kai šeimoje kalbama lietuviškai, angliškai ar dar keliomis kalbomis. Ji kviečia tėvelius dalintis patirtimi ir palaikyti ryšį, kad vaikus ugdytume kartu.',
    'aurelija': '2013 m. sausį Aurelija su vyru ir dukromis Safyra (11 mėn.) ir Arina (3,5 m.) atvyko į JAV. Tų metų vasarą, šeimai dalyvaujant Baltijos šalių renginyje parke, ji susipažino su buvusia mokyklos vadove Virgilija ir tėvų komiteto pirmininke Aida Sakalauskaite. Rugsėjį Aurelija pradėjo dirbti tuomet San Franciske įsikūrusioje „Genio“ mokykloje.',
    'juste': 'Mokyklą Justė atrado kaip būdą būti arčiau Lietuvos ir perduoti gražiausius lietuviškus dalykus ne tik savo namuose, bet ir kitiems. Ji tiki, kad mokyklos, šeimų ir bendruomenės pastangos kartu gali daug.',
    'rita': 'Rita savo pažadą kalbėti su vaikais lietuviškai vadina sudėtingu, bet įmanomu. Augindama keturis vaikus ji suprato, kad tobulėjimui ribų nėra, o bendravimo ir motyvavimo principus stengiasi taikyti kasdien namuose, mokykloje ir darbe.',
    'aiste': 'Aistė nori, kad mokiniai patys atrastų savo šaknis ir įvertintų dvikalbystės ar daugiakalbystės dovaną. Ji pabrėžia, kad sąmoningi kasdieniai pasirinkimai padeda kurti ateitį, kurioje yra vietos lietuvių kalbai, kultūrai ir tradicijoms, ypač svarbioms paauglystėje.',
    'indre': '2019 m. praktika „Genio“ mokykloje Indrei tapo trimis ypatingais mėnesiais: ji pamilo San Francisko lietuvių bendruomenę, mokinius ir kolegas, saulėtą orą bei nenuspėjamą kraštovaizdį. Nors Lietuva buvo toli, ji jautėsi lyg namuose. Nuo 2020 m. rudens, prasidėjus pandemijai, Indrė galėjo tęsti bendravimą su 7–8 klasių mokiniais nuotoliniu būdu.',
    'vanesa': 'Vanesos tėveliai ją nuo vaikystės vedė į lituanistinę mokyklą, skautų sueigas, ateitininkų susirinkimus ir lietuviškus renginius. Prieš grįždama į Kaliforniją 2009 m. ji gyveno Čikagoje ir Filadelfijoje, kur taip pat dirbo su vaikais; vėliau mokė ir Lemonte.',
}
for name, detail in profile_details.items():
    path = f'articles/mokytojai/{name}.html'
    insert_once(path, '<p class="source-biography-detail">' + html.escape(detail) + '</p>',
                '<!-- source-biography-detail -->')

# Activity source page, its participation archive, and 2009–2014 videos all live on this page.
activity_path = 'pages/apie-mus/veikla.html'
remove_notice(activity_path)
reset_generated(activity_path, ['.source-section'], source.rel(activity_path, 'pages/apie-mus/mokykla-spaudoje.html'))
activity = source.section('veikla', activity_path, 'Mokyklos veiklos archyvas')
participation = source.section('veikla/dalyvavimas-ir-pasiekimai', activity_path,
                               'Dalyvavimas ir pasiekimai', 'dalyvavimas-ir-pasiekimai')
videos = source.section('veikla/2009-2014-mokyklos-videos', activity_path,
                        '2009–2014 m. mokyklos vaizdo įrašai', 'mokyklos-videos')
press_href = source.rel(activity_path, 'pages/apie-mus/mokykla-spaudoje.html')
insert_once(activity_path, '<p><a href="' + html.escape(press_href, quote=True) + '">Skaitykite apie mokyklą spaudoje ir žiniasklaidoje →</a></p>'
            + activity + participation + videos)

# This source page did not yet exist in the local project.
press_path = 'pages/apie-mus/mokykla-spaudoje.html'
press_content = source.section('apie-mus/mokykla-spaudoje', press_path, 'Mokykla spaudoje')
source.new_page(press_path, 'Mokykla spaudoje', press_content)

print('About and Activity source content imported.')
