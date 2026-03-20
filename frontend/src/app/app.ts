import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Banner } from './components/layout/banner/banner';
import { ScoreBar } from './components/layout/score-bar/score-bar';
import { NavBar } from './components/layout/nav-bar/nav-bar';
import { HamburgerMenu } from './components/layout/hamburger-menu/hamburger-menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Banner, ScoreBar, NavBar, HamburgerMenu],
  template: `
    <app-banner (menuToggle)="menuOpen.set(!menuOpen())" />
    <app-score-bar />
    <app-nav-bar />
    <main>
      <router-outlet />
    </main>
    <app-hamburger-menu [isOpen]="menuOpen()" (closed)="menuOpen.set(false)" />
  `,
  styles: [`
    main {
      min-height: calc(100vh - 156px);
      background: var(--bg-page);
      color: var(--text-primary);
      font-family: var(--font-primary);
    }
  `]
})
export class App {
  menuOpen = signal(false);
}
