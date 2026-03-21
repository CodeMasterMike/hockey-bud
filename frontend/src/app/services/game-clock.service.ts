import { Injectable, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SignalRService, ClockSync } from './signalr.service';
import { Subject, Subscription } from 'rxjs';

export interface ClockState {
  gameId: number;
  period: number;
  timeRemainingMs: number;
  display: string;
  clockRunning: boolean;
}

@Injectable({ providedIn: 'root' })
export class GameClockService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private signalR = inject(SignalRService);

  private clocks = new Map<number, GameClock>();
  private clockUpdate$ = new Subject<ClockState>();
  private sub: Subscription;

  readonly updates$ = this.clockUpdate$.asObservable();

  constructor() {
    this.sub = this.signalR.clockSync$.subscribe(sync => this.handleSync(sync));
  }

  initClock(gameId: number, period: number, timeRemainingSeconds: number, clockRunning: boolean): void {
    this.removeClock(gameId);

    const clock: GameClock = {
      gameId,
      period,
      timeRemainingMs: timeRemainingSeconds * 1000,
      clockRunning,
      lastTickMs: performance.now(),
      rafId: 0
    };

    this.clocks.set(gameId, clock);

    if (clockRunning && isPlatformBrowser(this.platformId)) {
      this.startCountdown(clock);
    }

    this.emit(clock);
  }

  removeClock(gameId: number): void {
    const clock = this.clocks.get(gameId);
    if (clock) {
      if (clock.rafId) cancelAnimationFrame(clock.rafId);
      this.clocks.delete(gameId);
    }
  }

  getState(gameId: number): ClockState | null {
    const clock = this.clocks.get(gameId);
    if (!clock) return null;
    return {
      gameId: clock.gameId,
      period: clock.period,
      timeRemainingMs: clock.timeRemainingMs,
      display: formatMs(clock.timeRemainingMs),
      clockRunning: clock.clockRunning
    };
  }

  private handleSync(sync: ClockSync): void {
    const clock = this.clocks.get(sync.gameId);
    if (clock) {
      if (clock.rafId) cancelAnimationFrame(clock.rafId);
      clock.period = sync.period;
      clock.timeRemainingMs = sync.timeRemainingMs;
      clock.clockRunning = sync.clockRunning;
      clock.lastTickMs = performance.now();

      if (sync.clockRunning && isPlatformBrowser(this.platformId)) {
        this.startCountdown(clock);
      }

      this.emit(clock);
    } else {
      this.initClock(sync.gameId, sync.period, sync.timeRemainingMs / 1000, sync.clockRunning);
    }
  }

  private startCountdown(clock: GameClock): void {
    const tick = (now: number) => {
      const elapsed = now - clock.lastTickMs;
      clock.lastTickMs = now;
      clock.timeRemainingMs = Math.max(0, clock.timeRemainingMs - elapsed);

      this.emit(clock);

      if (clock.timeRemainingMs > 0 && clock.clockRunning) {
        clock.rafId = requestAnimationFrame(tick);
      }
    };

    clock.lastTickMs = performance.now();
    clock.rafId = requestAnimationFrame(tick);
  }

  private emit(clock: GameClock): void {
    this.clockUpdate$.next({
      gameId: clock.gameId,
      period: clock.period,
      timeRemainingMs: clock.timeRemainingMs,
      display: formatMs(clock.timeRemainingMs),
      clockRunning: clock.clockRunning
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    for (const clock of this.clocks.values()) {
      if (clock.rafId) cancelAnimationFrame(clock.rafId);
    }
    this.clocks.clear();
  }
}

interface GameClock {
  gameId: number;
  period: number;
  timeRemainingMs: number;
  clockRunning: boolean;
  lastTickMs: number;
  rafId: number;
}

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
