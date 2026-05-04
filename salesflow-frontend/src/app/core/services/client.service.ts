import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Client } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clients`;

  getClients(params?: Record<string, string>) {
    return this.http.get<PaginatedResponse<Client>>(this.base, { params });
  }

  getClient(id: string) {
    return this.http.get<ApiResponse<Client>>(`${this.base}/${id}`);
  }

  createClient(data: Partial<Client>) {
    return this.http.post<ApiResponse<Client>>(this.base, data);
  }

  updateClient(id: string, data: Partial<Client>) {
    return this.http.patch<ApiResponse<Client>>(`${this.base}/${id}`, data);
  }

  deleteClient(id: string) {
    return this.http.delete<ApiResponse<Client>>(`${this.base}/${id}`);
  }
}
