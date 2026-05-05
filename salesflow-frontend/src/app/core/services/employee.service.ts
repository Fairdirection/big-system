import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Employee } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/employees`;

  // Cache active sales employees for commission form selectors
  private _salesEmployees$: Observable<ApiResponse<Employee[]>> | null = null;

  getSalesEmployees(): Observable<ApiResponse<Employee[]>> {
    if (!this._salesEmployees$) {
      this._salesEmployees$ = this.http
        .get<ApiResponse<Employee[]>>(`${this.base}?department=Sales&isActive=true`)
        .pipe(shareReplay(1));
    }
    return this._salesEmployees$;
  }

  invalidateCache() {
    this._salesEmployees$ = null;
  }

  getEmployees(params?: Record<string, string>) {
    return this.http.get<PaginatedResponse<Employee>>(this.base, { params });
  }

  getEmployee(id: string) {
    return this.http.get<ApiResponse<Employee>>(`${this.base}/${id}`);
  }

  createEmployee(data: Partial<Employee>) {
    return this.http.post<ApiResponse<Employee>>(this.base, data);
  }

  updateEmployee(id: string, data: Partial<Employee>) {
    return this.http.patch<ApiResponse<Employee>>(`${this.base}/${id}`, data);
  }

  deleteEmployee(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  getTargetProgress(id: string, quarterId: string) {
    return this.http.get<ApiResponse<any>>(`${this.base}/${id}/target-progress`, { params: { quarterId } });
  }

  getTeamHistory(id: string) {
    return this.http.get<ApiResponse<any>>(`${this.base}/${id}/history`);
  }

  updateHistory(historyId: string, data: any) {
    return this.http.patch<ApiResponse<any>>(`${this.base}/history/${historyId}`, data);
  }

  deleteHistory(historyId: string) {
    return this.http.delete<ApiResponse<any>>(`${this.base}/history/${historyId}`);
  }

  addHistory(employeeId: string, data: any) {
    return this.http.post<ApiResponse<any>>(`${this.base}/${employeeId}/history`, data);
  }
}
