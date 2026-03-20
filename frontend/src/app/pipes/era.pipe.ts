import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'era', standalone: true })
export class EraPipe implements PipeTransform {
  transform(yearEnd: number): 'original-six' | 'expansion' | 'salary-cap' {
    if (yearEnd <= 1972) return 'original-six';
    if (yearEnd <= 2005) return 'expansion';
    return 'salary-cap';
  }
}
