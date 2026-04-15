import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Typewriter-style loading indicator: renders a label with animated dots
 * that progressively "type" in ("Loading" → "Loading." → "Loading..." →
 * "Loading..."). Uses CSS clip-path animation so the layout width is
 * stable (no jiggle as dots appear/disappear).
 */
@Component({
  selector: 'app-loading-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="loading-text" role="status" aria-live="polite">
      {{ label() }}<span class="dots" aria-hidden="true">...</span>
    </span>
  `,
  styles: [`
    .loading-text {
      color: var(--text-muted);
      font-family: var(--font-primary);
      font-size: inherit;
      letter-spacing: 0.02em;
      display: inline-block;
    }

    .dots {
      display: inline-block;
      animation: typewriter-dots 1.4s steps(4, end) infinite;
    }

    @keyframes typewriter-dots {
      0%         { clip-path: inset(0 100% 0 0); }
      25%        { clip-path: inset(0 66% 0 0); }
      50%        { clip-path: inset(0 33% 0 0); }
      75%, 100%  { clip-path: inset(0 0 0 0); }
    }
  `]
})
export class LoadingText {
  label = input('Loading');
}
