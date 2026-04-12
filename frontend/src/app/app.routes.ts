import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/main-page/main-page').then(m => m.MainPage) },
  { path: ':leagueId/scores', loadComponent: () => import('./components/scores/scores-page/scores-page').then(m => m.ScoresPage) },
  { path: ':leagueId/standings', loadComponent: () => import('./components/standings/standings-page/standings-page').then(m => m.StandingsPage) },
  { path: ':leagueId/stats', loadComponent: () => import('./components/stats/stats-page/stats-page').then(m => m.StatsPage) },
  { path: ':leagueId/players', loadComponent: () => import('./components/players/players-page/players-page').then(m => m.PlayersPage) },
  { path: ':leagueId/teams', loadComponent: () => import('./components/teams/teams-index/teams-index').then(m => m.TeamsIndex) },
  { path: ':leagueId/teams/:teamId', loadComponent: () => import('./components/teams/team-profile/team-profile').then(m => m.TeamProfilePage) },
  { path: ':leagueId/schedule', loadComponent: () => import('./components/schedule/schedule-page/schedule-page').then(m => m.SchedulePage) },
  { path: ':leagueId/salary-cap', loadComponent: () => import('./components/salary-cap/cap-overview/cap-overview').then(m => m.CapOverview) },
  { path: ':leagueId/trades', loadComponent: () => import('./components/trades/trades-list/trades-list').then(m => m.TradesList) },
  { path: ':leagueId/free-agents', loadComponent: () => import('./components/free-agents/free-agents-page/free-agents-page').then(m => m.FreeAgentsPage) },
  { path: ':leagueId/personnel', loadComponent: () => import('./components/personnel/personnel-page/personnel-page').then(m => m.PersonnelPage) },
  { path: ':leagueId/game-hub/:gameId', loadComponent: () => import('./components/game-hub/game-hub-page/game-hub-page').then(m => m.GameHubPage) },
  { path: ':leagueId/game/:gameId', redirectTo: ':leagueId/game-hub/:gameId' },
  { path: '**', redirectTo: '' }
];
