import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  @Input() color: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'gray' = 'gray';
  @Input() variant: any; // Fallback for old code

  get badgeClasses(): string {
    const activeColor = this.color || this.variant || 'gray';
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border';
    
    const colors = {
      primary: 'bg-sf-primary/10 text-sf-primary border-sf-primary/20',
      info:    'bg-sf-info/10 text-sf-info border-sf-info/20',
      success: 'bg-sf-success/10 text-sf-success border-sf-success/20',
      warning: 'bg-sf-warning/10 text-sf-warning border-sf-warning/20',
      error:   'bg-sf-error/10 text-sf-error border-sf-error/20',
      gray:    'bg-sf-bg text-sf-muted border-sf-border',
    };

    // Mapping for old variants if any
    const legacyMap: any = {
      purple: colors.primary,
      cyan: colors.info,
      pink: colors.error,
      amber: colors.warning,
      emerald: colors.success,
      slate: colors.gray
    };

    return `${base} ${colors[activeColor as keyof typeof colors] || legacyMap[activeColor] || colors.gray}`;
  }
}
