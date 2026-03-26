import { contactEmail } from './legal.data';

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

export type FaqItem = {
  question: string;
  answer: string;
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
    href: `mailto:${contactEmail}`,
    external: false,
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

export const faqItems: FaqItem[] = [
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
