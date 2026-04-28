import { Component } from '@angular/core';

@Component({
  selector: 'app-personnel-page',
  template: `
    <div class="coming-soon">
      <h2>Personnel</h2>
      <p>Team personnel data is not yet available. This feature requires coaching and management data that is not currently provided by the NHL API.</p>
    </div>
  `,
  styles: [`
    .coming-soon { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); font-family: var(--font-primary); }
    .coming-soon h2 { color: var(--text-primary); margin-bottom: 0.5rem; }
  `]
})
export class PersonnelPage {}
