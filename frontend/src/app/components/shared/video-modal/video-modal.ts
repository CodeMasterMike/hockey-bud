import { Component, inject, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (safeUrl()) {
      <div class="modal-overlay" role="button" tabindex="0" (click)="closed.emit()" (keydown.enter)="closed.emit()">
        <div class="modal-content" role="dialog" (click)="$event.stopPropagation()" (keydown.escape)="closed.emit()">
          <button class="modal-close" (click)="closed.emit()" aria-label="Close">&times;</button>
          <iframe [src]="safeUrl()!" allowfullscreen class="modal-video"></iframe>
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
  private sanitizer = inject(DomSanitizer);

  videoUrl = input<string | null>(null);
  closed = output();

  safeUrl = computed((): SafeResourceUrl | null => {
    const url = this.videoUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });
}
