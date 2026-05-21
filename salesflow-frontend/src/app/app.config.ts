import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import localeArEg from '@angular/common/locales/ar-EG';
import localeEn from '@angular/common/locales/en';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

registerLocaleData(localeArEg);
registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
  providers: [
    // Performance: use signals-based zone detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router with view transitions API and input binding
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),

    // HTTP client with functional interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),

    // i18n — runtime Arabic / English toggle
    provideTranslateService({
      defaultLanguage: (localStorage.getItem('sf_lang') as 'ar' | 'en') || 'ar'
    }),
    provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),

    // Async animations (improves initial bundle)
    provideAnimationsAsync(),
  ],
};
