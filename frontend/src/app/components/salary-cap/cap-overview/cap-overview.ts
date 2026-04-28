import { Component } from '@angular/core';

@Component({
  selector: 'app-cap-overview',
  template: `
    <div class="coming-soon">
      <h2>Salary Cap</h2>
      <p>Salary cap data is not yet available. This feature requires contract and cap data that is not currently provided by the NHL API.</p>
    </div>
  `,
  styles: [`
    .coming-soon { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); font-family: var(--font-primary); }
    .coming-soon h2 { color: var(--text-primary); margin-bottom: 0.5rem; }
  `]
})
export class CapOverview {}
