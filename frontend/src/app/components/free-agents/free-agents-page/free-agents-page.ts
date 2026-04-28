import { Component } from '@angular/core';

@Component({
  selector: 'app-free-agents-page',
  template: `
    <div class="coming-soon">
      <h2>Free Agents</h2>
      <p>Free agent data is not yet available. This feature requires contract data that is not currently provided by the NHL API.</p>
    </div>
  `,
  styles: [`
    .coming-soon { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); font-family: var(--font-primary); }
    .coming-soon h2 { color: var(--text-primary); margin-bottom: 0.5rem; }
  `]
})
export class FreeAgentsPage {}
