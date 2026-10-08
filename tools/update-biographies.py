import html,re
from source_content import *
blocks=clean_blocks('apie-mus/mokytojos')
names={'AGNĖ':'agne','ERIKA':'erika','AURELIJA':'aurelija','JUSTĖ':'juste','RITA':'rita','AISTĖ':'aiste','INDRĖ':'indre','VANESA':'vanesa'}
starts=[(i,names[b.get('text','').strip().upper()]) for i,b in enumerate(blocks) if b.get('text','').strip().upper() in names]
for index,(start,name) in enumerate(starts):
    end=starts[index+1][0] if index+1<len(starts) else len(blocks)
    selected=[b for b in blocks[start+1:end] if b['type']=='html']
    key='_teacher_'+name;PAGES[key]={'blocks':selected}
    path='articles/mokytojai/'+name+'.html';file=ROOT/path
    original=file.read_text(encoding='utf8')
    original=re.sub(r'<details class="source-biography-archive">.*?</details>','',original,flags=re.S)
    if name=='vanesa':original=original.replace('ji gyveno Čikagoje ir Filadelfijoje, kur taip pat dirbo su vaikais; vėliau mokė ir Lemonte.','ji gyveno Čikagoje ir Filadelfijoje. Su vaikais ji pradėjo dirbti Filadelfijoje, vėliau mokė Lemonte.')
    content='<details class="source-biography-archive"><summary>Visas mokytojos pasakojimas – mokyklos archyvas</summary><p>Šis pasakojimas išsaugotas iš ankstesnės mokyklos svetainės; jame minimi metai ir pareigos priklauso to meto įrašui.</p>'+render(key,path)+'</details>'
    if 'source-content.css' not in original:original=original.replace('</head>','<link rel="stylesheet" href="../../pages/source-content.css"></head>',1)
    original=original.replace('</article>',content+'</article>',1)
    file.write_text(original,encoding='utf8')
print('Preserved all eight complete archived teacher biographies.')
