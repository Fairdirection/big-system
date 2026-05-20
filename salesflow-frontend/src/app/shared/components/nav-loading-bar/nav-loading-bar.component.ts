import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnDestroy,
} from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nav-loading-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="fixed top-0 left-0 right-0 z-[300] h-[2px] pointer-events-none overflow-hidden"
           dir="ltr">
        <div class="h-full rounded-full transition-[width] ease-out"
             [style.width.%]="progress()"
             [style.transition-duration]="state() === 'completing' ? '150ms' : '300ms'"
             [style.opacity]="state() === 'fading' ? '0' : '1'"
             style="background: linear-gradient(to right,
               rgb(var(--sf-primary)),
               rgb(var(--sf-secondary)),
               rgb(var(--sf-primary)));
               transition-property: width, opacity;">
        </div>
      </div>
    }
  `,
})
export class NavLoadingBarComponent implements OnDestroy {
  private router = inject(Router);

  state    = signal<'idle' | 'loading' | 'completing' | 'fading'>('idle');
  progress = signal(0);
  visible  = computed(() => this.state() !== 'idle');

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sub: Subscription;

  constructor() {
    this.sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.startLoading();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.finishLoading();
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.clearInterval();
  }

  private startLoading() {
    this.clearInterval();
    this.progress.set(0);
    this.state.set('loading');

    // Creep toward 85% with diminishing increments
    this.intervalId = setInterval(() => {
      this.progress.update(p => {
        if (p >= 85) return p;
        return p + Math.max(1, (85 - p) * 0.12);
      });
    }, 180);
  }

  private finishLoading() {
    this.clearInterval();
    this.state.set('completing');
    this.progress.set(100);

    setTimeout(() => {
      this.state.set('fading');
      setTimeout(() => this.state.set('idle'), 350);
    }, 150);
  }

  private clearInterval() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
