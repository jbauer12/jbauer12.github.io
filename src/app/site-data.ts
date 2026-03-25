export type NavItem = {
  label: string;
  path: string;
  exact?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  external: boolean;
};

export const navItems: NavItem[] = [
  { label: 'Start', path: '/', exact: true },
  { label: 'Events', path: '/events' },
  { label: 'Galerie', path: '/gallery' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Mitglied werden', path: '/mitglied-werden' },
];

export const socialLinks: SocialLink[] = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/vaidaisnotdead_ev/',
    external: true,
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/vaidaisnotdead/',
    external: true,
  },
  {
    label: 'E-Mail',
    href: 'mailto:info@vaidaisnotdead.de',
    external: false,
  },
];

export const homeHighlights = [
  {
    title: 'Konzerte und Sessions',
    text:
      'Nicht nur gebuchte Konzertabende, sondern auch offene musikalische Formate mit Platz fuer Austausch, Impro und spontane Begegnung.',
  },
  {
    title: 'Viechtach als Ausgangspunkt',
    text:
      'Die oeffentliche Beschreibung nennt klar Jugend- und Subkultur im Bayerischen Wald. Genau das soll auch der neue Auftritt zeigen.',
  },
  {
    title: 'Mobil zuerst gedacht',
    text:
      'Die Seiten bleiben knapp, kontrastreich und schnell scanbar, damit Termine, Kontakt und Haltung auch auf kleinen Displays sofort funktionieren.',
  },
];

export const eventFormats = [
  {
    label: 'Format 01',
    title: 'Offene Jam-Session',
    text:
      'Ein lockerer musikalischer Austausch von Funk bis Punk. Offen fuer Leute mit Instrumenten, Ideen und Lust auf einen Abend ohne starre Buehnenkante.',
    note: 'So ein Format taucht bereits im oeffentlichen Facebook-Auftritt auf und soll hier spaeter direkt mit Termin, Uhrzeit und Ort erscheinen.',
  },
  {
    label: 'Format 02',
    title: 'DIY-Konzertabend',
    text:
      'Gebuchte Bands, rohe Energie, kurzer Weg zwischen Publikum und Buehne. Kein Eventglanz, sondern ein Abend, der nah dran bleibt.',
    note: 'Wenn Termine fix sind, sollen sie hier kompakt mit Einlass, Running Order und Links landen.',
  },
  {
    label: 'Format 03',
    title: 'Szenetreff und Soli-Abend',
    text:
      'Nicht jeder Abend muss nur aus einem Line-up bestehen. Auch Support, Planung, Austausch und gemeinsames Tragen haben hier einen Platz.',
    note: 'Gut geeignet fuer Formate, bei denen Szene, Verein und Unterstuetzung ineinandergreifen.',
  },
  {
    label: 'Format 04',
    title: 'Ankuendigungen ohne Scrollsuche',
    text:
      'Die neue Events-Seite ist dafuer da, Termine sauber zu sammeln, statt sie in Storys, Postings und verstreuten Hinweisen verschwinden zu lassen.',
    note: 'Bis dahin bleiben Instagram und Facebook die schnellsten Kanaele fuer kurzfristige Updates.',
  },
];

export const galleryItems = [
  {
    src: '/facebook-jam-session.jpg',
    alt: 'Oeffentlich sichtbarer Flyer fuer eine Jam-Session von Vaida is not dead e.V.',
    caption:
      'Handgemachter Flyer fuer ein offenes Session-Format. Der Ton geht eher in Richtung Szene-Aushang als in Richtung Werbebanner.',
  },
  {
    src: '/vaidaisnotdead-logo.png',
    alt: 'Logo von Vaida is not dead e.V.',
    caption:
      'Die aktuelle Wort-Bild-Marke bleibt der staerkste visuelle Anker und funktioniert auch alleine als Motiv.',
  },
  {
    src: '/facebook-page-preview.jpg',
    alt: 'Oeffentlich sichtbare Vorschaubild-Kachel der Facebook-Seite',
    caption:
      'Kleiner oeffentlicher Einblick in den Social-Auftritt. Auch hier wirkt alles eher rau, direkt und selbstgemacht.',
  },
  {
    src: '/gallery-tile-01.jpg',
    alt: 'Oeffentlich sichtbarer Bildausschnitt aus dem Facebook-Auftritt von Vaida is not dead e.V.',
    caption:
      'Erstes Zusatzmotiv fuer die Gallery-Seite, um dem Auftritt einen einfacheren, aber echten Bilderrahmen zu geben.',
  },
  {
    src: '/gallery-tile-02.jpg',
    alt: 'Kleine oeffentlich sichtbare Bildkachel aus dem Facebook-Auftritt',
    caption:
      'Kleine Vorschaukachel aus dem oeffentlichen Material. Nicht Hochglanz, aber genau darin liegt der Reiz.',
  },
];

export const faqItems = [
  {
    question: 'Was soll hier fuer Veranstaltungen auftauchen?',
    answer:
      'Im Fokus stehen DIY-Konzertabende, offene Sessions und Formate, die Jugend- und Subkultur in Viechtach sichtbar machen. Die Seite soll diese Termine kuenftig gesammelt und klar lesbar zeigen.',
  },
  {
    question: 'Wo erfahre ich aktuelle Termine, solange die Seite weiter waechst?',
    answer:
      'Bis alle Inhalte final eingebunden sind, laufen kurzfristige Hinweise weiterhin am schnellsten ueber Instagram und Facebook. Die neue Events-Seite bereitet aber genau diesen Wechsel vor.',
  },
  {
    question: 'Kann ich mit einer Band oder einem Format anfragen?',
    answer:
      'Ja. Am besten kurz und direkt per Mail oder ueber Instagram schreiben: Wer seid ihr, was spielt ihr, und was fuer einen Rahmen sucht ihr?',
  },
  {
    question: 'Warum sieht die Seite so reduziert aus?',
    answer:
      'Weil sie naeher an Flyern, Clubwaenden und direkter Kommunikation bleiben soll als an einem glatten Event-Portal. Der Auftritt darf roh sein, solange er klar funktioniert.',
  },
  {
    question: 'Wie kann ich den Verein unterstuetzen?',
    answer:
      'Mitgliedschaft ist ein Weg. Dazu kommen Hilfe bei Aufbau, Awareness, Technik, Orga, Einlass oder einfach regelmaessiges Mittragen von Abenden und Strukturen.',
  },
];

export const membershipReasons = [
  'weil Jugend- und Subkultur auf dem Land tragende Leute braucht und nicht nur Publikum',
  'weil Konzerte, Sessions und offene Formate einfacher werden, wenn Verantwortung geteilt wird',
  'weil aus einer losen Szene durch Mitmachen langsam eine belastbare Struktur wird',
  'weil Unterstützung auch heisst, Raum fuer zukuenftige Abende, Bands und Ideen zu sichern',
];

export const membershipSteps = [
  'kurz per Mail melden und sagen, dass du mitmachen oder mehr zur Mitgliedschaft wissen willst',
  'in Kontakt kommen, Fragen klaeren und herausfinden, wie du dich am liebsten einbringen moechtest',
  'bei Abenden, Planung oder laufender Vereinsarbeit Schritt fuer Schritt Teil der Struktur werden',
];
