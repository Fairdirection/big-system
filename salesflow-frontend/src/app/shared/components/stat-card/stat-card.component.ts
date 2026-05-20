import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateModule } from '@ngx-translate/core';
import { heroBanknotes, heroChartBar, heroShoppingBag, heroClock, heroCheckCircle, heroArrowTrendingUp } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CurrencyEgpPipe, NgIconComponent, TranslateModule],
  providers: [
    provideIcons({ 
      heroBanknotes, 
      heroChartBar, 
      heroShoppingBag, 
      heroClock,
      heroCheckCircle,
      heroArrowTrendingUp
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card p-5 border border-sf-border group hover:border-sf-primary/40
                transition-all duration-300 rounded-2xl flex flex-col overflow-hidden">

      <!-- Header row -->
      <div class="flex items-start justify-between mb-3">
        <span class="text-[10px] font-black text-sf-muted uppercase tracking-[0.1em] leading-tight">
          {{ title || label }}
        </span>
        <div [class]="iconClasses">
          @if (icon) {
            <ng-icon [name]="icon" class="text-base"></ng-icon>
          } @else {
            <ng-content select="[slot=icon]" />
          }
        </div>
      </div>

      <!-- Value + trend -->
      <div class="flex-1">
        <div class="flex items-baseline gap-2 flex-wrap">
          <h3 class="text-2xl font-display font-black text-sf-text tracking-tight animate-count-in">
            @if (isCurrency) {
              {{ value | currencyEgp }}
            } @else {
              {{ value }}
            }
          </h3>
          @if (trend) {
            <span class="text-xs font-bold" [class]="trendColor">{{ trend }}</span>
          }
        </div>
        @if (subtitle || description) {
          <p class="text-[10px] text-sf-muted mt-1 font-medium">{{ subtitle || description }}</p>
        }
      </div>

      <!-- Optional progress bar -->
      @if (progress !== null) {
        <div class="mt-4 space-y-1.5">
          <div class="flex justify-between text-[9px] font-black text-sf-muted uppercase tracking-wider">
            <span>{{ 'common.achievement' | translate }}</span>
            <span [class]="progressTextClass">{{ progress | number:'1.0-0' }}%</span>
          </div>
          <div class="h-1.5 bg-sf-elevated rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-1000 ease-out"
                 [class]="progressBarClass"
                 [style.width.%]="clampedProgress">
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [``]
})
export class StatCardComponent {
  @Input() title       = '';
  @Input() label       = '';
  @Input() value: any  = 0;
  @Input() isCurrency  = false;
  @Input() icon?: string;
  @Input() trend?: string;
  @Input() description = '';
  @Input() subtitle    = '';
  @Input() progress: number | null = null;
  @Input() color: 'purple' | 'cyan' | 'pink' | 'blue' | 'green' = 'purple';

  get clampedProgress(): number {
    return Math.min(100, Math.max(0, this.progress ?? 0));
  }

  get progressBarClass(): string {
    const p = this.clampedProgress;
    if (p >= 90) return 'bg-sf-success';
    if (p >= 60) return 'bg-sf-warning';
    return 'bg-sf-error';
  }

  get progressTextClass(): string {
    const p = this.clampedProgress;
    if (p >= 90) return 'text-sf-success';
    if (p >= 60) return 'text-sf-warning';
    return 'text-sf-error';
  }

  get iconClasses(): string {
    const base = 'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0';
    const variants: Record<string, string> = {
      purple: 'bg-sf-primary/10 text-sf-primary group-hover:bg-sf-primary/20 border border-sf-primary/20',
      cyan:   'bg-sf-info/10 text-sf-info group-hover:bg-sf-info/20 border border-sf-info/20',
      pink:   'bg-sf-secondary/10 text-sf-secondary group-hover:bg-sf-secondary/20 border border-sf-secondary/20',
      blue:   'bg-sf-primary/10 text-sf-primary group-hover:bg-sf-primary/20 border border-sf-primary/20',
      green:  'bg-sf-success/10 text-sf-success group-hover:bg-sf-success/20 border border-sf-success/20',
    };
    return `${base} ${variants[this.color] ?? variants['purple']}`;
  }

  get trendColor(): string {
    if (!this.trend) return '';
    return this.trend.startsWith('+') ? 'text-sf-success' : 'text-sf-error';
  }
}
