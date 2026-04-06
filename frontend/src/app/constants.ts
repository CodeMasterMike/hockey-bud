import { environment } from '../environments/environment';

/** Base URL for API requests (empty for local dev proxy, full URL for deployed). */
export const API_BASE_URL = environment.apiBaseUrl;

/** Default league ID used across the application. */
export const DEFAULT_LEAGUE_ID = 'nhl';

/** Polling interval for score ticker fallback (ms). */
export const TICKER_POLL_INTERVAL_MS = 30_000;

/** SignalR reconnection retry delays (ms). */
export const SIGNALR_RECONNECT_DELAYS = [0, 2000, 5000, 10000, 30000];

/** Delay before retrying a failed initial SignalR connection (ms). */
export const SIGNALR_INITIAL_RETRY_DELAY_MS = 30_000;

/** SignalR hub endpoint URL. */
export const SIGNALR_HUB_URL = `${API_BASE_URL}/hubs/scores`;

/** SignalR event names — must match the server-side hub method names. */
export const SIGNALR_EVENTS = {
  SCORE_UPDATE: 'ReceiveScoreUpdate',
  CLOCK_SYNC: 'ReceiveClockSync',
  EVENT_UPDATE: 'ReceiveEventUpdate',
  TRANSACTION_UPDATE: 'ReceiveTransactionUpdate',
} as const;

/**
 * "Close game" detection thresholds. A game is considered close when
 * it's in the 3rd period or later with 5 minutes or less remaining.
 */
export const CLOSE_GAME_PERIOD_THRESHOLD = 3;
export const CLOSE_GAME_TIME_THRESHOLD_MS = 5 * 60 * 1000;

/** LocalStorage key for theme preference. */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Converts an NHL period number to its display label (1st, 2nd, 3rd, OT, 2OT, etc.).
 * Shared utility to avoid duplicating this logic across components.
 */
export function getPeriodLabel(period: number): string {
  if (period <= 3) return period === 1 ? '1st' : period === 2 ? '2nd' : '3rd';
  if (period === 4) return 'OT';
  return `${period - 3}OT`;
}
