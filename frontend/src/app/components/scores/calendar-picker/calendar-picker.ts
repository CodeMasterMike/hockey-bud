import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-calendar-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cal">
      <div class="cal__header">
        <button (click)="prevMonth()" aria-label="Previous month">&laquo;</button>
        <span class="cal__month">{{ monthLabel() }}</span>
        <button (click)="nextMonth()" aria-label="Next month">&raquo;</button>
      </div>
      <div class="cal__days-header">
        @for (day of dayLabels; track day) {
          <span class="cal__day-label">{{ day }}</span>
        }
      </div>
      <div class="cal__grid">
        @for (cell of calendarCells(); track $index) {
          @if (cell === 0) {
            <span class="cal__cell cal__cell--empty"></span>
          } @else {
            <button
              class="cal__cell"
              [class.cal__cell--selected]="isSelected(cell)"
              [class.cal__cell--today]="isToday(cell)"
              (click)="selectDay(cell)"
            >
              {{ cell }}
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .cal {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 100;
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      border-radius: 6px;
      padding: 12px;
      font-family: var(--font-primary);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 260px;
    }
    .cal__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .cal__header button {
      background: none; border: none; color: var(--text-primary);
      cursor: pointer; font-size: 16px; padding: 4px 8px;
    }
    .cal__month {
      font-weight: 700;
      font-size: 13px;
      color: var(--text-primary);
    }
    .cal__days-header {
      display: grid; grid-template-columns: repeat(7, 1fr);
      text-align: center; margin-bottom: 4px;
    }
    .cal__day-label {
      font-size: 10px; font-weight: 700; color: var(--text-muted);
    }
    .cal__grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    .cal__cell {
      text-align: center; padding: 6px 0; font-size: 12px;
      color: var(--text-primary); background: none; border: none;
      border-radius: 4px; cursor: pointer;
    }
    .cal__cell:hover { background: var(--bg-row-alt); }
    .cal__cell--empty { cursor: default; }
    .cal__cell--selected {
      background: var(--color-link); color: #fff;
    }
    .cal__cell--today {
      border: 1px solid var(--color-link);
    }
  `]
})
export class CalendarPicker {
  selectedDate = input<string | null>(null);
  dateSelected = output<string>();

  readonly dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  viewYear = signal(new Date().getFullYear());
  viewMonth = signal(new Date().getMonth());

  monthLabel = computed(() => {
    const date = new Date(this.viewYear(), this.viewMonth(), 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  calendarCells = computed(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: number[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(0);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  });

  isSelected(day: number): boolean {
    const sel = this.selectedDate();
    if (!sel) return false;
    const d = new Date(sel + 'T00:00:00');
    return d.getFullYear() === this.viewYear()
      && d.getMonth() === this.viewMonth()
      && d.getDate() === day;
  }

  isToday(day: number): boolean {
    const now = new Date();
    return now.getFullYear() === this.viewYear()
      && now.getMonth() === this.viewMonth()
      && now.getDate() === day;
  }

  selectDay(day: number): void {
    const y = this.viewYear();
    const m = this.viewMonth() + 1;
    const dateStr = `${y}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    this.dateSelected.emit(dateStr);
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.set(this.viewYear() - 1);
    } else {
      this.viewMonth.set(this.viewMonth() - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.set(this.viewYear() + 1);
    } else {
      this.viewMonth.set(this.viewMonth() + 1);
    }
  }
}
