(() => {
  const root = new URL('../', document.currentScript.src).href;
  let request;
  const imageURL = value => {
    try {
      if (typeof value !== 'string' || !value.trim()) return null;
      const url = new URL(value, root);
      return ['https:', 'http:', 'file:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  async function readRows(config, table, order) {
    const rows = [];
    for (let offset = 0; offset < 5000; offset += 100) {
      const url = config.url + '/rest/v1/' + table + '?select=*&status=eq.published&order=' + order + '&limit=100&offset=' + offset;
      const response = await fetch(url, { headers: { apikey: config.publishableKey }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Content unavailable');
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error('Invalid content');
      rows.push(...page);
      if (page.length < 100) break;
    }
    return rows;
  }
  const load = () => request ||= (async () => {
    try {
      const response = await fetch('/api/content-config', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      if (!response.ok) return null;
      const config = await response.json();
      if (!config.configured || !config.url || !config.publishableKey) return null;
      const [posts, photos] = await Promise.all([
        readRows(config, 'content_posts', 'date.desc.nullslast,created_at.desc,id.desc'),
        readRows(config, 'content_photos', 'sort_order.asc,id.asc')
      ]);
      return { posts, photos };
    } catch { return null; }
  })();
  const text = (item, key, lang) => String(item[key + '_' + lang] || item[key + '_lt'] || '');
  const postLink = post => new URL('pages/straipsnis.html?slug=' + encodeURIComponent(post.slug), root).href;
  const news = post => ({
    date: post.date_label_lt || post.date || '', category: 'BENDRUOMENĖ',
    title: text(post, 'title', 'lt'), text: text(post, 'summary', 'lt'), link: postLink(post),
    image: imageURL(post.photos?.[0]?.url),
    en: { date: post.date_label_en || post.date || '', category: 'COMMUNITY', title: text(post, 'title', 'en'), text: text(post, 'summary', 'en') }
  });
  window.SiteContent = { load, imageURL, text, postLink, news, root };
})();
