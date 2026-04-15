import { Component, input, booleanAttribute, ChangeDetectionStrategy } from '@angular/core';

/**
 * Pulsing placeholder block for skeleton loading states. Compose into
 * page-specific skeletons to match content layout.
 *
 * Example: `<app-skeleton width="120px" height="16px" />` for a text row,
 * or `<app-skeleton width="32px" height="32px" circle />` for an avatar.
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="skeleton"
      [class.skeleton-circle]="circle()"
      [style.width]="width()"
      [style.height]="height()">
    </span>
  `,
  styles: [`
    .skeleton {
      display: inline-block;
      background: var(--bg-row-alt);
      border-radius: 2px;
      animation: skeleton-pulse 1.5s ease-in-out infinite;
      vertical-align: middle;
    }

    .skeleton.skeleton-circle {
      border-radius: 50%;
    }

    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.45; }
      50%      { opacity: 0.9; }
    }
  `]
})
export class Skeleton {
  width = input('100%');
  height = input('1em');
  circle = input(false, { transform: booleanAttribute });
}
