import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="clicked.emit($event)"
      [class]="buttonClasses">
      @if (loading) {
        <svg class="animate-spin w-4 h-4 flex-shrink-0"
             fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2 font-medium font-body rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none';
    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-7',
      md: 'text-sm px-4 py-2 h-9',
      lg: 'text-sm px-6 py-2.5 h-11',
    };
    const variants = {
      primary:   'bg-gradient-purple text-white shadow-glow-purple hover:shadow-glow-purple hover:brightness-110 active:scale-95',
      secondary: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 hover:shadow-glow-cyan active:scale-95',
      danger:    'bg-neon-pink/10 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/20 hover:shadow-glow-pink active:scale-95',
      ghost:     'text-sf-muted hover:text-sf-text hover:bg-sf-elevated active:scale-95',
      outline:   'border border-sf-border text-sf-text hover:border-neon-purple/40 hover:bg-sf-elevated active:scale-95',
    };
    return `${base} ${sizes[this.size]} ${variants[this.variant]}`;
  }
}
