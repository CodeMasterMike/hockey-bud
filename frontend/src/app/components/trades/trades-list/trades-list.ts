import {
  Component, inject, signal, OnInit,
  ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradesApiService, TradeItem } from '../../../services/trades-api.service';
import { DEFAULT_LEAGUE_ID } from '../../../constants';

@Component({
  selector: 'app-trades-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="trades-page">
      <h1 class="page-title">{{ data()?.season ?? '...' }} NHL Trades</h1>
      <p class="page-subtitle">
        @if (data()) { {{ data()!.trades.length }} trades this season } @else { &nbsp; }
      </p>

      @if (errorMessage()) {
        <div class="state-msg state-error">{{ errorMessage() }}</div>
      } @else if (loading()) {
        <div class="state-msg">Loading trades...</div>
      } @else if (trades().length === 0) {
        <div class="state-msg">No trades found.</div>
      } @else {
        @for (trade of trades(); track trade.id) {
          <div class="trade-card">
            <div class="trade-date">{{ trade.tradeDateDisplay }}</div>
            <div class="trade-sides">
              @for (side of trade.sides; track side.teamId) {
                <div class="trade-side">
                  <div class="side-header">
                    @if (side.teamLogoUrl) {
                      <img [src]="side.teamLogoUrl" [alt]="side.teamAbbreviation" class="side-logo" />
                    }
                    <span class="side-team">{{ side.teamAbbreviation }}</span>
                  </div>
                  @if (side.acquired.length > 0) {
                    <div class="asset-group">
                      <span class="asset-label">Acquired:</span>
                      @for (a of side.acquired; track $index) {
                        <div class="asset">{{ assetDisplay(a) }}</div>
                      }
                    </div>
                  }
                  @if (side.traded.length > 0) {
                    <div class="asset-group">
                      <span class="asset-label">Traded:</span>
                      @for (a of side.traded; track $index) {
                        <div class="asset">{{ assetDisplay(a) }}</div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
            @if (trade.description) {
              <div class="trade-desc">{{ trade.description }}</div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .trades-page { max-width: 900px; margin: 0 auto; padding: 28px 20px 48px; font-family: var(--font-primary); }
    .page-title { font-size: 1.2rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 0.78rem; color: var(--text-muted); margin: 0 0 24px; }

    .trade-card { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; padding: 16px; margin-bottom: 12px; }
    .trade-date { font: 700 0.76rem var(--font-primary); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; }

    .trade-sides { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .side-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .side-logo { width: 28px; height: 28px; object-fit: contain; }
    .side-team { font: 700 0.88rem var(--font-primary); color: var(--text-primary); }

    .asset-group { margin-bottom: 6px; }
    .asset-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    .asset { font-size: 0.78rem; color: var(--text-secondary); padding: 2px 0; }

    .trade-desc { font-size: 0.74rem; color: var(--text-muted); margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-default); line-height: 1.5; }

    .state-msg { color: var(--text-muted); text-align: center; padding: 48px 0; font-size: 14px; }
    .state-error { color: #c44; }

    @media (max-width: 600px) { .trade-sides { grid-template-columns: 1fr; } }
  `]
})
export class TradesList implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(TradesApiService);
  private destroyRef = inject(DestroyRef);

  leagueId = signal(DEFAULT_LEAGUE_ID);
  data = signal<{ season: string; trades: TradeItem[] } | null>(null);
  trades = signal<TradeItem[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.leagueId.set(params.get('leagueId') ?? DEFAULT_LEAGUE_ID);
      this.loadTrades();
    });
  }

  private loadTrades(): void {
    this.loading.set(true);
    this.api.getTrades(this.leagueId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.data.set(res);
        this.trades.set(res.trades);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.errorMessage.set('Unable to load trades.'); }
    });
  }

  assetDisplay(a: { assetType: string; playerName: string | null; description: string | null }): string {
    if (a.assetType === 'Player' && a.playerName) return a.playerName;
    if (a.description) return a.description;
    return a.assetType;
  }
}
