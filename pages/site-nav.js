(() => {
  const root = new URL('../', document.currentScript.src).href;
  const link = path => new URL(path, root).href;

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="site-nav">
      <a href="${link('index.html')}" class="brand" aria-label="SF Genys pradžia"><img class="brand-logo" src="${link('assets/logo.png')}" alt="SF Genys"></a>
      <button class="menu-btn" aria-label="Atidaryti meniu" aria-expanded="false">☰</button>
      <nav class="main-nav">
        <a data-nav="home" href="${link('index.html')}">Pradžia</a>
        <details><summary data-nav="about">Apie mus</summary><div class="nav-menu"><a data-nav="about-overview" href="${link('pages/apie-mus/index.html')}">Apie mus – apžvalga</a><a data-nav="director" href="${link('pages/apie-mus/vadoves-zodis.html')}">Vadovės žodis</a><a data-nav="mission" href="${link('pages/apie-mus/misija-ir-tikslai.html')}">Misija ir tikslai</a><a data-nav="activities" href="${link('pages/apie-mus/veikla.html')}">Veikla</a><a data-nav="classes" href="${link('pages/apie-mus/klases.html')}">Klasės</a><a data-nav="teachers" href="${link('pages/apie-mus/mokytojai.html')}">Mūsų mokytojai</a></div></details>
        <details><summary data-nav="news">Naujienos</summary><div class="nav-menu"><a data-nav="news-overview" href="${link('pages/naujienos.html')}">Visos naujienos</a><a data-nav="events" href="${link('pages/renginiai.html')}">Renginiai</a></div></details><a data-nav="schedule" href="${link('pages/tvarkarastis.html')}">Tvarkaraštis</a>
        <details><summary data-nav="parents">Tėvams</summary><div class="nav-menu"><a data-nav="parents-overview" href="${link('pages/tevams/index.html')}">Tėvams – apžvalga</a><a data-nav="registration" href="${link('pages/registracija.html')}">Registracija</a><a data-nav="calendar" href="${link('pages/kalendorius.html')}">Kalendorius</a><a data-nav="committee" href="${link('pages/tevams/tevu-komitetas.html')}">Tėvų komitetas</a><a data-nav="items" href="${link('pages/tevams/atributika.html')}">Atributika</a><a data-nav="duties" href="${link('pages/tevams/budejimai.html')}">Budėjimai</a><a data-nav="tuition" href="${link('pages/tevams/mokslo-kainos.html')}">Mokslų kainos</a><a data-nav="wishlist" href="${link('pages/tevams/amazon-wishlist.html')}">Amazon norų sąrašas</a></div></details>
        <a data-nav="educators" href="${link('pages/pedagogams.html')}">Pedagogams</a><a data-nav="partners" href="${link('pages/partneriams.html')}">Partneriams</a><a data-nav="contacts" href="${link('pages/kontaktai.html')}">Kontaktai</a>
      </nav>
      <div class="language-switch" aria-label="Kalba / Language"><button type="button" class="active" data-lang="lt" aria-pressed="true">LT</button><button type="button" data-lang="en" aria-pressed="false">EN</button></div>
      <!-- REGISTRATION BUTTON TEMPORARILY DISABLED
      <a class="portal-btn" href="${link('pages/registracija.html')}">Registracija <span>→</span></a>
      -->
    </header>
  `);

  const editorFooter = document.createElement('footer');
  editorFooter.className = 'content-editor-entry';
  const editorLogin = document.createElement('a'); editorLogin.href = link('admin/index.html'); editorLogin.textContent = 'Prisijungti';
  editorFooter.append(editorLogin); document.body.append(editorFooter);

  const button = document.querySelector('.site-nav .menu-btn');
  const menu = document.querySelector('.site-nav .main-nav');
  const labels = {"home":"Home","about":"About us","about-overview":"About us – overview","director":"Director’s message","mission":"Mission & goals","activities":"Activities","classes":"Classes","teachers":"Our teachers","news":"News","news-overview":"All news","events":"Events","schedule":"Schedule","parents":"For parents","parents-overview":"For parents – overview","registration":"Registration","calendar":"Calendar","committee":"Parents committee","items":"School items","duties":"Duty roster","tuition":"Tuition","wishlist":"Amazon wishlist","educators":"Educators","partners":"Partners","contacts":"Contacts"};
  const lithuanian = new Map([...menu.querySelectorAll('[data-nav]')].map(node => [node, node.textContent]));
  const bilingual = new Map([...document.querySelectorAll('[data-en]')].map(node => [node, node.textContent]));
  const lithuanianTitle = document.title;
  const englishTitle = document.body.dataset.titleEn;
  const bilingualArticles = new Set([...bilingual.keys()].map(node => node.closest('article')).filter(Boolean));
  let language = 'lt';
  const closeMenu = () => {
    menu.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', language === 'en' ? 'Open menu' : 'Atidaryti meniu');
  };
  const setLanguage = lang => {
    language = lang;
    editorLogin.textContent = lang === 'en' ? 'Log in' : 'Prisijungti';
    document.querySelector('.site-nav').lang = lang;
    for (const [node, lt] of bilingual) node.textContent = lang === 'en' ? node.dataset.en : lt;
    if (bilingual.size) document.documentElement.lang = lang;
    bilingualArticles.forEach(article => { article.lang = lang; });
    if (englishTitle) document.title = lang === 'en' ? englishTitle : lithuanianTitle;
    for (const [node, lt] of lithuanian) node.textContent = lang === 'en' ? labels[node.dataset.nav] : lt;
    const registrationButton = document.querySelector('.site-nav .portal-btn');
    if (registrationButton) registrationButton.innerHTML = (lang === 'en' ? 'Register' : 'Registracija') + ' <span>→</span>';
    document.querySelectorAll('.site-nav [data-lang]').forEach(item => {
      const selected = item.dataset.lang === lang;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    try { localStorage.setItem('sf-genys-language', lang); } catch {}
    closeMenu();
    document.dispatchEvent(new CustomEvent('sf-genys-language-change', { detail: { language: lang } }));
  };
  document.querySelectorAll('.site-nav [data-lang]').forEach(item => item.addEventListener('click', () => setLanguage(item.dataset.lang)));
  button.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', language === 'en' ? (isOpen ? 'Close menu' : 'Open menu') : (isOpen ? 'Uždaryti meniu' : 'Atidaryti meniu'));
  });
  menu.querySelectorAll('a').forEach(item => item.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  let savedLanguage = 'lt';
  try { if (localStorage.getItem('sf-genys-language') === 'en') savedLanguage = 'en'; } catch {}
  setLanguage(savedLanguage);
})();
