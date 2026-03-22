import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-video-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (videoUrl()) {
      <div class="modal-overlay" (click)="closed.emit()" (keydown.escape)="closed.emit()" tabindex="-1">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closed.emit()" aria-label="Close">&times;</button>
          <iframe [src]="videoUrl()!" allowfullscreen class="modal-video"></iframe>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: var(--bg-card);
      border-radius: 8px;
      padding: 16px;
      max-width: 900px;
      width: 90%;
      position: relative;
    }
    .modal-close {
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-primary);
    }
    .modal-video {
      width: 100%;
      aspect-ratio: 16/9;
      border: none;
      border-radius: 4px;
    }
  `]
})
export class VideoModal {
  videoUrl = input<string | null>(null);
  closed = output();
}
