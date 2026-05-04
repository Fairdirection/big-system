import { Component, Input, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputComponent),
    multi: true,
  }],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label) {
        <label class="text-xs font-medium text-sf-muted font-body">
          {{ label }}
          @if (required) { <span class="text-neon-pink ml-0.5">*</span> }
        </label>
      }

      <div class="relative">
        @if (prefixIcon) {
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-sf-muted pointer-events-none">
            <ng-content select="[slot=prefix]" />
          </div>
        }

        <input
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="isDisabled"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()"
          [class.pl-9]="prefixIcon"
          [class.border-neon-pink]="hasError"
          [class.border-neon-purple/50]="isFocused && !hasError"
          [class.shadow-inner-purple]="isFocused && !hasError"
          (focus)="isFocused = true"
          (blur)="isFocused = false"
          class="w-full h-9 px-3 rounded-xl text-sm font-body
                 bg-sf-elevated border border-sf-border
                 text-sf-text placeholder:text-sf-muted
                 outline-none transition-all duration-200
                 disabled:opacity-40 disabled:cursor-not-allowed" />
      </div>

      @if (hint && !hasError) {
        <p class="text-2xs text-sf-muted">{{ hint }}</p>
      }
      @if (hasError && errorMessage) {
        <p class="text-2xs text-neon-pink flex items-center gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ errorMessage }}
        </p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() required = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() prefixIcon = false;

  value = '';
  isDisabled = false;
  isFocused = false;

  onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: string) { this.value = v ?? ''; }
  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(d: boolean) { this.isDisabled = d; }

  onInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
    this.onChange(this.value);
  }
}
