import { Component, input, output, inject } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-hamburger-menu',
  template: `
    @if (isOpen()) {
      <div class="flyout-overlay" (click)="closed.emit()"></div>
      <div class="flyout flyout--open">
        <div class="flyout__header">
          <span class="flyout__title">Menu</span>
          <button class="flyout__close" (click)="closed.emit()">&times;</button>
        </div>
        <div class="flyout__body">
          <div class="flyout__section">
            <div class="flyout__section-label">Account</div>
            <div class="flyout__item">
              <span class="flyout__item-icon">&#128100;</span>
              <span class="flyout__item-label">Profile</span>
              <span class="flyout__item-value">Guest</span>
            </div>
            <div class="flyout__item">
              <span class="flyout__item-icon">&#9881;</span>
              <span class="flyout__item-label">Settings</span>
              <span class="flyout__item-value">&rsaquo;</span>
            </div>
          </div>
          <div class="flyout__section">
            <div class="flyout__section-label">League</div>
            <div class="flyout__item">
              <span class="flyout__item-icon">&#127944;</span>
              <span class="flyout__item-label">League</span>
              <select class="flyout__select">
                <option selected>NHL</option>
              </select>
            </div>
          </div>
          <div class="flyout__section">
            <div class="flyout__section-label">Appearance</div>
            <div class="flyout__item">
              <span class="flyout__item-icon">&#9790;</span>
              <span class="flyout__item-label">Dark Mode</span>
              <button class="toggle" [class.toggle--active]="themeService.isDark()" (click)="themeService.toggle()">
                <div class="toggle__knob"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .flyout-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 90;
    }
    .flyout {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100%;
      background: var(--bg-card);
      z-index: 100;
      box-shadow: -4px 0 24px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      font-family: var(--font-primary);
    }
    .flyout__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-default);
    }
    .flyout__title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
    .flyout__close {
      background: none;
      border: 1px solid var(--border-default);
      border-radius: 4px;
      width: 32px;
      height: 32px;
      font-size: 18px;
      cursor: pointer;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .flyout__body { padding: 24px; flex: 1; overflow-y: auto; }
    .flyout__section { margin-bottom: 28px; }
    .flyout__section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .flyout__item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-default);
    }
    .flyout__item:last-child { border-bottom: none; }
    .flyout__item-icon { margin-right: 12px; font-size: 16px; opacity: 0.7; width: 22px; text-align: center; }
    .flyout__item-label { flex: 1; }
    .flyout__item-value { font-size: 12px; color: var(--text-muted); }
    .flyout__select {
      font-family: var(--font-primary);
      font-size: 13px;
      padding: 6px 10px;
      border: 1px solid var(--border-strong);
      border-radius: 4px;
      background: var(--bg-page);
      color: var(--text-primary);
      cursor: pointer;
    }
    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background: var(--border-strong);
      cursor: pointer;
      border: none;
      flex-shrink: 0;
    }
    .toggle--active { background: var(--color-link); }
    .toggle__knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.2s;
    }
    .toggle--active .toggle__knob { transform: translateX(20px); }
  `]
})
export class HamburgerMenu {
  isOpen = input(false);
  closed = output();
  themeService = inject(ThemeService);
}
