import { Component, ElementRef, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-score-bar',
  imports: [RouterLink],
  template: `
    <div class="ticker">
      <button class="ticker__arrow" (click)="scroll(-1)" aria-label="Scroll left">&#9664;</button>
      <div class="ticker__track" #track>
        <a routerLink="/nhl/game/1" class="ticker__game">
          <span class="ticker__team">BOS</span>
          <span class="ticker__score">3</span>
          <span class="ticker__dash">&ndash;</span>
          <span class="ticker__score">2</span>
          <span class="ticker__team">TOR</span>
          <span class="ticker__status">Final</span>
        </a>
        <a routerLink="/nhl/game/2" class="ticker__game">
          <span class="ticker__team">NYR</span>
          <span class="ticker__score">1</span>
          <span class="ticker__dash">&ndash;</span>
          <span class="ticker__score">1</span>
          <span class="ticker__team">MTL</span>
          <span class="ticker__status"><span class="ticker__live-dot"></span>2nd 14:32</span>
        </a>
        <a routerLink="/nhl/game/3" class="ticker__game">
          <span class="ticker__team">DET</span>
          <span class="ticker__dash">vs</span>
          <span class="ticker__team">CHI</span>
          <span class="ticker__status">7:00 PM</span>
        </a>
      </div>
      <button class="ticker__arrow" (click)="scroll(1)" aria-label="Scroll right">&#9654;</button>
    </div>
  `,
  styles: [`
    .ticker {
      background: var(--bg-ticker);
      color: var(--text-ticker);
      height: 56px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      font-family: var(--font-primary);
    }
    .ticker__arrow {
      background: none;
      border: none;
      color: var(--text-ticker);
      font-size: 18px;
      cursor: pointer;
      width: 36px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      opacity: 0.5;
    }
    .ticker__arrow:hover { opacity: 1; background: rgba(255,255,255,0.08); }
    .ticker__track {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      flex: 1;
      padding: 0 4px;
      scroll-behavior: smooth;
    }
    .ticker__game {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      height: 40px;
      flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 4px;
      background: rgba(255,255,255,0.04);
      text-decoration: none;
      color: var(--text-ticker);
    }
    .ticker__game:hover { background: rgba(255,255,255,0.1); }
    .ticker__score, .ticker__team, .ticker__status { color: #fff; }
    .ticker__dash { color: rgba(245,240,225,0.4); }
    .ticker__status--close-game { color: var(--color-live) !important; }
    .ticker__live-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-live);
      margin-right: 5px;
      animation: live-pulse 1.4s ease-in-out infinite;
    }
    @keyframes live-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `]
})
export class ScoreBar {
  private track = viewChild<ElementRef<HTMLDivElement>>('track');

  scroll(direction: number): void {
    const el = this.track()?.nativeElement;
    if (!el) return;
    const box = el.querySelector('.ticker__game') as HTMLElement;
    if (!box) return;
    el.scrollBy({ left: direction * (box.offsetWidth + 8) * 2, behavior: 'smooth' });
  }
}
