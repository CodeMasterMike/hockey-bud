import { Directive, ElementRef, HostListener, input, inject, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  appTooltip = input.required<string>();

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tooltipEl: HTMLElement | null = null;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.appTooltip()) return;
    this.tooltipEl = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipEl, 'app-tooltip');
    const text = this.renderer.createText(this.appTooltip());
    this.renderer.appendChild(this.tooltipEl, text);
    this.renderer.appendChild(document.body, this.tooltipEl);
    this.positionTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.removeTooltip();
  }

  private positionTooltip(): void {
    if (!this.tooltipEl) return;
    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const top = hostRect.top - 8;
    const left = hostRect.left + hostRect.width / 2;
    this.renderer.setStyle(this.tooltipEl, 'position', 'fixed');
    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipEl, 'transform', 'translate(-50%, -100%)');
    this.renderer.setStyle(this.tooltipEl, 'z-index', '10000');
    this.renderer.setStyle(this.tooltipEl, 'background', 'var(--bg-banner)');
    this.renderer.setStyle(this.tooltipEl, 'color', 'var(--text-on-banner)');
    this.renderer.setStyle(this.tooltipEl, 'padding', '4px 8px');
    this.renderer.setStyle(this.tooltipEl, 'border-radius', '4px');
    this.renderer.setStyle(this.tooltipEl, 'font-size', '11px');
    this.renderer.setStyle(this.tooltipEl, 'font-family', 'var(--font-primary)');
    this.renderer.setStyle(this.tooltipEl, 'white-space', 'nowrap');
    this.renderer.setStyle(this.tooltipEl, 'pointer-events', 'none');
  }

  private removeTooltip(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
  }

  ngOnDestroy(): void {
    this.removeTooltip();
  }
}
