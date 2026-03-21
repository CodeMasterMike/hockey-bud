import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  isDark = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('theme');
      const dark = saved ? saved === 'dark' : true;
      this.isDark.set(dark);
      this.apply(dark);
    }
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', next ? 'dark' : 'light');
      this.apply(next);
    }
  }

  private apply(dark: boolean): void {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
}
