import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  heroTrash, heroExclamationTriangle, heroInformationCircle,
} from '@ng-icons/heroicons/outline';
import { ConfirmDialogService } from '@core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, NgIconComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ heroTrash, heroExclamationTriangle, heroInformationCircle })],
  template: `
    @if (dialog.state(); as s) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-[600] flex items-center justify-center p-4 animate-fade-in"
           dir="rtl">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"
             (click)="dialog.answer(false)">
        </div>

        <!-- Card -->
        <div class="relative z-10 w-full max-w-sm glass-card p-8 rounded-3xl
                    border border-sf-border shadow-2xl animate-fade-in text-right">

          <!-- Icon -->
          <div class="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
               [class.bg-sf-error/10]="s.options.type === 'danger' || !s.options.type"
               [class.text-sf-error]="s.options.type === 'danger' || !s.options.type"
               [class.bg-sf-warning/10]="s.options.type === 'warning'"
               [class.text-sf-warning]="s.options.type === 'warning'"
               [class.bg-sf-info/10]="s.options.type === 'info'"
               [class.text-sf-info]="s.options.type === 'info'">
            <ng-icon [name]="iconFor(s.options.type)" class="text-2xl"></ng-icon>
          </div>

          <!-- Title -->
          <h2 class="text-xl font-display font-bold text-sf-text text-center mb-2">
            {{ s.options.title }}
          </h2>

          <!-- Message -->
          @if (s.options.message) {
            <p class="text-sf-muted text-center text-sm leading-relaxed mb-8">
              {{ s.options.message }}
            </p>
          } @else {
            <div class="mb-8"></div>
          }

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-3">
            <button (click)="dialog.answer(false)"
                    class="btn btn-ghost py-3 rounded-2xl border border-sf-border
                           hover:bg-sf-elevated transition-all font-bold">
              {{ s.options.cancelLabel || ('common.cancel' | translate) }}
            </button>
            <button (click)="dialog.answer(true)"
                    class="btn py-3 rounded-2xl font-bold transition-all"
                    [class.btn-danger]="s.options.type === 'danger' || !s.options.type"
                    [class.btn-warning]="s.options.type === 'warning'"
                    [class.btn-info]="s.options.type === 'info'">
              {{ s.options.confirmLabel || ('common.confirm' | translate) }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  dialog = inject(ConfirmDialogService);

  iconFor(type?: string): string {
    if (type === 'info')    return 'heroInformationCircle';
    if (type === 'warning') return 'heroExclamationTriangle';
    return 'heroTrash';
  }
}
