import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagination">
      <button class="pagination__btn" [disabled]="currentPage() <= 1" (click)="pageChange.emit(currentPage() - 1)">&laquo; Prev</button>
      <span class="pagination__info">Page {{ currentPage() }} of {{ totalPages() }}</span>
      <button class="pagination__btn" [disabled]="currentPage() >= totalPages()" (click)="pageChange.emit(currentPage() + 1)">Next &raquo;</button>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 16px 0;
      font-family: var(--font-primary);
      font-size: 13px;
    }
    .pagination__btn {
      padding: 6px 14px;
      border: 1px solid var(--border-strong);
      border-radius: 4px;
      background: var(--bg-card);
      color: var(--text-primary);
      font-family: var(--font-primary);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .pagination__btn:disabled { opacity: 0.4; cursor: default; }
    .pagination__btn:not(:disabled):hover { background: var(--bg-row-alt); }
    .pagination__info { color: var(--text-muted); }
  `]
})
export class Pagination {
  currentPage = input(1);
  totalPages = input(1);
  pageChange = output<number>();
}
