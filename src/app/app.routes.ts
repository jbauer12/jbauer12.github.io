import { Routes } from '@angular/router';

import { adminPortalPath } from './admin-portal';

export const routes: Routes = [
  {
    path: '',
    title: 'vaidaisnotdead | Start',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'events',
    title: 'vaidaisnotdead | Events',
    loadComponent: () => import('./pages/events/events').then((m) => m.EventsPage),
  },
  {
    path: adminPortalPath,
    title: 'vaidaisnotdead | Maschinenraum',
    loadComponent: () =>
      import('./pages/admin-events/admin-events').then((m) => m.AdminEventsPage),
  },
  {
    path: 'gallery',
    title: 'vaidaisnotdead | Galerie',
    loadComponent: () => import('./pages/gallery/gallery').then((m) => m.GalleryPage),
  },
  {
    path: 'faq',
    title: 'vaidaisnotdead | FAQ',
    loadComponent: () => import('./pages/faq/faq').then((m) => m.FaqPage),
  },
  {
    path: 'mitglied-werden',
    title: 'vaidaisnotdead | Mitglied werden',
    loadComponent: () => import('./pages/membership/membership').then((m) => m.MembershipPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
