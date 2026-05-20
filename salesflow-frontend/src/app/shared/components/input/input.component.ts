import { Component, Input, forwardRef, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
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
    <div class="flex flex-col gap-2">
      @if (label) {
        <label class="text-sm font-bold text-sf-text font-body block text-right">
          {{ label }}
          @if (required) { <span class="text-sf-error mr-0.5">*</span> }
        </label>
      }

      <div class="relative">
        @if (prefixIcon) {
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-sf-muted pointer-events-none">
            <ng-content select="[slot=prefix]" />
          </div>
        }

        <input
          [type]="isAccounting ? 'text' : type"
          [placeholder]="placeholder"
          [disabled]="isDisabled"
          [value]="value"
          [attr.step]="type === 'number' ? 'any' : null"
          (input)="onInput($event)"
          [class.pl-9]="prefixIcon"
          [class.border-sf-error]="hasError"
          [class.border-neon-purple/50]="isFocused && !hasError"
          [class.shadow-inner-purple]="isFocused && !hasError"
          [class.font-mono]="isAccounting || type === 'number'"
          [class.text-lg]="isAccounting || type === 'number'"
          [class.font-bold]="isAccounting || type === 'number'"
          [class.tracking-wide]="isAccounting || type === 'number'"
          (focus)="isFocused = true"
          (blur)="onBlur()"
          class="w-full h-11 px-4 rounded-xl text-base font-bold font-body
                 bg-sf-surface border-2 border-sf-border/90 hover:border-sf-muted/50
                 text-sf-text placeholder:text-sf-muted/60
                 outline-none transition-all duration-200
                 disabled:opacity-40 disabled:cursor-not-allowed text-right" />
      </div>

      @if (hint && !hasError) {
        <p class="text-xs text-sf-muted/80 text-right">{{ hint }}</p>
      }
      @if (hasError && errorMessage) {
        <p class="text-xs text-sf-error flex items-center gap-1 justify-end">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          {{ errorMessage }}
        </p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  private cdr = inject(ChangeDetectorRef);

  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() required = false;
  @Input() hasError = false;
  @Input() errorMessage = '';
  @Input() prefixIcon = false;
  @Input() isAccounting = false;

  value = '';
  isDisabled = false;
  isFocused = false;

  onChange: (v: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(v: any) {
    if (v == null || v === '') {
      this.value = '';
    } else if (this.isAccounting) {
      const clean = v.toString().replace(/[^\d.]/g, '');
      const parts = clean.split('.');
      let formatted = '';
      if (parts[0]) {
        formatted = parseInt(parts[0], 10).toLocaleString('en-US');
      }
      if (clean.includes('.')) {
        formatted += '.' + (parts[1] !== undefined ? parts[1] : '');
      }
      this.value = formatted;
    } else {
      this.value = v.toString();
    }
    this.cdr.detectChanges();
  }

  registerOnChange(fn: (v: any) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }

  setDisabledState(d: boolean) {
    this.isDisabled = d;
    this.cdr.detectChanges();
  }

  onInput(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    if (this.isAccounting) {
      const originalLength = inputEl.value.length;
      const originalCursor = inputEl.selectionStart || 0;

      let rawDigits = inputEl.value.replace(/[^\d.]/g, '');
      const dots = rawDigits.split('.');
      if (dots.length > 2) {
        rawDigits = dots[0] + '.' + dots.slice(1).join('');
      }

      if (rawDigits === '') {
        this.value = '';
        this.onChange(null);
        return;
      }

      const parts = rawDigits.split('.');
      let integerPart = parts[0];
      let decimalPart = parts[1];
      let formatted = '';
      if (integerPart) {
        formatted = parseInt(integerPart, 10).toLocaleString('en-US');
      }
      if (rawDigits.includes('.')) {
        formatted += '.' + (decimalPart !== undefined ? decimalPart : '');
      }

      inputEl.value = formatted;
      this.value = formatted;

      const parsedValue = parseFloat(rawDigits);
      this.onChange(isNaN(parsedValue) ? null : parsedValue);

      const newLength = formatted.length;
      const lengthDiff = newLength - originalLength;
      const newCursor = originalCursor + lengthDiff;
      inputEl.setSelectionRange(newCursor, newCursor);
    } else {
      this.value = inputEl.value;
      this.onChange(this.value);
    }
  }

  onBlur() {
    this.isFocused = false;
    this.onTouched();
  }
}
