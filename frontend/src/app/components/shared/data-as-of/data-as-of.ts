import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-data-as-of',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (timestamp()) {
      <span class="data-as-of" [attr.title]="fullTimestamp()">
        Data updated {{ relativeTime() }}
      </span>
    }
  `,
  styles: [`
    .data-as-of {
      font-size: 0.68rem;
      color: var(--text-muted);
      letter-spacing: 0.02em;
      cursor: help;
    }
  `]
})
export class DataAsOf {
  timestamp = input<string | null>(null);

  relativeTime(): string {
    const iso = this.timestamp();
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = Date.now();
      const diffMs = now - d.getTime();
      if (diffMs < 0) return 'just now';
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  }

  fullTimestamp(): string {
    const iso = this.timestamp();
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
}
