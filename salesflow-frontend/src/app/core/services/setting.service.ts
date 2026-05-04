import { Injectable, inject } from '@angular/core';
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
}

@Injectable({ providedIn: 'root' })
export class SettingService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/settings`;

  getSettingsByType(type: string) {
    return this.http.get<ApiResponse<Setting[]>>(`${this.base}/${type}`);
  }

  getAllSettings() {
    return this.http.get<ApiResponse<Setting[]>>(this.base);
  }
}
