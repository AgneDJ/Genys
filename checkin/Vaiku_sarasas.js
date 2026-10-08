/*
  VAIKŲ SĄRAŠAS
  Edit this roster to add, remove, or move children.
  Keep each child PIN synchronized with google-apps-script/Code.gs.
  Keep the class `name` in Lithuanian: it is used for the Google Sheet tab.
*/
window.VAIKU_SARASAS = [
  {
    name: 'Zuikučiai', en: 'Bunny class',
    children: [
      { name: 'Sara Kirtikar', pin: '4992', birthDate: '2024-05-23' },
      { name: 'Anouk Vala-Thiery (Anūkė)', pin: '4792', birthDate: '2024-03-15' },
      { name: 'Percy Andrius Alexander (Persiukas)', pin: '7140', birthDate: '2024-06-27' },
      { name: 'Saulė Vierra', pin: '4995', birthDate: '2023-07-29' },
      { name: 'Lukas Stempel', pin: '6201', birthDate: '2023-03-16' },
      { name: 'Emma Presswood', pin: '0994', birthDate: '2023-06-30' }
    ]
  },
  {
    name: 'Priešmokyklinė ir darželio klasė', en: 'Preschool & kindergarten',
    children: [
      { name: 'Miles', pin: '1799' },
      { name: 'Julius Djacenko', pin: '8379' }, { name: 'Emilija Burlingė', pin: '6355' },
      { name: 'Athena Bouzidi', pin: '4087' }, { name: 'Jonas Sebastian Laucys', pin: '1792' },
      { name: 'Ulla Putz', pin: '4073' }, { name: 'Melissa Jariga', pin: '7726' },
      { name: 'Marija Kudirka', pin: '6046' }, { name: 'Pranas Kudirka', pin: '1347' }
    ]
  },
  {
    name: '1 klasė', en: 'Grade 1',
    children: [{ name: 'Aurelija Vierra', pin: '1260' }, { name: 'Emily Radlinski', pin: '8858' }]
  },
  {
    name: '2–3 klasė', en: 'Grades 2–3',
    children: [
      { name: 'Karim Rapolas Ghassan El Chmaytilli (Karimas)', pin: '0922' },
      { name: 'Nida Kiaune', pin: '5208' }, { name: 'Julius Kudirka', pin: '3950' },
      { name: 'Noah Bouzidi', pin: '3010' }, { name: 'Melina Grivickas', pin: '9234' },
      { name: 'Mavi Grivickas', pin: '8297' }, { name: 'Jonas Aklifazla', pin: '7117' },
      { name: 'Arya Apke', pin: '7694' }
    ]
  },
  {
    name: '4 klasė', en: 'Grade 4',
    children: [{ name: 'Jordan Abudeab', pin: '6389' }, { name: 'Christopher Radlinski', pin: '7231' }]
  },
  {
    name: '6 klasė', en: 'Grade 6',
    children: [
      { name: 'Akila Aklifazla', pin: '1103' }, { name: 'Kalani Valverde', pin: '1906' },
      { name: 'Nida Šukytė', pin: '7171' }, { name: 'Ugnė Olivia Laučys', pin: '6387' },
      { name: 'Amber Apke', pin: '1009' }, { name: 'Arvydas Kudirka', pin: '2102' }
    ]
  },
  {
    name: '8 klasė', en: 'Grade 8',
    children: [{ name: 'Adam Abudeab', pin: '8075' }, { name: 'Kintas Valverde', pin: '0389' }]
  }
];
