import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const COOKIE_NOTICE_STORAGE_KEY = 'vaida-cookie-notice-v1';

@Component({
  selector: 'app-cookie-banner',
  imports: [RouterLink],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
})
export class CookieBannerComponent {
  readonly isVisible = signal(shouldShowCookieBanner());

  dismiss(): void {
    try {
      localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, 'accepted');
    } catch {
      // Ignore storage errors and simply hide the banner for the current visit.
    }

    this.isVisible.set(false);
  }
}

function shouldShowCookieBanner(): boolean {
  try {
    return localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) !== 'accepted';
  } catch {
    return true;
  }
}
