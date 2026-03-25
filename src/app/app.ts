import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly title = 'vaidaisnotdead';

  readonly tickerItems = [
    'DIY KONZERTE',
    'SUBKULTUR',
    'SOLI',
    'NO MAINSTREAM',
    'COMMUNITY',
    'LAUT UND DIREKT',
  ];

  readonly quickNotes = [
    {
      label: 'Status',
      value: 'Neue Website in Arbeit',
    },
    {
      label: 'Format',
      value: 'DIY Konzerte und Subkultur',
    },
    {
      label: 'Kontakt',
      value: 'info@vaidaisnotdead.de',
    },
  ];

  readonly updates = [
    {
      kicker: 'Update 01',
      title: 'Der neue Auftritt wächst gerade.',
      text:
        'Die Website wird Stück für Stück erweitert. Bis alles final steht, bleibt sie bewusst direkt: klare Infos, schnelle Wege, kein unnötiger Ballast.',
      meta: 'Schneller Einstieg statt leere Baustelle.',
    },
    {
      kicker: 'Update 02',
      title: 'Konzerte landen hier, sobald sie fix sind.',
      text:
        'Wenn Datum, Line-up und Einlass stehen, sollen die nächsten Abende direkt auf der Startseite sichtbar sein, damit niemand lange suchen muss.',
      meta: 'Termine, Running Order und Hinweise folgen.',
    },
    {
      kicker: 'Update 03',
      title: 'Bands und Support dürfen sich melden.',
      text:
        'Wenn ihr in einen rohen, subkulturellen Rahmen passt oder bei Aufbau, Awareness und Orga mit anpacken wollt, schreibt uns.',
      meta: 'Mail ist offen, Socials auch.',
    },
  ];

  readonly principles = [
    {
      title: 'DIY statt Eventglanz',
      text:
        'Lieber echte Energie, kurze Wege und ein Abend mit Haltung als eine glattgebügelte Hochglanznummer.',
    },
    {
      title: 'Raum für schiefe, laute Sachen',
      text:
        'Punk, Noise, Hardcore, Weird Stuff oder alles dazwischen: wichtig ist, dass es lebt und nicht geschniegelt klingt.',
    },
    {
      title: 'Gemeinsam tragen',
      text:
        'Subkultur funktioniert nur mit Leuten, die mitschleppen, zuhören, respektvoll bleiben und Verantwortung teilen.',
    },
  ];

  readonly contactLinks = [
    {
      label: 'E-Mail',
      detail: 'info@vaidaisnotdead.de',
      href: 'mailto:info@vaidaisnotdead.de',
      external: false,
    },
    {
      label: 'Instagram',
      detail: '@vaidaisnotdead_ev',
      href: 'https://www.instagram.com/vaidaisnotdead_ev/',
      external: true,
    },
    {
      label: 'Facebook',
      detail: '/vaidaisnotdead',
      href: 'https://www.facebook.com/vaidaisnotdead/',
      external: true,
    },
  ];
}
