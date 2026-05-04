import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse } from '../models/api-response.model';

export interface DashboardStats {
  totalRevenue: number;
  totalVolume: number;
  totalSales: number;
  confirmedSales: number;
  pendingClaims: number;
  collectedClaims: number;
  targetCompletion: number;
  totalClients: number;
  teamPerformance: Array<{
    teamName: string;
    revenue: number;
    salesCount: number;
  }>;
  recentSales: any[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dashboard`;

  getStats(quarterId?: string): Observable<ApiResponse<DashboardStats>> {
    let params: any = {};
    if (quarterId) params['quarterId'] = quarterId;
    return this.http.get<ApiResponse<DashboardStats>>(`${this.base}/stats`, { params });
  }
}
