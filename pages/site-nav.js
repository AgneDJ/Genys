(() => {
  const root = new URL('../', document.currentScript.src).href;
  const link = path => new URL(path, root).href;

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="site-nav">
      <a href="${link('index.html')}" class="brand" aria-label="SF Genys pradžia"><img class="brand-logo" src="${link('assets/logo.png')}" alt="SF Genys"></a>
      <button class="menu-btn" aria-label="Atidaryti meniu" aria-expanded="false">☰</button>
      <nav class="main-nav">
        <a href="${link('index.html')}">Pradžia</a>
        <details><summary>Apie mus</summary><div class="nav-menu"><a href="${link('pages/apie-mus/index.html')}">Apie mus – apžvalga</a><a href="${link('pages/apie-mus/vadoves-zodis.html')}">Vadovės žodis</a><a href="${link('pages/apie-mus/misija-ir-tikslai.html')}">Misija ir tikslai</a><a href="${link('pages/apie-mus/veikla.html')}">Veikla</a><a href="${link('pages/apie-mus/klases.html')}">Klasės</a><a href="${link('pages/apie-mus/mokytojai.html')}">Mūsų mokytojai</a></div></details>
        <a href="${link('pages/naujienos.html')}">Naujienos</a><a href="${link('pages/tvarkarastis.html')}">Tvarkaraštis</a>
        <details><summary>Tėvams</summary><div class="nav-menu"><a href="${link('pages/tevams/index.html')}">Tėvams – apžvalga</a><a href="${link('pages/registracija.html')}">Registracija</a><a href="${link('pages/kalendorius.html')}">Kalendorius</a><a href="${link('pages/tevams/tevu-komitetas.html')}">Tėvų komitetas</a><a href="${link('pages/tevams/atributika.html')}">Atributika</a><a href="${link('pages/tevams/budejimai.html')}">Budėjimai</a><a href="${link('pages/tevams/mokslo-kainos.html')}">Mokslų kainos</a><a href="${link('pages/tevams/amazon-wishlist.html')}">Amazon norų sąrašas</a></div></details>
        <a href="${link('pages/pedagogams.html')}">Pedagogams</a><a href="${link('pages/partneriams.html')}">Partneriams</a><a href="${link('pages/kontaktai.html')}">Kontaktai</a>
      </nav>
      <a class="portal-btn" href="${link('pages/registracija.html')}">Registracija <span>→</span></a>
    </header>
  `);

  const button = document.querySelector('.site-nav .menu-btn');
  const menu = document.querySelector('.site-nav .main-nav');
  button.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Uždaryti meniu' : 'Atidaryti meniu');
  });
  menu.querySelectorAll('a').forEach(item => item.addEventListener('click', () => menu.classList.remove('open')));
})();
