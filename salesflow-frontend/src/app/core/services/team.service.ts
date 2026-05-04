import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Team } from '../models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/teams`;

  getTeams(params?: Record<string, string>) {
    return this.http.get<ApiResponse<Team[]>>(this.base, { params });
  }

  getTeam(id: string) {
    return this.http.get<ApiResponse<Team>>(`${this.base}/${id}`);
  }

  createTeam(data: { teamLeaderId: string; memberIds: string[] }) {
    return this.http.post<ApiResponse<Team>>(this.base, data);
  }

  updateTeam(id: string, data: { teamLeaderId?: string; memberIds?: string[] }) {
    return this.http.patch<ApiResponse<Team>>(`${this.base}/${id}`, data);
  }

  deleteTeam(id: string) {
    return this.http.delete<ApiResponse<Team>>(`${this.base}/${id}`);
  }

  getTeamPerformance(teamId: string, quarterId: string) {
    return this.http.get<ApiResponse<any>>(`${this.base}/${teamId}/target-summary`, { params: { quarterId } });
  }
}
