import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/sales`;

  getSales(params?: any) {
    return this.http.get<PaginatedResponse<Sale>>(this.base, { params });
  }

  getSalesByQuarter(quarterId: string, employeeId?: string) {
    const params: any = { quarterId };
    if (employeeId) params.employeeId = employeeId;
    return this.http.get<PaginatedResponse<Sale>>(this.base, { params });
  }

  getSale(id: string) {
    return this.http.get<ApiResponse<Sale>>(`${this.base}/${id}`);
  }

  createSale(data: Partial<Sale>) {
    return this.http.post<ApiResponse<Sale>>(this.base, data);
  }

  updateSale(id: string, data: Partial<Sale>) {
    return this.http.patch<ApiResponse<Sale>>(`${this.base}/${id}`, data);
  }

  confirmSale(id: string) {
    return this.http.post<ApiResponse<Sale>>(`${this.base}/${id}/confirm`, {});
  }

  deleteSale(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
