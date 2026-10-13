'use strict';
// Regenerate editable content defaults after changing static page templates.
const fs=require('node:fs/promises'), path=require('node:path'), http=require('node:http'), crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
async function run() {
  let playwright;
  try { playwright=require('playwright'); } catch { playwright=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
  const files=[];
  async function walk(dir) {for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})){const rel=path.posix.join(dir,entry.name);if(entry.isDirectory())await walk(rel);else if(entry.name.endsWith('.html')&&!entry.name.startsWith('_')&&!rel.endsWith('/straipsnis.html'))files.push(rel);}}
  files.push('index.html');await walk('pages');await walk('articles');
  const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let target=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!target.startsWith(root+path.sep))throw Error('Invalid path');if(url.pathname.endsWith('/'))target=path.join(target,'index.html');const content=await fs.readFile(target);res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.json')?'application/json':target.endsWith('.css')?'text/css':target.endsWith('.png')?'image/png':'text/html');res.end(content);}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const browser=await playwright.chromium.launch({headless:true,...(process.platform==='win32'?{executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'}:{})});
  try {
    const page=await browser.newPage();await page.route('https://**/*',route=>route.abort());await page.route('**/api/content-config',route=>route.fulfill({json:{configured:false}}));
    // Ensure previously saved CMS changes are not included in static defaults.
    await page.route('**/data/content-sections.js',route=>route.fulfill({body:''}));
    const catalog=[];
    for(const file of files.sort()){
      await page.goto(base+'/'+file);await page.waitForTimeout(80);
      await page.evaluate(()=>localStorage.setItem('sf-genys-language','lt'));
      const ltButton=page.locator('[data-lang=lt]').first();if(await ltButton.count())await ltButton.click();await page.waitForTimeout(80);
      const capture=()=>{
        const ignored='script,style,button,form,nav,header.top,[data-news-list],[data-content-events],[data-content-article],#latest-news,#news-preview,#gallery-grid,.news-photo-slot,.news-photo-section';
        const selector=el=>{const parts=[];while(el&&el.tagName!=='MAIN'){const siblings=[...el.parentElement.children].filter(item=>item.tagName===el.tagName);parts.unshift(el.tagName.toLowerCase()+':nth-of-type('+(siblings.indexOf(el)+1)+')');el=el.parentElement;}return 'main > '+parts.join(' > ');};
        const group=el=>{const scope=el.closest('section,.source-content,.class-panel,article');return scope?.querySelector('h2,h1,h3')?.textContent.trim()||document.title.split('|')[0].trim();};
        const normalize=value=>{try{const url=new URL(value,location.href);return url.origin===location.origin?url.pathname.slice(1)+url.search+url.hash:url.href;}catch{return value;}};
        const fields=[];
        for(const el of document.querySelectorAll('main,main *')){
          if(el.closest(ignored))continue;
          const sel=selector(el),g=group(el);
          [...el.childNodes].forEach((child,index)=>{if(child.nodeType===3&&child.nodeValue.trim()){const value=child.nodeValue.trim();fields.push({key:sel+'|text|'+index,selector:sel,textIndex:index,kind:'text',lt:value,group_lt:g,label_lt:value.slice(0,100)});}});
          if(el.tagName==='IMG'&&!el.closest('.brand'))fields.push({key:sel+'|image',selector:sel,kind:'image',url:normalize(el.getAttribute('src')||''),alt_lt:el.alt||'',label_lt:el.alt||'Nuotrauka',group_lt:g});
          if(el.tagName==='A'&&!el.classList.contains('back')&&!el.getAttribute('href')?.includes('checkin/'))fields.push({key:sel+'|link',selector:sel,kind:'link',url:normalize(el.getAttribute('href')||''),label_lt:el.textContent.trim()||'Nuoroda',group_lt:g});
          if(el.tagName==='IFRAME')fields.push({key:sel+'|embed',selector:sel,kind:'embed',url:normalize(el.getAttribute('src')||''),lt:el.title||'',label_lt:el.title||'Dokumentas / vaizdo įrašas',group_lt:g});
        }
        return {title:document.title.split('|')[0].trim(),fields};
      };
      const lt=await page.evaluate(capture);
      const enButton=page.locator('[data-lang=en]').first();if(await enButton.count())await enButton.click();await page.waitForTimeout(30);const en=await page.evaluate(capture);const enMap=new Map(en.fields.map(field=>[field.key,field]));
      const fields=lt.fields.map(field=>{const translation=enMap.get(field.key);const result={...field,id:'f'+crypto.createHash('sha256').update(field.key).digest('hex').slice(0,12),en:translation?.lt||field.lt||'',label_en:translation?.label_lt||field.label_lt,group_en:translation?.group_lt||field.group_lt,alt_en:translation?.alt_lt||field.alt_lt||''};delete result.key;return result;});
      if(fields.length)catalog.push({page:file,title_lt:lt.title,title_en:en.title,fields});
    }
    await fs.writeFile(path.join(root,'data/section-catalog.js'),'/* Generated by tools/build-section-catalog.js. Static page defaults; no credentials. */\nwindow.SectionCatalog = '+JSON.stringify(catalog,null,2)+';\n');
    await fs.mkdir(path.join(root,'data/section-defaults'),{recursive:true});
    for (const entry of catalog) await fs.writeFile(path.join(root,'data/section-defaults',entry.page.replace(/\//g,'__')+'.json'),JSON.stringify(entry));
    console.log('Created catalog: '+catalog.length+' pages, '+catalog.reduce((n,p)=>n+p.fields.length,0)+' fields.');
  }finally{await browser.close();await new Promise(r=>server.close(r));}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
