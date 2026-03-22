import { Injectable, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import {
  SIGNALR_HUB_URL,
  SIGNALR_RECONNECT_DELAYS,
  SIGNALR_INITIAL_RETRY_DELAY_MS,
  SIGNALR_EVENTS,
} from '../constants';

export interface ScoreUpdate {
  gameId: number;
  homeScore: number;
  awayScore: number;
  status: string;
}

export interface ClockSync {
  gameId: number;
  period: number;
  timeRemainingMs: number;
  clockRunning: boolean;
  serverTimestampMs: number;
}

export interface EventUpdate {
  gameId: number;
  eventType: string;
  playerId: number;
  description: string;
  isPending: boolean;
}

export interface TransactionUpdate {
  type: 'trade' | 'signing';
  description: string;
}

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);

  readonly scoreUpdate$ = new Subject<ScoreUpdate>();
  readonly clockSync$ = new Subject<ClockSync>();
  readonly eventUpdate$ = new Subject<EventUpdate>();
  readonly transactionUpdate$ = new Subject<TransactionUpdate>();

  private connection: import('@microsoft/signalr').HubConnection | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  private async connect(): Promise<void> {
    try {
      const signalR = await import('@microsoft/signalr');
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL)
        .withAutomaticReconnect(SIGNALR_RECONNECT_DELAYS)
        .build();

      this.connection.on(SIGNALR_EVENTS.SCORE_UPDATE, (data: ScoreUpdate) => this.scoreUpdate$.next(data));
      this.connection.on(SIGNALR_EVENTS.CLOCK_SYNC, (data: ClockSync) => this.clockSync$.next(data));
      this.connection.on(SIGNALR_EVENTS.EVENT_UPDATE, (data: EventUpdate) => this.eventUpdate$.next(data));
      this.connection.on(SIGNALR_EVENTS.TRANSACTION_UPDATE, (data: TransactionUpdate) => this.transactionUpdate$.next(data));

      await this.connection.start();
    } catch (err) {
      console.warn('SignalR connection failed, retrying in', SIGNALR_INITIAL_RETRY_DELAY_MS / 1000, 's:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => this.connect(), SIGNALR_INITIAL_RETRY_DELAY_MS);
  }

  async joinGameGroup(gameId: number): Promise<void> {
    await this.connection?.invoke('JoinGameGroup', gameId);
  }

  async leaveGameGroup(gameId: number): Promise<void> {
    await this.connection?.invoke('LeaveGameGroup', gameId);
  }

  async joinAllLiveGames(): Promise<void> {
    await this.connection?.invoke('JoinAllLiveGames');
  }

  ngOnDestroy(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.connection?.stop();
  }
}
