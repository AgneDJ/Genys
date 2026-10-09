const localData = {
  news: [
    {"date":"2026-09-14","category":"BENDRUOMENĖ","title":"Sėkmės, Aidai!","text":"„Genio“ bendruomenė linki kuo didžiausios sėkmės, ištvermės ir sveikatos Aidui Ardzijauskui bėgime per Ameriką!","link":"articles/naujienos/sekmes-aidui-2026.html"},
    {"date":"2026-09-13","category":"BENDRUOMENĖ","title":"Sugrįžome į „Genį“!","text":"Po vasaros atostogų mokyklos kiemas vėl prisipildė vaikų juoko, draugų susitikimų ir lietuviško šurmulio. Tegu nauji mokslo metai būna kupini atradimų ir gražių draugysčių!","link":"articles/naujienos/mokslo-metu-pradzia-2026.html"},
    { date: '2026–2027', category: 'BENDRUOMENĖ', title: 'Sveikiname su 2026–2027 mokslo metais!', text: 'Lauksime visų rugsėjo 12 d. San Francisko lituanistinėje mokykloje „Genys“.', link: 'https://sites.google.com/sfgenys.org/sfgenys/naujienos/2026-2027-mokslo-met%C5%B3-info', image: 'https://lh3.googleusercontent.com/sitesv/AG8ngQUjDKxPMIuyKjwU0gbAqsUdMhFSqGYtHFxsVo8KD2tR2_DrPN7Yh4G7DCbcnDb28WjN7BaXM4YByTXnXV84GHqFcWDD2AbYFe1XaFa7CvEZQpjGTCxNrPG9ymw-M2z8PmGk2158RvMFN3ArLz78sX6kjf9_OIbG5L6V0oe8-h5Q2ol5N0SSO_2qL5Qn8GSLEMkziHmKaVaVe96-HZ_9vEIAP95y_VFym97j1HD9MWk=w1280' },
    { date: '08.18', category: 'ŠVENTĖS', title: 'Kartu minėsime Lietuvos valstybines šventes', text: 'Mokykloje tradicijas pažįstame gyvai – per istorijas, dainas ir bendras veiklas.', link: 'articles/naujienos/sventes-2026.html' },
    { date: '08.11', category: 'KLASĖS', title: 'Šeštadieniai, pilni lietuviškų atradimų', text: 'Kalba, kūryba, žaidimas ir draugystė – kiekvienam amžiui pritaikyta programa.', link: 'articles/naujienos/sestadieniai-2026.html' }
  ],
  gallery: [
    { title: 'Drauge į naujus metus', position: '50% 50%' }, { title: 'Idėjos laboratorijoje', position: '22% 48%' },
    { title: 'Tarp pamokų', position: '76% 55%' }, { title: 'Mokyklos kiemas', position: '50% 24%' }
  ]
};
const englishData = {
  news: [
    {"date":"2026-09-14","category":"COMMUNITY","title":"Good luck, Aidas!","text":"The Genys community wishes Aidas Ardzijauskas every success, endurance, and good health on his run across America!","link":"articles/naujienos/sekmes-aidui-2026.html"},
    {"date":"2026-09-13","category":"COMMUNITY","title":"Welcome back to Genys!","text":"After the summer break, our schoolyard was once again filled with children’s laughter, reunions with friends, and the lively sound of Lithuanian. May the new school year bring discoveries and wonderful friendships!","link":"articles/naujienos/mokslo-metu-pradzia-2026.html"},
    { date: '2026–2027', category: 'COMMUNITY', title: 'Welcome to the 2026–2027 school year!', text: 'We look forward to welcoming everyone on September 12 at SF Genys.', link: 'https://sites.google.com/sfgenys.org/sfgenys/naujienos/2026-2027-mokslo-met%C5%B3-info', image: 'https://lh3.googleusercontent.com/sitesv/AG8ngQUjDKxPMIuyKjwU0gbAqsUdMhFSqGYtHFxsVo8KD2tR2_DrPN7Yh4G7DCbcnDb28WjN7BaXM4YByTXnXV84GHqFcWDD2AbYFe1XaFa7CvEZQpjGTCxNrPG9ymw-M2z8PmGk2158RvMFN3ArLz78sX6kjf9_OIbG5L6V0oe8-h5Q2ol5N0SSO_2qL5Qn8GSLEMkziHmKaVaVe96-HZ_9vEIAP95y_VFym97j1HD9MWk=w1280' },
    { date: '08.18', category: 'CELEBRATIONS', title: 'We will celebrate Lithuania’s national holidays together', text: 'We discover traditions through stories, songs, and hands-on activities.', link: 'articles/naujienos/sventes-2026.html' },
    { date: '08.11', category: 'CLASSES', title: 'Saturdays full of Lithuanian discoveries', text: 'Language, creativity, play, and friendship – a programme for every age.', link: 'articles/naujienos/sestadieniai-2026.html' }
  ],
  gallery: [{ title: 'Together for a new year', position: '50% 50%' }, { title: 'Ideas in motion', position: '22% 48%' }, { title: 'Between classes', position: '76% 55%' }, { title: 'Our school community', position: '50% 24%' }]
};
let database = localData;
let cmsContent = null;
function currentData(lang) {
  const fallback = lang === 'en' ? englishData : database;
  if (!cmsContent) return fallback;
  const news = cmsContent.posts.filter(post => post.kind === 'news').map(SiteContent.news).map(item => lang === 'en' ? { ...item, ...item.en } : item);
  const gallery = cmsContent.photos.map(photo => ({ title: SiteContent.text(photo, 'alt', lang), image: SiteContent.imageURL(photo.url), position: '50% 50%' })).filter(photo => photo.image);
  return { news, gallery };
}


function render(data) {
  const en = document.documentElement.lang === 'en';
  const node = (tag, text, className) => { const item = document.createElement(tag); if (text !== undefined) item.textContent = text; if (className) item.className = className; return item; };
  const url = value => window.SiteContent?.imageURL(value) || 'pages/naujienos.html';
  const image = (source, title) => { const img = node('img'); img.src = url(source); img.alt = title || ''; img.loading = 'lazy'; return img; };
  const latest = document.querySelector('#latest-news');
  if (latest) {
    latest.replaceChildren();
    const n = data.news[0];
    if (n) {
      const card = node('article', undefined, 'latest-card');
      const copy = node('div');
      copy.append(node('p', (en ? 'LATEST NEWS' : 'NAUJAUSIA NAUJIENA') + ' · ' + n.date, 'eyebrow'), node('h2', n.title), node('p', n.text));
      const link = node('a', en ? 'Read more →' : 'Skaityti daugiau →', 'btn btn-dark'); link.href = url(n.link); copy.append(link);
      card.append(image(n.image || 'assets/sf-genys-community.png', n.title), copy); latest.append(card);
    }
  }
  const preview = document.querySelector('#news-preview');
  const images = ['assets/su naujais.png', 'pages/apie-mus/vaikai.jpg', 'pages/Mokytojai/mokytojos.png'];
  if (preview) preview.replaceChildren(...data.news.slice(0,4).map((n,i) => {
    const card = node('a', undefined, 'news-preview-card'); card.href = url(n.link);
    card.append(image(n.image || images[i] || images[0], n.title), node('span', n.category), node('b', n.title), node('small', n.text), node('em', en ? 'Read more →' : 'Skaityti daugiau →'));
    return card;
  }));
  const gallery = document.querySelector('#gallery-grid');
  gallery.replaceChildren(...data.gallery.map((g,i) => {
    const button = node('button', undefined, 'gallery-item item-' + (i+1)); button.type = 'button';
    button.style.setProperty('--pos', /^\d{1,3}% \d{1,3}%$/.test(g.position) ? g.position : '50% 50%');
    const src = g.image || 'assets/sf-genys-community.png';
    button.append(image(src,g.title), node('span',g.title), node('b','↗'));
    button.addEventListener('click', () => openGallery(g.title,src)); return button;
  }));
  document.querySelectorAll('.gallery-open').forEach(button => {
    button.disabled = !data.gallery.length;
    button.onclick = () => { const first = data.gallery[0]; if (first) openGallery(first.title, first.image); };
  });
}

async function loadDatabase() {
  try { const response = await fetch('data/site-data.json'); if (!response.ok) throw Error(); database = await response.json(); }
  catch { database = localData; }
  cmsContent = window.SiteContent ? await SiteContent.load() : null;
  render(currentData(document.documentElement.lang));
}
async function loadTeachers() {
  const target = document.querySelector('#teachers-list');
  if (!target) return;
  try {
    const response = await fetch('data/teachers.json');
    if (!response.ok) throw Error();
    const data = await response.json();
    target.innerHTML = data.teachers.map(teacher => `<a class="teacher-profile" href="${teacher.article}"><span class="teacher-initial">${teacher.name.charAt(0)}</span><span><b>${teacher.name}</b><span>${teacher.role}</span></span></a>`).join('');
  } catch { target.innerHTML = '<p>Nepavyko įkelti mokytojų sąrašo.</p>'; }
}
function openGallery(title, image) { const modal = document.querySelector('#gallery-modal'); modal.querySelector('p').textContent = title; modal.querySelector('img').src = image || 'assets/sf-genys-community.png'; modal.querySelector('img').alt = title || ''; modal.showModal(); }
document.querySelector('.close-modal').addEventListener('click', () => document.querySelector('#gallery-modal').close());
document.querySelector('#gallery-modal').addEventListener('click', e => { if (e.target.id === 'gallery-modal') e.currentTarget.close(); });
const menuButton = document.querySelector('.menu-btn');
const mainNav = document.querySelector('#main-nav');
const closeMenu = () => {
  mainNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Open menu' : 'Atidaryti meniu');
};
menuButton.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', document.documentElement.lang === 'en' ? (isOpen ? 'Close menu' : 'Open menu') : (isOpen ? 'Uždaryti meniu' : 'Atidaryti meniu'));
});
document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', () => { document.querySelectorAll('#main-nav a').forEach(a => a.classList.remove('active')); link.classList.add('active'); closeMenu(); }));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
const translations = {
  en: {
    '.editor-login': 'Log in',
    '.brand span:last-child': 'SF<br><strong>„Genys“</strong>',
    "#main-nav [data-nav=\"home\"]": "Home",
    "#main-nav [data-nav=\"about\"]": "About us",
    "#main-nav [data-nav=\"about-overview\"]": "About us – overview",
    "#main-nav [data-nav=\"director\"]": "Director’s message",
    "#main-nav [data-nav=\"mission\"]": "Mission & goals",
    "#main-nav [data-nav=\"activities\"]": "Activities",
    "#main-nav [data-nav=\"classes\"]": "Classes",
    "#main-nav [data-nav=\"teachers\"]": "Our teachers",
    "#main-nav [data-nav=\"news\"]": "News",
    "#main-nav [data-nav=\"news-overview\"]": "All news",
    "#main-nav [data-nav=\"events\"]": "Events",
    "#main-nav [data-nav=\"schedule\"]": "Schedule",
    "#main-nav [data-nav=\"parents\"]": "For parents",
    "#main-nav [data-nav=\"parents-overview\"]": "For parents – overview",
    "#main-nav [data-nav=\"registration\"]": "Registration",
    "#main-nav [data-nav=\"calendar\"]": "Calendar",
    "#main-nav [data-nav=\"committee\"]": "Parents committee",
    "#main-nav [data-nav=\"items\"]": "School items",
    "#main-nav [data-nav=\"duties\"]": "Duty roster",
    "#main-nav [data-nav=\"tuition\"]": "Tuition",
    "#main-nav [data-nav=\"wishlist\"]": "Amazon wishlist",
    "#main-nav [data-nav=\"educators\"]": "Educators",
    "#main-nav [data-nav=\"partners\"]": "Partners",
    "#main-nav [data-nav=\"contacts\"]": "Contacts",
    '.portal-btn': 'Register <span>→</span>', '.hero .eyebrow': 'SAN FRANCISCO LITHUANIAN SCHOOL', '.hero h1': 'Let’s nurture<br>Lithuanian heritage <i>together!</i>', '.hero-copy>p:not(.eyebrow)': 'A place where Lithuanian language, culture, and traditions come alive.', '.hero-actions .btn': 'Discover „Genys“ <span>→</span>', '.hero-actions .text-link': 'News <span>↓</span>', '.hero-badge': '<b>SF · CA</b><span>Saturday school</span>',
    '.alert-label': 'IMPORTANT NOTICE', '.alert p': 'Registration for the new school year is now open. Join the „Genys“ community!',
    '#registration .eyebrow': 'BUNNY CLUB · 2026–2027', '#registration h2': 'Registration is<br><i>now open!</i>', '#registration .registration-lead': 'We invite the youngest members of our community to join „Bunny Club“ – an early childhood learning group.', '#registration .registration-facts div:nth-child(1)': '<span>AGE</span><b>1–3 years, 11 months</b>', '#registration .registration-facts div:nth-child(2)': '<span>WHEN</span><b>Every other Saturday</b>', '#registration .registration-facts div:nth-child(3)': '<span>TIME</span><b>9:30 AM–12:00 PM</b>', '#registration .registration-text': 'A fun, playful, and warm Lithuanian environment where little ones and their families learn the language, discover traditions, sing, play, create, and make friends. Afterwards, playtime continues at the school playground with parent supervision.', '#registration .btn': 'Open registration form <span>↗</span>', '#registration .form-card-head span': 'REGISTRATION FORM', '#registration .form-card-head small': '„Bunny Club“',
    '#school-registration .eyebrow': 'GENYS · 2026–2027 SCHOOL YEAR', '#school-registration h2': 'The Lithuanian journey<br>starts here.', '#school-registration-copy': '', '.school-registration-copy>p:not(.eyebrow):not(.payment-note)': 'San Francisco Lithuanian School „Genys“ welcomes Lithuanian heritage children ages 4–14 to learn the Lithuanian language, discover Lithuanian culture, and begin or continue their learning journey.', '.deadline span': 'REGISTRATION DEADLINE', '.deadline b': 'By July 1', '.deadline small': 'After July 1, 2026, the registration fee is non-refundable.', '#school-registration .btn': 'Open school registration form <span>↗</span>', '.payment-note': 'The registration fee is paid through Zeffy.', '.school-form .form-card-head span': 'SCHOOL REGISTRATION FORM', '.school-form .form-card-head small': 'For children ages 4–14',
    '#about .eyebrow': 'OUR STORY', '#about h2': 'Language, culture<br>and friendship.', '#about .intro-text p': 'San Francisco Lithuanian School „Genys“ is a place where children learn Lithuanian and grow together through joyful experiences. We nurture a living connection with Lithuania and with one another.', '#about .text-link': 'More about us <span>→</span>',
    '#news .eyebrow': 'WHAT’S HAPPENING', '#news h2': 'News and events', '#news .section-head .text-link': 'All news <span>→</span>', '.news-archive-cta p': 'Find all previous news and photographs in our news archive.', '.news-archive-cta .btn': 'Open news <span>→</span>', '.latest-card .eyebrow': 'LATEST NEWS · 2026–2027', '.latest-card .btn': 'Read more <span>→</span>',
    '#teachers .eyebrow': 'OUR PEOPLE', '#teachers h2': 'MEET OUR TEACHING TEAM', '#teachers .teachers-copy>p:not(.eyebrow)': 'Teachers and volunteers create a welcoming space for language, creativity, play, and every child’s confidence.', '#teachers .btn': 'Meet the team <span>→</span>', '.teacher-team-photo figcaption': 'SF „Genys“ teaching team', '.teacher-card:nth-of-type(1) p': '<b>Language & writing</b><span>Speaking, reading, creating</span>', '.teacher-card:nth-of-type(2) p': '<b>Culture & traditions</b><span>Celebrations, songs, stories</span>', '.teacher-card:nth-of-type(3) p': '<b>Community</b><span>Growing together in the Bay Area</span>', '.quote': '“Lithuanian heritage lives when we share it.”',
    '#gallery .eyebrow': 'MOMENTS', '#gallery h2': 'Life at „Genys“', '.gallery-open': 'Open gallery <span>↗</span>',
    '#calendar .eyebrow': 'PLAN TOGETHER', '#calendar h2': 'School year<br>calendar', '#calendar .calendar-copy>p:not(.eyebrow)': 'Events, classes, celebrations, and important dates – all in one place.', '#calendar .text-link': 'Open in Google Sheets <span>↗</span>', '.calendar-bar span': '<i></i> Live document', '.calendar-bar small': 'Updates made in Google Sheets appear here automatically',
    '#contacts .eyebrow': 'LET’S CONNECT', '#contacts h2': 'Join<br>our community.', '#contacts>div>p:not(.eyebrow)': 'Have a question about classes, registration, or our community? Get in touch – we would love to help.', '.contact-card div:nth-child(1)': '<span>Hours</span><b>Saturdays, 9:30 AM–1:30 PM</b>', '.contact-card div:nth-child(2)': '<span>Address</span><b>19806 Wisteria St<br>Castro Valley, CA 94546</b>', '.contact-card div:nth-child(3)': '<span>Online</span><b>sfgenys.org</b>', '.contact-card .btn': 'Facebook <span>↗</span>', '.map-label span': 'FIND US', '.map-label a': 'Open in Maps ↗', '.footer-inner>span:first-child': '© 2026 SF Lithuanian School „Genys“', '.footer-inner>span:nth-child(2)': 'Language connects us.'
  }
};
document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
  const lang = button.dataset.lang;
  try { localStorage.setItem('sf-genys-language', lang); } catch {}
  document.documentElement.lang = lang;
  closeMenu();
  document.querySelectorAll('[data-lang]').forEach(item => item.classList.toggle('active', item === button));
  if (lang === 'en') { Object.entries(translations.en).forEach(([selector, value]) => { const element = document.querySelector(selector); if (element) element.innerHTML = value; }); render(currentData('en')); }
  else { window.location.reload(); }
}));
loadDatabase().then(() => {
  try { if (localStorage.getItem('sf-genys-language') === 'en') document.querySelector('[data-lang="en"]').click(); } catch {}
});
loadTeachers();
