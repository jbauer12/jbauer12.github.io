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

export type FacebookMirror = {
  label: string;
  title: string;
  date: string;
  text: string;
  note: string;
  href: string;
  cta: string;
  imageSrc: string;
  imageAlt: string;
};

export type MembershipTrack = {
  kind: 'foerder' | 'aktiv';
  label: string;
  title: string;
  intro: string;
  details: string[];
  note: string;
  cta: string;
  imageSrc: string;
  imageAlt: string;
  symbol: string;
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
      'Nicht nur gebuchte Konzertabende, sondern auch offene musikalische Formate mit Platz für Austausch, Impro und spontane Begegnung.',
  },
  {
    title: 'Viechtach als Ausgangspunkt',
    text:
      'Die öffentliche Beschreibung nennt klar Jugend- und Subkultur im Bayerischen Wald. Genau das soll auch der neue Auftritt zeigen.',
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
      'Ein lockerer musikalischer Austausch von Funk bis Punk. Offen für Leute mit Instrumenten, Ideen und Lust auf einen Abend ohne starre Bühnenkante.',
    note: 'So ein Format taucht bereits im öffentlichen Facebook-Auftritt auf und soll hier später direkt mit Termin, Uhrzeit und Ort erscheinen.',
  },
  {
    label: 'Format 02',
    title: 'DIY-Konzertabend',
    text:
      'Gebuchte Bands, rohe Energie, kurzer Weg zwischen Publikum und Bühne. Kein Eventglanz, sondern ein Abend, der nah dran bleibt.',
    note: 'Wenn Termine fix sind, sollen sie hier kompakt mit Einlass, Running Order und Links landen.',
  },
  {
    label: 'Format 03',
    title: 'Szenetreff und Soli-Abend',
    text:
      'Nicht jeder Abend muss nur aus einem Line-up bestehen. Auch Support, Planung, Austausch und gemeinsames Tragen haben hier einen Platz.',
    note: 'Gut geeignet für Formate, bei denen Szene, Verein und Unterstützung ineinandergreifen.',
  },
  {
    label: 'Format 04',
    title: 'Ankündigungen ohne Scrollsuche',
    text:
      'Die neue Events-Seite ist dafür da, Termine sauber zu sammeln, statt sie in Storys, Postings und verstreuten Hinweisen verschwinden zu lassen.',
    note: 'Bis dahin bleiben Instagram und Facebook die schnellsten Kanäle für kurzfristige Updates.',
  },
];

export const facebookMirrors: FacebookMirror[] = [
  {
    label: 'Facebook-Post',
    title: 'Offene Jam-Session',
    date: '20. März 2026 · ab 17 Uhr',
    text:
      'Im öffentlich sichtbaren Facebook-Auftritt wurde am 14. März 2026 eine offene Jam-Session angekündigt. Der Ton ist niedrigschwellig, offen und nah an der Szene statt geschniegelt.',
    note:
      'Im dazu sichtbaren Hinweis taucht auch die Formulierung "lockerer musikalischer Austausch von Funk bis Punk" auf.',
    href: 'https://www.facebook.com/vaidaisnotdead/posts/pfbid029zZWrWrdUKfiLfhvnM2xVXuVLp8rX3rPNyhUdtTxW1KkaP68dMLeRShV5AD8uigYl',
    cta: 'Post ansehen',
    imageSrc: '/facebook-jam-session.jpg',
    imageAlt: 'Flyer für eine öffentliche Jam-Session von Vaida is not dead e.V.',
  },
  {
    label: 'Facebook-Seite',
    title: 'Kurzfristige Hinweise zuerst dort',
    date: 'Laufend',
    text:
      'Wenn neue Flyer, kleine Änderungen oder spontane Abende auftauchen, landen sie derzeit am schnellsten auf der Facebook-Seite. Diese Website spiegelt die wichtigsten öffentlichen Hinweise dann in einer lesbaren Form.',
    note:
      'So bleibt die Seite nutzbar, auch wenn Facebook-Plugins oder Browser-Einstellungen nicht mitspielen.',
    href: 'https://www.facebook.com/vaidaisnotdead/',
    cta: 'Seite öffnen',
    imageSrc: '/facebook-page-preview.jpg',
    imageAlt: 'Öffentlich sichtbare Vorschau der Facebook-Seite von Vaida is not dead e.V.',
  },
  {
    label: 'Fotos und Flyer',
    title: 'Mehr Material aus dem Auftritt',
    date: 'Archiv und Rückblicke',
    text:
      'Neben Terminhinweisen läuft auf Facebook auch Bildmaterial: Flyer, Detailansichten und kleine Eindrücke aus dem Umfeld des Vereins. Das ist im Moment die sichtbarste externe Spur für neue Motive.',
    note:
      'Bis es einen eigenen Event-Workflow gibt, ist diese Mischung aus Spiegelung und Direktlink die robustere Lösung.',
    href: 'https://www.facebook.com/vaidaisnotdead/photos',
    cta: 'Fotos ansehen',
    imageSrc: '/gallery-tile-01.jpg',
    imageAlt: 'Öffentlich sichtbarer Bildausschnitt aus dem Facebook-Auftritt von Vaida is not dead e.V.',
  },
];

export const galleryItems = [
  {
    src: '/facebook-jam-session.jpg',
    alt: 'Öffentlich sichtbarer Flyer für eine Jam-Session von Vaida is not dead e.V.',
    caption:
      'Handgemachter Flyer für ein offenes Session-Format. Der Ton geht eher in Richtung Szene-Aushang als in Richtung Werbebanner.',
  },
  {
    src: '/vaidaisnotdead-logo.png',
    alt: 'Logo von Vaida is not dead e.V.',
    caption:
      'Die aktuelle Wort-Bild-Marke bleibt der stärkste visuelle Anker und funktioniert auch alleine als Motiv.',
  },
  {
    src: '/facebook-page-preview.jpg',
    alt: 'Öffentlich sichtbare Vorschaubild-Kachel der Facebook-Seite',
    caption:
      'Kleiner öffentlicher Einblick in den Social-Auftritt. Auch hier wirkt alles eher rau, direkt und selbstgemacht.',
  },
  {
    src: '/gallery-tile-01.jpg',
    alt: 'Öffentlich sichtbarer Bildausschnitt aus dem Facebook-Auftritt von Vaida is not dead e.V.',
    caption:
      'Erstes Zusatzmotiv für die Gallery-Seite, um dem Auftritt einen einfacheren, aber echten Bilderrahmen zu geben.',
  },
  {
    src: '/gallery-tile-02.jpg',
    alt: 'Kleine öffentlich sichtbare Bildkachel aus dem Facebook-Auftritt',
    caption:
      'Kleine Vorschaukachel aus dem öffentlichen Material. Nicht Hochglanz, aber genau darin liegt der Reiz.',
  },
];

export const faqItems = [
  {
    question: 'Was soll hier für Veranstaltungen auftauchen?',
    answer:
      'Im Fokus stehen DIY-Konzertabende, offene Sessions und Formate, die Jugend- und Subkultur in Viechtach sichtbar machen. Die Seite soll diese Termine künftig gesammelt und klar lesbar zeigen.',
  },
  {
    question: 'Wo erfahre ich aktuelle Termine, solange die Seite weiter wächst?',
    answer:
      'Bis alle Inhalte final eingebunden sind, laufen kurzfristige Hinweise weiterhin am schnellsten über Instagram und Facebook. Die neue Events-Seite bereitet aber genau diesen Wechsel vor.',
  },
  {
    question: 'Kann ich mit einer Band oder einem Format anfragen?',
    answer:
      'Ja. Am besten kurz und direkt per Mail oder über Instagram schreiben: Wer seid ihr, was spielt ihr, und was für einen Rahmen sucht ihr?',
  },
  {
    question: 'Warum sieht die Seite so reduziert aus?',
    answer:
      'Weil sie näher an Flyern, Clubwänden und direkter Kommunikation bleiben soll als an einem glatten Event-Portal. Der Auftritt darf roh sein, solange er klar funktioniert.',
  },
  {
    question: 'Wie kann ich den Verein unterstützen?',
    answer:
      'Mitgliedschaft ist ein Weg. Dazu kommen Hilfe bei Aufbau, Awareness, Technik, Orga, Einlass oder einfach regelmäßiges Mittragen von Abenden und Strukturen.',
  },
];

export const membershipTracks: MembershipTrack[] = [
  {
    kind: 'foerder',
    label: 'Fördermitgliedschaft',
    title: 'Für Leute, die den Verein regelmäßig unterstützen wollen, ohne im Alltag jedes Mal aktiv eingebunden zu sein.',
    intro:
      'Diese Form passt, wenn du Konzerte, Sessions und laufende Vereinsarbeit mittragen willst, aber eher über kontinuierliche Unterstützung als über feste Aufgaben vor Ort.',
    details: [
      'hilft dabei, Miete, Technik, Material, Infrastruktur und laufende Kosten stabiler zu tragen',
      'passt, wenn du die Szene stärken willst, aber nicht regelmäßig bei Aufbau, Theke oder Orga eingebunden sein kannst',
      'bleibt nah dran am Verein, ohne dass daraus automatisch eine praktische Rolle bei jedem Abend wird',
    ],
    note:
      'Fördermitgliedschaft bedeutet: Rückhalt geben, damit Dinge überhaupt stattfinden können.',
    cta: 'Im Formular als Fördermitgliedschaft angeben',
    imageSrc: '/logo.png',
    imageAlt: 'Logo von vaida is not dead e.V. als visuelle Marke für die Fördermitgliedschaft',
    symbol: 'FM',
  },
  {
    kind: 'aktiv',
    label: 'Aktive Mitgliedschaft',
    title: 'Für Leute, die bei Abenden, Planung und Vereinsarbeit praktisch mitziehen wollen.',
    intro:
      'Hier geht es nicht nur um Unterstützung im Hintergrund, sondern um Mitarbeit in echten Situationen: Aufbau, Theke, Technik, Awareness, Booking oder laufende Orga.',
    details: [
      'nah dran an Planung, Umsetzung und den realen Abenden vor Ort',
      'passt, wenn du Zeit, Ideen, Skills oder regelmäßige Energie einbringen willst',
      'macht aus losem Umfeld eine belastbare DIY-Struktur im Bayerischen Wald',
    ],
    note:
      'Aktive Mitgliedschaft bedeutet: nicht nur kommen, sondern mitverantworten.',
    cta: 'Im Formular als aktive Mitgliedschaft angeben',
    imageSrc: '/gallery-tile-01.jpg',
    imageAlt: 'Raue Fotofläche aus dem Umfeld von vaida is not dead als Motiv für aktive Mitarbeit',
    symbol: 'AK',
  },
];
