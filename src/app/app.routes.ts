import { Routes } from '@angular/router';

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
