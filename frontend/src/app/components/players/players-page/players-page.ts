import { Component } from '@angular/core';

@Component({
  selector: 'app-players-page',
  template: `
    <div class="coming-soon">
      <h2>Player Profiles</h2>
      <p>Player profiles are not yet available. Use the search bar to find players by name, or visit a team's roster page to see player details.</p>
    </div>
  `,
  styles: [`
    .coming-soon { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); font-family: var(--font-primary); }
    .coming-soon h2 { color: var(--text-primary); margin-bottom: 0.5rem; }
  `]
})
export class PlayersPage {}
