import { Injectable, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';

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

  private connection: any = null;
  private reconnectTimer: any = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  private async connect(): Promise<void> {
    try {
      const signalR = await import('@microsoft/signalr');
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/scores')
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();

      this.connection.on('ReceiveScoreUpdate', (data: ScoreUpdate) => this.scoreUpdate$.next(data));
      this.connection.on('ReceiveClockSync', (data: ClockSync) => this.clockSync$.next(data));
      this.connection.on('ReceiveEventUpdate', (data: EventUpdate) => this.eventUpdate$.next(data));
      this.connection.on('ReceiveTransactionUpdate', (data: TransactionUpdate) => this.transactionUpdate$.next(data));

      await this.connection.start();
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => this.connect(), 30000);
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
    clearTimeout(this.reconnectTimer);
    this.connection?.stop();
  }
}
