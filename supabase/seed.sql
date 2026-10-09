-- Starter content for the SF Genys editor.
-- Re-running this file leaves existing post edits intact.

insert into public.content_posts (
  kind,
  slug,
  date,
  date_label_lt,
  date_label_en,
  title_lt,
  title_en,
  summary_lt,
  summary_en,
  body_lt,
  body_en,
  photos,
  status,
  source_url
)
values
  (
    'news',
    'sekmes-aidui-2026',
    date '2026-09-14',
    '2026 m. rugsėjo 14 d.',
    'September 14, 2026',
    'Sėkmės, Aidai!',
    'Good luck, Aidas!',
    '„Genio“ bendruomenė linki kuo didžiausios sėkmės, ištvermės ir sveikatos Aidui Ardzijauskui bėgime per Ameriką!',
    'The Genys community wishes Aidas Ardzijauskas every success, endurance, and good health on his run across America!',
    '„Genio“ bendruomenė linki kuo didžiausios sėkmės, ištvermės ir sveikatos Aidui Ardzijauskui bėgime per Ameriką!',
    'The Genys community wishes Aidas Ardzijauskas every success, endurance, and good health on his run across America!',
    '[]'::jsonb,
    'published',
    'articles/naujienos/sekmes-aidui-2026.html'
  ),
  (
    'news',
    'sugrizome-i-geni-2026',
    date '2026-09-13',
    '2026 m. rugsėjo 13 d.',
    'September 13, 2026',
    'Sugrįžome į „Genį“!',
    'Welcome back to Genys!',
    'Po vasaros atostogų mokyklos kiemas vėl prisipildė vaikų juoko, draugų susitikimų ir lietuviško šurmulio. Tegu nauji mokslo metai būna kupini atradimų ir gražių draugysčių!',
    'After the summer break, our schoolyard was once again filled with children’s laughter, reunions with friends, and the lively sound of Lithuanian. May the new school year bring discoveries and wonderful friendships!',
    E'Šeštadienį mūsų mokyklos kiemas vėl prisipildė vaikų juoko, šypsenų, draugų susitikimų ir lietuviško šurmulio! Po vasaros atostogų sugrįžome puoselėti lietuvišką ryšį.\n\nTegu šie mokslo metai būna kupini smalsumo, naujų atradimų, gražių draugysčių ir daugybės smagių akimirkų.\n\nAčiū mokytojoms, tėveliams ir visai „Genio“ bendruomenei, kad kartu kuriame vietą, kur lietuvių kalba skamba, tradicijos gyvuoja, o vaikai auga su meile Lietuvai!',
    E'On Saturday, our schoolyard was once again filled with children’s laughter, smiles, reunions with friends, and the lively sound of Lithuanian! After the summer break, we returned to nurture our connection to our Lithuanian heritage.\n\nMay this school year be full of curiosity, new discoveries, wonderful friendships, and plenty of joyful moments.\n\nThank you to our teachers, parents, and the entire Genys community for helping create a place where Lithuanian is spoken, traditions thrive, and children grow up with a love for Lithuania!',
    '[]'::jsonb,
    'published',
    'articles/naujienos/mokslo-metu-pradzia-2026.html'
  ),
  (
    'news',
    'sveikiname-2026-2027-mokslo-metais',
    null,
    '2026–2027 mokslo metai',
    '2026–2027 school year',
    'Sveikiname su 2026–2027 mokslo metais!',
    'Welcome to the 2026–2027 school year!',
    'Lauksime visų rugsėjo 12 d. San Francisko lituanistinėje mokykloje „Genys“.',
    'We look forward to welcoming everyone on September 12 at San Francisco Lithuanian School “Genys.”',
    E'Sveikiname visus su 2026–2027 mokslo metais!\n\nLauksime jūsų šeštadienį, rugsėjo 12 d., San Francisko lituanistinėje mokykloje „Genys“ (19806 Wisteria St, Castro Valley, CA 94546).\n\nMokslo metų pradžios šventė prasidės 9:30 val. ryto. Pamokos vyks nuo 10:00 iki 13:30.\n\nPrimename, kad pirmąją dieną nuo 10:00 iki 11:30 vyks privalomas tėvų susirinkimas.\n\nSveiki, mieli tėveliai ir mažiausieji Zuikiai! Labai džiaugiamės, kad šį rudenį pradėsime naujus mokslo metus kartu su pačiais mažiausiais mūsų bendruomenės nariais.\n\nPirmasis „Zuikių“ klubo susitikimas vyks šeštadienį, rugsėjo 19 d. Toliau susitiksime du kartus per mėnesį visus mokslo metus. Mūsų veiklos vyks nuo 9:30 iki 12:00, po to vaikučiai galės smagiai leisti laiką mūsų žaidimų aikštelėje laisvo žaidimo metu.\n\n„Zuikių“ grupė (1–4 m. vaikams) yra puiki galimybė žaismingai praleisti laiką kartu, susipažinti su lietuvių kalba, dainomis, eilėraštukais ir tradicijomis. Čia svarbiausia – draugystė, šypsenos ir pirmieji žingsneliai lietuviškoje aplinkoje.',
    E'Welcome to the 2026–2027 school year!\n\nWe look forward to seeing you on Saturday, September 12, at San Francisco Lithuanian School “Genys” (19806 Wisteria St, Castro Valley, CA 94546).\n\nThe school year celebration begins at 9:30 a.m. Classes run from 10:00 a.m. to 1:30 p.m. A required parent meeting will take place on the first day from 10:00 to 11:30 a.m.\n\nWelcome, dear parents and little Bunnies! We are delighted to begin the school year with the youngest members of our community. The first “Bunny Club” meeting is on Saturday, September 19. After that, the group meets twice a month throughout the school year. Activities run from 9:30 a.m. to 12:00 p.m., followed by free play in our playground.\n\nThe “Bunny Club” group (for children ages 1–4) is a playful way to spend time together and become familiar with the Lithuanian language, songs, rhymes, and traditions. Friendship, smiles, and first steps in a Lithuanian-speaking environment are at the heart of it.',
    '[{"url":"/assets/google-site/82c8d45fc528f7c1.png","alt_lt":"2026–2027 mokslo metų informacija – mokyklos archyvo vaizdas","alt_en":"2026–2027 school year information – school archive image"}]'::jsonb,
    'published',
    'pages/mokslo-metu-info.html'
  ),
  (
    'news',
    'valstybines-sventes-2026',
    date '2026-08-18',
    '2026 m. rugpjūčio 18 d.',
    'August 18, 2026',
    'Kartu minėsime Lietuvos valstybines šventes',
    'We will celebrate Lithuania’s national holidays together',
    'Mokykloje tradicijas pažįstame gyvai – per istorijas, dainas ir bendras veiklas.',
    'We discover traditions through stories, songs, and hands-on activities.',
    E'Mokykloje Lietuvos tradicijas ir valstybines šventes pažįstame gyvai – per istorijas, dainas, kūrybines veiklas ir bendras akimirkas.\n\nKviečiame šeimas sekti mokyklos kalendorių ir prisijungti prie bendruomenės renginių.',
    E'At school, we experience Lithuanian traditions and national holidays through stories, songs, creative activities, and shared moments.\n\nWe invite families to follow the school calendar and join community events.',
    '[{"url":"/assets/sf-genys-community.png","alt_lt":"Mokyklos bendruomenė","alt_en":"School community"}]'::jsonb,
    'published',
    'articles/naujienos/sventes-2026.html'
  ),
  (
    'news',
    'sestadieniai-lietuviski-atradimai-2026',
    date '2026-08-11',
    '2026 m. rugpjūčio 11 d.',
    'August 11, 2026',
    'Šeštadieniai, pilni lietuviškų atradimų',
    'Saturdays full of Lithuanian discoveries',
    'Kalba, kūryba, žaidimas ir draugystė – kiekvienam amžiui pritaikyta programa.',
    'Language, creativity, play, and friendship – a programme for every age.',
    E'Kalba, kūryba, žaidimas ir draugystė – kiekvienam amžiui pritaikyta „Genio“ programa.\n\nŠeštadieniais vaikai susitinka mokytis lietuviškai, pažinti kultūrą ir kurti stiprius bendruomenės ryšius.',
    E'Language, creativity, play, and friendship – a programme at Genys for every age.\n\nOn Saturdays, children meet to learn Lithuanian, discover the culture, and build strong community connections.',
    '[{"url":"/assets/sf-genys-community.png","alt_lt":"SF Genys veikla","alt_en":"SF Genys activities"}]'::jsonb,
    'published',
    'articles/naujienos/sestadieniai-2026.html'
  ),
  (
    'event',
    'susitikimas-su-adrijumi-kveda',
    null,
    'Sausio 17 dieną 11 val. ryte',
    'January 17 at 11 a.m.',
    'Susitikimas su rašytoju Adrijumi Kveda',
    'A meeting with writer Adrijus Kveda',
    'San Francisko lituanistinė mokykla „Genys“ kviečia susitikti su jaunu lietuvių rašytoju ir pristatyti jo knygą „Statera“.',
    'San Francisco Lithuanian School “Genys” invites the community to meet a young Lithuanian writer and hear about his book “Statera.”',
    E'Sausio 17 dieną 11 val. ryte San Francisko lituanistinė mokykla „Genys“ kviečia į susitikimą su jaunu lietuvių rašytoju Adrijumi Kveda, kuriame bus pristatoma jo knyga „Statera“.\n\nIstorija gimusi iš mūsų trėmimų, partizanų kovų ir karo Ukrainoje.',
    E'On January 17 at 11 a.m., San Francisco Lithuanian School “Genys” invites you to meet young Lithuanian writer Adrijus Kveda, who will present his book “Statera.”\n\nThe story was born from our deportations, partisan struggles, and the war in Ukraine.',
    '[]'::jsonb,
    'published',
    'pages/renginiai.html'
  )
on conflict (slug) do nothing;

-- Seed the four existing gallery cards once per URL and display position.
insert into public.content_photos (url, alt_lt, alt_en, sort_order, status)
select gallery.url, gallery.alt_lt, gallery.alt_en, gallery.sort_order, 'published'
from (
  values
    ('/assets/sf-genys-community.png', 'Drauge į naujus metus', 'Together for a new year', 1),
    ('/assets/sf-genys-community.png', 'Idėjos laboratorijoje', 'Ideas in motion', 2),
    ('/assets/sf-genys-community.png', 'Tarp pamokų', 'Between classes', 3),
    ('/assets/sf-genys-community.png', 'Mokyklos kiemas', 'Our school community', 4)
) as gallery(url, alt_lt, alt_en, sort_order)
where not exists (
  select 1
  from public.content_photos existing
  where existing.url = gallery.url
    and existing.sort_order = gallery.sort_order
);
