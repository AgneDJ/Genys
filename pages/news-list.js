(() => {
  const list = document.querySelector('[data-news-list]');
  if (!list) return;
  const root = new URL('../', document.currentScript.src).href;
  const archive = document.querySelector('[data-news-archive]');
  let language = 'lt';
  let news = [];
  try { if (localStorage.getItem('sf-genys-language') === 'en') language = 'en'; } catch {}
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const safeURL = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, root);
      return ['http:', 'https:', 'file:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  const card = (source, index) => {
    const translated = language === 'en' && source.en && typeof source.en === 'object' && !Array.isArray(source.en);
    const item = translated ? { ...source, ...source.en } : source;
    const article = element('article', undefined, 'local-news-card');
    article.lang = translated ? 'en' : 'lt';
    const content = item.image ? element('div') : article;
    const imageURL = safeURL(item.image);
    if (imageURL) {
      article.classList.add('featured-local-news');
      const image = element('img');
      image.src = imageURL;
      image.alt = item.title;
      image.loading = index === 0 && !archive ? 'eager' : 'lazy';
      article.append(image);
    }
    const meta = element('p', undefined, 'news-meta');
    meta.append(element('span', item.date || ''), element('b', item.category || ''));
    content.append(meta, element('h3', item.title), element('p', item.text || ''));
    const linkURL = safeURL(item.link);
    if (linkURL) {
      const link = element('a', language === 'en' ? 'Read more →' : 'Skaityti daugiau →');
      link.lang = language;
      link.href = linkURL;
      content.append(link);
    }
    if (content !== article) article.append(content);
    return article;
  };
  const render = () => {
    if (!news.length) return;
    const visible = archive ? news.slice(4) : news.slice(0, 4);
    list.replaceChildren(...visible.map(card));
    if (archive) archive.hidden = visible.length === 0;
  };
  document.addEventListener('sf-genys-language-change', event => {
    language = event.detail.language === 'en' ? 'en' : 'lt';
    render();
  });
  // The editorial news array is maintained newest first; date labels also include school years.
  fetch('../data/site-data.json')
    .then(response => {
      if (!response.ok) throw new Error('News data unavailable');
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.news)) return;
      news = data.news.filter(item => item && typeof item.title === 'string' && item.title.trim());
      render();
    })
    .catch(() => { /* Keep the existing cards and historical archive available offline. */ });
})();
