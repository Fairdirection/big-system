import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ApiResponse } from '../models/api-response.model';

export interface CommissionProgress {
  employeeId: string;
  employeeName: string;
  code: string;
  seniorityLevel: string;
  quarterId: string;
  fullTarget: number;
  actualWorkingDays: number;
  adjustedTarget: number;
  achievedSalesRaw: number;
  achievedSalesValue: number;
  achievementPercentage: number;
  gap: number;
  companyRatePerMillion: number;
  minTierRatePerMillion: number;
  totalCommissionsPaidMonthly: number;
  totalCommissionsEarnedFinal: number;
  settlementDifference: number;
  sales: any[];
  payouts: any[];
  settlement: any;
}

@Injectable({ providedIn: 'root' })
export class CommissionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/commissions`;

  getSalespersonCommission(employeeId: string, quarterId: string) {
    return this.http.get<ApiResponse<CommissionProgress>>(`${this.base}/salesperson/${employeeId}`, {
      params: { quarterId }
    });
  }

  simulateCommission(params: {
    role: string;
    salesAmount: number;
    developerRate: number;
    saleSource?: string;
    quarterTotal?: number;
  }) {
    return this.http.post<ApiResponse<any>>(`${this.base}/simulate`, params);
  }

  getPayoutSchedule(params?: { startDate?: string; endDate?: string; status?: string }) {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/payouts/schedule`, { params });
  }

  updatePayoutStatus(payoutId: string, status: 'pending' | 'paid') {
    return this.http.patch<ApiResponse<any>>(`${this.base}/payouts/${payoutId}/status`, { status });
  }

  triggerQuarterlySettlement(quarter: number, year: number, employeeId?: string) {
    return this.http.post<ApiResponse<any>>(`${this.base}/settlement/${quarter}/${year}`, { employeeId });
  }
}
