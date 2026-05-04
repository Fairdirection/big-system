import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Performance: use signals-based zone detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router with view transitions API and input binding
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding()
    ),

    // HTTP client with functional interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),

    // Async animations (improves initial bundle)
    provideAnimationsAsync(),
  ],
};
