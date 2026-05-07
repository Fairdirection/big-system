import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ApiResponse } from '../models/api-response.model';
import { Claim } from '../models/claim.model';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/claims`;
  
  createClaim(data: { saleId: string }) {
    return this.http.post<ApiResponse<Claim>>(this.base, data);
  }

  getClaims(params?: Record<string, string>) {
    return this.http.get<ApiResponse<Claim[]>>(this.base, { params });
  }

  getClaim(id: string) {
    return this.http.get<ApiResponse<Claim>>(`${this.base}/${id}`);
  }

  updateClaim(id: string, data: Partial<Claim>) {
    return this.http.patch<ApiResponse<Claim>>(`${this.base}/${id}`, data);
  }

  collectClaim(id: string, data: { collectionDate: Date, collectedAmount: number }) {
    return this.http.post<ApiResponse<Claim>>(`${this.base}/${id}/collect`, data);
  }

  syncClaims() {
    return this.http.post<ApiResponse<Claim[]>>(`${this.base}/sync`, {});
  }

  deleteClaim(id: string) {
    return this.http.delete<ApiResponse<Claim>>(`${this.base}/${id}`);
  }
}
