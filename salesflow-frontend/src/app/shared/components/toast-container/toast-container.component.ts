import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '@core/services/toast.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { heroCheckCircle, heroExclamationCircle, heroExclamationTriangle, heroInformationCircle, heroXMark } from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({ heroCheckCircle, heroExclamationCircle, heroExclamationTriangle, heroInformationCircle, heroXMark })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of toasts(); track toast.id) {
        <div class="glass-card flex items-start gap-4 p-4 rounded-2xl border pointer-events-auto shadow-2xl relative overflow-hidden transition-all duration-300 animate-slide-in"
             [class.border-sf-success/30]="toast.type === 'success'"
             [class.bg-sf-success/5]="toast.type === 'success'"
             [class.shadow-glow-profit/10]="toast.type === 'success'"
             [class.border-sf-error/30]="toast.type === 'error'"
             [class.bg-sf-error/5]="toast.type === 'error'"
             [class.border-sf-warning/30]="toast.type === 'warning'"
             [class.bg-sf-warning/5]="toast.type === 'warning'"
             [class.border-sf-info/30]="toast.type === 'info'"
             [class.bg-sf-info/5]="toast.type === 'info'">
          
          <!-- Animated countdown bar -->
          <div class="absolute bottom-0 right-0 h-1 bg-sf-primary/40 rounded-full animate-progress-bar"
               [style.animation-duration.ms]="toast.duration"
               [class.bg-sf-success/40]="toast.type === 'success'"
               [class.bg-sf-error/40]="toast.type === 'error'"
               [class.bg-sf-warning/40]="toast.type === 'warning'"
               [class.bg-sf-info/40]="toast.type === 'info'"></div>

          <!-- Toast Icon -->
          <div class="p-1 rounded-xl shrink-0"
               [class.text-sf-success]="toast.type === 'success'"
               [class.text-sf-error]="toast.type === 'error'"
               [class.text-sf-warning]="toast.type === 'warning'"
               [class.text-sf-info]="toast.type === 'info'">
            @switch (toast.type) {
              @case ('success') { <ng-icon name="heroCheckCircle" class="text-xl"></ng-icon> }
              @case ('error') { <ng-icon name="heroExclamationCircle" class="text-xl"></ng-icon> }
              @case ('warning') { <ng-icon name="heroExclamationTriangle" class="text-xl"></ng-icon> }
              @default { <ng-icon name="heroInformationCircle" class="text-xl"></ng-icon> }
            }
          </div>

          <!-- Toast Message & Actions -->
          <div class="flex-1 space-y-2 text-right">
            <p class="text-sm font-bold text-sf-text leading-relaxed">{{ toast.message }}</p>
            
            @if (toast.action; as action) {
              <div class="flex justify-end pt-1">
                <button type="button" (click)="onAction(toast, action)" 
                        class="px-4 py-1.5 bg-sf-primary text-white rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-glow-purple">
                  {{ action.label }}
                </button>
              </div>
            }
          </div>

          <!-- Dismiss Button -->
          <button type="button" (click)="dismiss(toast.id)" 
                  class="p-1 text-sf-muted hover:text-sf-text rounded-lg hover:bg-sf-surface/50 transition-colors shrink-0">
            <ng-icon name="heroXMark" class="text-sm"></ng-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(1.5rem) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes progress-bar {
      from { width: 100%; }
      to { width: 0%; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-progress-bar {
      animation-name: progress-bar;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }
  `]
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts = this.toastService.toasts;

  dismiss(id: string) {
    this.toastService.remove(id);
  }

  onAction(toast: Toast, action: any) {
    action.callback();
    this.toastService.remove(toast.id);
  }
}
