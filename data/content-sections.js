(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src).href;
  const base = new URL(root);
  let relative = decodeURIComponent(location.pathname).slice(base.pathname.length);
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  if (!relative.endsWith('.html') || relative.includes('.google-sites.')) return;
  let catalog, published, language = document.documentElement.lang === 'en' ? 'en' : 'lt';
  try { if (localStorage.getItem('sf-genys-language') === 'en') language = 'en'; } catch {}
  const safeURL = (value, kind, original) => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, root);
      if (kind === 'link' && ['mailto:','tel:'].includes(url.protocol)) return url.href;
      if (!['https:','http:'].includes(url.protocol)) return null;
      if (kind === 'embed') {
        const expected = new URL(original, root);
        if (url.hostname !== expected.hostname || url.username || url.password) return null;
      }
      return url.href;
    } catch { return null; }
  };
  function apply() {
    if (!catalog || !published) return;
    for (const field of catalog.fields) {
      const value = published[field.id];
      if (!value || typeof value !== 'object') continue;
      const element = document.querySelector(field.selector);
      if (!element || !element.closest('main')) continue;
      if (field.kind === 'text') {
        const current = element.childNodes[field.textIndex];
        const text = typeof value[language] === 'string' ? value[language] : value.lt;
        if (current?.nodeType === 3 && typeof text === 'string') {
          const leading = /^\s/.test(current.nodeValue) ? ' ' : '';
          const trailing = /\s$/.test(current.nodeValue) ? ' ' : '';
          const next = leading + text + trailing;
          if (current.nodeValue !== next) current.nodeValue = next;
        }
      } else {
        if (typeof value.url === 'string' && !value.url.trim()) {
          if (field.kind === 'link') element.removeAttribute('href');
          else element.hidden = true;
          continue;
        }
        const url = safeURL(value.url, field.kind, field.url);
        if (url) {
          element.setAttribute(field.kind === 'link' ? 'href' : 'src', url);
          if (field.kind !== 'link') element.hidden = false;
        }
        if (field.kind === 'image') element.alt = String(value['alt_' + language] ?? value.alt_lt ?? field['alt_' + language] ?? '');
        if (field.kind === 'embed') element.title = String(value[language] ?? value.lt ?? field[language] ?? '');
      }
    }
  }
  document.addEventListener('sf-genys-language-change', event => {language = event.detail.language === 'en' ? 'en' : 'lt';apply();});
  document.addEventListener('sf-genys-content-ready', apply);
  (async () => {
    try {
      const [defaultsResponse, configResponse] = await Promise.all([
        fetch(new URL('data/section-defaults/' + relative.replace(/\//g, '__') + '.json', root)),
        fetch('/api/content-config', {cache:'no-store',signal:AbortSignal.timeout(5000)})
      ]);
      if (!defaultsResponse.ok || !configResponse.ok) return;
      catalog = await defaultsResponse.json();
      const config = await configResponse.json();
      if (!config.configured) return;
      const response = await fetch(config.url + '/rest/v1/content_sections?select=page,published&published=not.is.null&page=eq.' + encodeURIComponent(relative), {headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(10000)});
      if (!response.ok) return;
      const rows = await response.json();
      published = Array.isArray(rows) ? rows[0]?.published : null;
      apply();
    } catch { /* Original page content stays available when the content service is unavailable. */ }
  })();
})();
