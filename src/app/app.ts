import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { EditableTextComponent } from './shared/editable-text/editable-text';
import { navItems, socialLinks } from './site-data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, EditableTextComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly navItems = navItems;
  readonly socialLinks = socialLinks;
  readonly contactEmail = 'info@vaidaisnotdead.de';
  readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
