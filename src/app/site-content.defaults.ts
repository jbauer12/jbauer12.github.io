import { galleryItems, membershipTracks, navItems, socialLinks } from './site-data';

export type SiteContentDefault = {
  key: string;
  value: string;
};

export const siteContentDefaults: SiteContentDefault[] = [
  { key: 'app.brand.title', value: 'Vaida is not dead e.V.' },
  { key: 'app.brand.meta', value: 'Viechtach · Bayerischer Wald' },
  { key: 'app.footer.title', value: 'Vaida is not dead e.V.' },
  {
    key: 'app.footer.text',
    value: 'Jugend- und Subkultur in Viechtach. Direkt, reduziert und auf echte Abende ausgerichtet.',
  },
  ...navItems.map((item, index) => ({
    key: `app.nav.${index}.label`,
    value: item.label,
  })),
  ...socialLinks.map((link, index) => ({
    key: `app.social.${index}.label`,
    value: link.label,
  })),
  { key: 'home.hero.title', value: 'Vaida is not dead e.V.' },
  {
    key: 'home.hero.lead',
    value:
      'DIY-Konzerte, offene Sessions und Abende zwischen Techno, Punk und allem, was dazwischen lebt.',
  },
  {
    key: 'home.hero.body',
    value:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  { key: 'home.hero.events_cta', value: 'Events ansehen' },
  { key: 'home.hero.membership_cta', value: 'Mitglied werden' },
  { key: 'home.current.kicker', value: 'Aktuelles' },
  {
    key: 'home.current.title',
    value: 'Bands und Solo-Acts für das Bürgerfest Viechtach 2026 gesucht.',
  },
  {
    key: 'home.current.body',
    value:
      'Für das Bürgerfest in Viechtach vom 3. bis 5. Juli 2026 suchen wir Bands, Künstler und Künstlerinnen aus verschiedenen musikalischen Richtungen.',
  },
  {
    key: 'home.current.info',
    value:
      'Ob laut, tanzbar, experimentell oder ganz entspannt: willkommen sind Acts mit eigenem Stil und Lust auf ein offenes Stadtfest-Wochenende.',
  },
  {
    key: 'home.current.bullet.0',
    value: 'Gesucht werden Bands, Solo-Künstler und Künstlerinnen für Live-Auftritte.',
  },
  {
    key: 'home.current.bullet.1',
    value: 'Möglich sind unterschiedliche Genres von Indie, Rock und Punk bis Funk, Pop und Akustik.',
  },
  {
    key: 'home.current.bullet.2',
    value: 'Der Zeitraum ist Freitag, 3. Juli 2026 bis Sonntag, 5. Juli 2026 in Viechtach.',
  },
  { key: 'events.hero.kicker', value: 'Events' },
  { key: 'events.hero.title', value: 'Events' },
  {
    key: 'events.hero.lead',
    value:
      'Wir machen Events rund um Punk, Techno und alternative Musik. Von rohen Live-Shows bis zu langen Clubnächten bringen wir laute, unabhängige Sounds und Szenen zusammen.',
  },
  { key: 'events.upcoming.kicker', value: 'Kommende Events' },
  { key: 'events.upcoming.title', value: 'Alles, was als Nächstes ansteht.' },
  {
    key: 'events.upcoming.empty_before',
    value: 'Aktuell stehen keine Events an. Schau gerne auf unserer ',
  },
  {
    key: 'events.upcoming.empty_link',
    value: ' Facebook-Seite ',
  },
  {
    key: 'events.upcoming.empty_after',
    value: ' vorbei, um dich über neue Termine zu informieren.',
  },
  { key: 'events.past.kicker', value: 'Vergangene Events' },
  { key: 'events.past.title', value: 'Was bereits gelaufen ist.' },
  {
    key: 'events.past.empty',
    value: 'Aktuell stehen keine vergangenen Events im Archiv.',
  },
  { key: 'gallery.hero.kicker', value: 'Galerie' },
  {
    key: 'gallery.hero.title',
    value: 'Fotos und Eindrücke von vergangenen Veranstaltungen.',
  },
  {
    key: 'gallery.hero.lead',
    value:
      'Hier sammeln wir Fotos, Artwork und Eindrücke vergangener Abende und halten fest, was bei den Veranstaltungen visuell und atmosphärisch in Erinnerung bleibt.',
  },
  ...galleryItems.map((item, index) => ({
    key: `gallery.items.${index}.caption`,
    value: item.caption,
  })),
  { key: 'faq.hero.kicker', value: 'FAQ' },
  { key: 'faq.hero.title', value: 'Häufig gestellte Fragen' },
  { key: 'membership.hero.kicker', value: 'Mitglied werden' },
  { key: 'membership.hero.title', value: 'Fördern oder aktiv mittragen.' },
  {
    key: 'membership.hero.lead',
    value:
      'Bei vaida is not dead gibt es nicht nur einen Weg rein. Du kannst die Struktur finanziell stärken oder selbst aktiv Teil davon werden.',
  },
  { key: 'membership.hero.pill.0', value: 'Fördermitgliedschaft' },
  { key: 'membership.hero.pill.1', value: 'Aktive Mitgliedschaft' },
  { key: 'membership.hero.pill.2', value: 'DIY-Struktur in Viechtach' },
  { key: 'membership.hero.form_cta', value: 'Zum Formular' },
  { key: 'membership.hero.mail_cta', value: 'Direkt mailen' },
  { key: 'membership.types.kicker', value: 'Mitgliedschaftsarten' },
  { key: 'membership.types.title', value: 'Im Grunde gibt es zwei Formen.' },
  {
    key: 'membership.types.body',
    value:
      'Nicht jede Person will auf dieselbe Weise beteiligt sein. Deshalb ist hier nur kurz aufgeschrieben, was mit Fördermitgliedschaft und aktiver Mitgliedschaft jeweils gemeint ist.',
  },
  ...membershipTracks.flatMap((track, index) => [
    {
      key: `membership.tracks.${index}.label`,
      value: track.label,
    },
    {
      key: `membership.tracks.${index}.title`,
      value: track.title,
    },
    {
      key: `membership.tracks.${index}.intro`,
      value: track.intro,
    },
    ...track.details.map((detail, detailIndex) => ({
      key: `membership.tracks.${index}.details.${detailIndex}`,
      value: detail,
    })),
    {
      key: `membership.tracks.${index}.note`,
      value: track.note,
    },
    {
      key: `membership.tracks.${index}.cta`,
      value: track.cta,
    },
  ]),
  { key: 'membership.form.kicker', value: 'Kontaktformular' },
  { key: 'membership.form.title', value: 'Wenn du magst, schreib uns einfach.' },
  {
    key: 'membership.form.body',
    value:
      'Das Formular öffnet nur dein Mailprogramm und setzt die wichtigsten Angaben schon in Betreff und Nachricht an info@vaidaisnotdead.de. Eine kurze Mail mit ein paar Zeilen reicht völlig.',
  },
  { key: 'membership.form.field.type', value: 'Mitgliedschaftsart' },
  { key: 'membership.form.field.name', value: 'Name' },
  { key: 'membership.form.field.email', value: 'E-Mail' },
  { key: 'membership.form.field.phone', value: 'Telefon / Signal / Insta' },
  { key: 'membership.form.field.focus', value: 'Wie willst du beitragen?' },
  { key: 'membership.form.field.message', value: 'Nachricht' },
  { key: 'membership.form.submit', value: 'Anfrage per Mail vorbereiten' },
  { key: 'membership.form.mail_cta', value: 'Ohne Formular schreiben' },
];
