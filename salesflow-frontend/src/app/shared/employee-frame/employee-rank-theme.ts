export interface EmployeeRankTheme {
  tier: number;
  tierLabel: string;
  cssRgb: string;
  cssRgbDark: string;
  avatarRingWidth: string;
  showGlow: boolean;
  exclusive: boolean;
}

export const RANK_THEMES: Record<string, EmployeeRankTheme> = {
  Fresh: {
    tier: 1, tierLabel: 'I',
    cssRgb: '148 163 184', cssRgbDark: '100 116 139',
    avatarRingWidth: '0px',
    showGlow: false, exclusive: false,
  },
  BA: {
    tier: 2, tierLabel: 'II',
    cssRgb: '161 161 170', cssRgbDark: '180 180 185',
    avatarRingWidth: '2px',
    showGlow: false, exclusive: false,
  },
  BC: {
    tier: 3, tierLabel: 'III',
    cssRgb: '14 165 233', cssRgbDark: '56 189 248',
    avatarRingWidth: '2px',
    showGlow: false, exclusive: false,
  },
  Senior: {
    tier: 4, tierLabel: 'IV',
    cssRgb: '16 185 129', cssRgbDark: '52 211 153',
    avatarRingWidth: '2.5px',
    showGlow: false, exclusive: false,
  },
  SV: {
    tier: 5, tierLabel: 'V',
    cssRgb: '245 158 11', cssRgbDark: '251 191 36',
    avatarRingWidth: '2.5px',
    showGlow: true, exclusive: false,
  },
  TeamLeader: {
    tier: 6, tierLabel: 'VI',
    cssRgb: '139 92 246', cssRgbDark: '167 139 250',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  // ── Manager roles — all tier 7 / VII ──────────────────────────
  SalesManager: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '216 90 48', cssRgbDark: '240 153 123',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  ITEngineer: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '0 229 160', cssRgbDark: '0 229 160',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  OperationManager: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '127 119 221', cssRgbDark: '175 169 236',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  AccountsManager: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '29 158 117', cssRgbDark: '93 202 165',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  HRManager: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '168 85 247', cssRgbDark: '192 132 252',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  // ── Department-based entries (non-sales staff) ─────────────────
  IT: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '0 229 160', cssRgbDark: '0 229 160',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  Operations: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '127 119 221', cssRgbDark: '175 169 236',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  Finance: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '29 158 117', cssRgbDark: '93 202 165',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  HR: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '168 85 247', cssRgbDark: '192 132 252',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  TopManagement: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '216 90 48', cssRgbDark: '240 153 123',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
  Marketing: {
    tier: 7, tierLabel: 'VII',
    cssRgb: '236 72 153', cssRgbDark: '244 114 182',
    avatarRingWidth: '3px',
    showGlow: true, exclusive: true,
  },
};

export const DEFAULT_THEME: EmployeeRankTheme = RANK_THEMES['Fresh'];
