import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);

  private _lang = signal<Lang>((localStorage.getItem('sf_lang') as Lang) || 'ar');

  currentLang   = this._lang.asReadonly();
  currentDir    = computed<'rtl' | 'ltr'>(() => this._lang() === 'ar' ? 'rtl' : 'ltr');
  currentLocale = computed<string>(() => this._lang() === 'ar' ? 'ar-EG' : 'en-US');
  isRtl         = computed(() => this._lang() === 'ar');

  constructor() {
    // Apply saved language on boot
    this.applyLanguage(this._lang());
  }

  setLanguage(lang: Lang) {
    if (lang === this._lang()) return;
    this._lang.set(lang);
    localStorage.setItem('sf_lang', lang);
    this.applyLanguage(lang);
  }

  toggle() {
    this.setLanguage(this._lang() === 'ar' ? 'en' : 'ar');
  }

  private applyLanguage(lang: Lang) {
    this.translate.use(lang);
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}
