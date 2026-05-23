import { Injectable, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';
import { RANK_THEMES, DEFAULT_THEME, EmployeeRankTheme } from './employee-rank-theme';

@Injectable({ providedIn: 'root' })
export class EmployeeFrameService {
  private theme = inject(ThemeService);

  /** Resolve the theme — try seniorityLevel first, then department as fallback */
  getTheme(seniorityLevel: string | undefined, department?: string): EmployeeRankTheme {
    return RANK_THEMES[seniorityLevel ?? '']
        ?? RANK_THEMES[department ?? '']
        ?? DEFAULT_THEME;
  }

  /** Maps to avatar frame level 1–7 using seniorityLevel then department */
  getFrameLevel(seniorityLevel: string | undefined, department?: string): 1|2|3|4|5|6|7 {
    const seniorityMap: Record<string, 1|2|3|4|5|6|7> = {
      Fresh: 1, BA: 2, BC: 3, Senior: 4, SV: 5, TeamLeader: 6, SalesManager: 7,
    };
    if (seniorityLevel && seniorityMap[seniorityLevel] !== undefined) {
      return seniorityMap[seniorityLevel];
    }
    // Non-sales staff → level 7 based on department
    const deptLevel7 = ['IT', 'Operations', 'Finance', 'HR', 'TopManagement', 'Marketing'];
    if (department && deptLevel7.includes(department)) return 7;
    // DEBUG: log when falling through to default
    console.log('[FrameService] getFrameLevel fallthrough — seniorityLevel:', JSON.stringify(seniorityLevel), '| department:', JSON.stringify(department), '| type:', typeof department);
    return 1;
  }

  /** Returns the manager frame variant for level-7 roles */
  getFrameVariant(seniorityLevel: string | undefined, department?: string, jobTitle?: string): string {
    // SalesManager seniorityLevel
    if (seniorityLevel === 'SalesManager') return 'sales';
    // Department-based
    const deptMap: Record<string, string> = {
      IT:            'it',
      Operations:    'ops',
      Finance:       'accounts',
      HR:            'hr',
      TopManagement: 'sales',   // top management uses sales frame
      Marketing:     'sales',   // marketing uses sales frame
    };
    if (department && deptMap[department]) return deptMap[department];
    // Fallback: detect from jobTitle
    const t = (jobTitle || '').toLowerCase();
    if (t.includes('it') || t.includes('tech'))            return 'it';
    if (t.includes('sales') && t.includes('manager'))      return 'sales';
    if (t.includes('operation') || t.includes('ops'))      return 'ops';
    if (t.includes('account') || t.includes('finance'))    return 'accounts';
    if (t.includes('hr') || t.includes('human resource'))  return 'hr';
    return '';
  }

  getCardStyles(seniorityLevel: string | undefined, department?: string): Record<string, string> {
    const t = this.getTheme(seniorityLevel, department);
    const rgb = this.theme.isDark() ? t.cssRgbDark : t.cssRgb;
    return { '--emp-r': rgb, '--emp-ring-w': t.avatarRingWidth };
  }
}
