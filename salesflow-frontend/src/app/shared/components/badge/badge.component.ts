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
    const base = 'badge';
    
    const colors = {
      primary: 'badge-info', // Re-mapping to info for better harmony in badges
      info:    'badge-info',
      success: 'badge-success',
      warning: 'badge-warning',
      error:   'badge-error',
      gray:    'bg-sf-bg text-sf-muted border-sf-border',
    };

    return `${base} ${colors[activeColor as keyof typeof colors] || colors.gray}`;
  }
}
