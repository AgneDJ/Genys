(() => {
  const target = document.querySelector('[data-content-article]');
  const eventList = document.querySelector('[data-content-events]');
  if (!target && !eventList) return;
  let content, lang = 'lt';
  try { if (localStorage.getItem('sf-genys-language') === 'en') lang = 'en'; } catch {}
  const node = (tag, text, className) => {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = text;
    if (className) item.className = className;
    return item;
  };
  const article = post => {
    const result = node('article', undefined, 'article');
    result.lang = lang;
    const date = SiteContent.text(post, 'date_label', lang) || post.date || '';
    result.append(node('p', (post.kind === 'event' ? (lang === 'en' ? 'EVENTS' : 'RENGINIAI') : (lang === 'en' ? 'NEWS' : 'NAUJIENOS')) + (date ? ' · ' + date : ''), 'eyebrow'));
    result.append(node(target ? 'h1' : 'h2', SiteContent.text(post, 'title', lang)));
    const body = SiteContent.text(post, 'body', lang) || SiteContent.text(post, 'summary', lang);
    body.split(/\n\s*\n|\n/).filter(part => part.trim()).forEach(part => result.append(node('p', part)));
    const photos = Array.isArray(post.photos) ? post.photos : [];
    if (photos.length) {
      const grid = node('div', undefined, 'news-photo-gallery');
      photos.forEach(photo => {
        const url = SiteContent.imageURL(photo.url);
        if (!url) return;
        const figure = node('figure');
        const image = node('img'); image.src = url; image.alt = SiteContent.text(photo, 'alt', lang); image.loading = 'lazy';
        figure.append(image); grid.append(figure);
      });
      result.append(grid);
    }
    const source = SiteContent.imageURL(post.source_url);
    if (source) {
      const link = node('a', lang === 'en' ? 'More information →' : 'Daugiau informacijos →', 'back');
      link.href = source; const paragraph = node('p'); paragraph.append(link); result.append(paragraph);
    }
    return result;
  };
  const render = () => {
    if (!content) return;
    if (target) {
      const slug = new URLSearchParams(location.search).get('slug');
      const post = content.posts.find(item => item.slug === slug);
      target.replaceChildren(post ? article(post) : node('p', lang === 'en' ? 'This article is not available.' : 'Šis straipsnis nepasiekiamas.'));
      if (post) document.title = SiteContent.text(post, 'title', lang) + ' | SF Genys';
      document.documentElement.lang = lang;
    }
    if (eventList) {
      const posts = content.posts.filter(post => post.kind === 'event');
      eventList.replaceChildren(...posts.map(article));
      if (!posts.length) eventList.append(node('p', lang === 'en' ? 'No events have been announced yet.' : 'Renginiai dar nepaskelbti.'));
    }
  };
  document.addEventListener('sf-genys-language-change', event => { lang = event.detail.language === 'en' ? 'en' : 'lt'; render(); });
  SiteContent.load().then(data => { content = data; render(); if (!content && target) target.textContent = lang === 'en' ? 'The article could not be loaded. Please try again later.' : 'Straipsnio nepavyko įkelti. Pabandykite vėliau.'; });
})();
