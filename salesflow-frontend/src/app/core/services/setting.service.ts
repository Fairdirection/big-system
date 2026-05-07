import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ApiResponse } from '../models/api-response.model';

export interface Setting {
  _id: string;
  type: 'saleSource' | 'invoiceType' | 'collectionPercentage';
  value: string;
  label: string;
  isDefault: boolean;
  sortOrder: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/settings`;

  preferredLanguage = signal<string>(localStorage.getItem('sf_lang') || 'ar');
  preferredCurrency = signal<string>(localStorage.getItem('sf_currency') || 'EGP');
  preferredTimezone = signal<string>(localStorage.getItem('sf_timezone') || 'Africa/Cairo');
  preferredDateFormat = signal<string>(localStorage.getItem('sf_date_format') || 'YYYY-MM-DD');

  constructor() {
    // Apply preferences on boot
    const lang = this.preferredLanguage();
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  }

  updatePreferences(prefs: { language?: string; currency?: string; timezone?: string; dateFormat?: string }) {
    if (prefs.language) {
      localStorage.setItem('sf_lang', prefs.language);
      this.preferredLanguage.set(prefs.language);
      
      // Update DOM direction and lang attributes dynamically
      document.documentElement.dir = prefs.language === 'en' ? 'ltr' : 'rtl';
      document.documentElement.lang = prefs.language;
    }
    if (prefs.currency) {
      localStorage.setItem('sf_currency', prefs.currency);
      this.preferredCurrency.set(prefs.currency);
    }
    if (prefs.timezone) {
      localStorage.setItem('sf_timezone', prefs.timezone);
      this.preferredTimezone.set(prefs.timezone);
    }
    if (prefs.dateFormat) {
      localStorage.setItem('sf_date_format', prefs.dateFormat);
      this.preferredDateFormat.set(prefs.dateFormat);
    }
  }

  getSettingsByType(type: string) {
    return this.http.get<ApiResponse<Setting[]>>(`${this.base}/${type}`);
  }

  getAllSettings() {
    return this.http.get<ApiResponse<Setting[]>>(this.base);
  }

  createSetting(data: Partial<Setting>) {
    return this.http.post<ApiResponse<Setting>>(this.base, data);
  }

  updateSetting(id: string, data: Partial<Setting>) {
    return this.http.patch<ApiResponse<Setting>>(`${this.base}/${id}`, data);
  }

  deleteSetting(id: string) {
    return this.http.delete<ApiResponse<any>>(`${this.base}/${id}`);
  }
}
