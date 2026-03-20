import { Component, input, output, computed } from '@angular/core';

export interface StatColumn {
  key: string;
  label: string;
  tooltip: string;
  align?: 'left' | 'center' | 'right';
}

export interface SortEvent {
  key: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-stat-table',
  template: `
    <div class="stat-table-wrap">
      <table class="stat-table">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [title]="col.tooltip"
                  [class.stat-table__sortable]="true"
                  [class.stat-table__sorted]="sortKey() === col.key"
                  [style.text-align]="col.align || 'right'"
                  (click)="onSort(col.key)">
                {{ col.label }}
                @if (sortKey() === col.key) {
                  <span class="stat-table__sort-arrow">{{ sortDir() === 'asc' ? '&#9650;' : '&#9660;' }}</span>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr [class.stat-table__row-alt]="$index % 2 === 1">
              @for (col of columns(); track col.key) {
                <td [style.text-align]="col.align || 'right'">{{ row[col.key] ?? '\u2014' }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .stat-table-wrap { overflow-x: auto; }
    .stat-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-primary);
      font-size: 13px;
      letter-spacing: -0.02em;
    }
    .stat-table th {
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      border-bottom: 2px solid var(--border-strong);
      cursor: pointer;
      white-space: nowrap;
      user-select: none;
    }
    .stat-table th:hover { color: var(--text-primary); }
    .stat-table__sorted { color: var(--text-primary) !important; }
    .stat-table__sort-arrow { font-size: 9px; margin-left: 4px; }
    .stat-table td {
      padding: 7px 10px;
      border-bottom: 1px solid var(--border-default);
      white-space: nowrap;
      color: var(--text-primary);
    }
    .stat-table__row-alt { background: var(--bg-row-alt); }
  `]
})
export class StatTable {
  columns = input<StatColumn[]>([]);
  rows = input<Record<string, any>[]>([]);
  sortKey = input('');
  sortDir = input<'asc' | 'desc'>('desc');
  sortChange = output<SortEvent>();

  onSort(key: string): void {
    const dir = this.sortKey() === key && this.sortDir() === 'desc' ? 'asc' : 'desc';
    this.sortChange.emit({ key, direction: dir });
  }
}
