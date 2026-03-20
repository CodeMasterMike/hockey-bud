import { Pipe, PipeTransform, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Pipe({ name: 'timezone', standalone: true })
export class TimezonePipe implements PipeTransform {
  private platformId = inject(PLATFORM_ID);

  transform(value: string | null, format: 'time' | 'date' | 'datetime' = 'time'): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    if (!isPlatformBrowser(this.platformId)) {
      return value;
    }

    switch (format) {
      case 'time':
        return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      case 'date':
        return date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
      case 'datetime':
        return date.toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit' });
    }
  }
}
