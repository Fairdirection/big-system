import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyEgpPipe } from '@shared/pipes/currency-egp.pipe';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroBanknotes, heroChartBar, heroShoppingBag, heroClock, heroCheckCircle, heroArrowTrendingUp } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CurrencyEgpPipe, NgIconComponent],
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
    <div class="glass-card p-6 border border-sf-border group hover:border-sf-primary/40 transition-all duration-500 rounded-2xl shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs font-black text-sf-muted uppercase tracking-widest">{{ title || label }}</span>
        <div [class]="iconClasses">
          @if (icon) {
            <ng-icon [name]="icon" class="text-lg"></ng-icon>
          } @else {
            <ng-content select="[slot=icon]" />
          }
        </div>
      </div>

      <div class="flex items-baseline gap-2">
        <h3 class="text-2xl font-display font-black text-sf-text tracking-tight">
          @if (isCurrency) {
            {{ value | currencyEgp }}
          } @else {
            {{ value }}
          }
        </h3>
        @if (trend) {
          <span class="text-xs font-bold" [class]="trendColor">
            {{ trend }}
          </span>
        }
      </div>

      @if (description) {
        <p class="text-[10px] text-sf-muted mt-2 font-medium italic">{{ description }}</p>
      }
    </div>
  `,
  styles: [``]
})
export class StatCardComponent {
  @Input() title = '';
  @Input() label = '';
  @Input() value: any = 0;
  @Input() isCurrency = false;
  @Input() icon?: string;
  @Input() trend?: string;
  @Input() description = '';
  @Input() color: 'purple' | 'cyan' | 'pink' | 'blue' = 'purple';

  get iconClasses(): string {
    const base = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner';
    const variants = {
      purple: 'bg-sf-primary/10 text-sf-primary group-hover:bg-sf-primary/20 border border-sf-primary/20',
      cyan:   'bg-sf-info/10 text-sf-info group-hover:bg-sf-info/20 border border-sf-info/20',
      pink:   'bg-sf-secondary/10 text-sf-secondary group-hover:bg-sf-secondary/20 border border-sf-secondary/20',
      blue:   'bg-sf-primary/10 text-sf-primary group-hover:bg-sf-primary/20 border border-sf-primary/20',
    };
    return `${base} ${variants[this.color]}`;
  }

  get trendColor(): string {
    if (!this.trend) return '';
    return this.trend.startsWith('+') ? 'text-sf-success' : 'text-sf-error';
  }
}
