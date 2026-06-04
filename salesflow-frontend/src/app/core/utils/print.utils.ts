const PRINT_FONT = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">`;

const PRINT_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cairo',sans-serif;color:#1a1a2e;background:#fff;direction:rtl;font-size:15px;line-height:1.6}
.page{max-width:820px;margin:0 auto}
.banner{background:#6337ff;color:#fff;padding:14px 36px;display:flex;align-items:center;justify-content:space-between;page-break-after:avoid;break-after:avoid}
.banner-company{font-size:1.15rem;font-weight:900;letter-spacing:.02em}
.banner-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.banner-quarter{font-size:.82rem;font-weight:700;background:rgba(255,255,255,.18);padding:3px 12px;border-radius:9999px}
.banner-date{font-size:.72rem;opacity:.75}
.title-block{padding:22px 36px 18px;border-bottom:2px solid #6337ff;page-break-inside:avoid;break-inside:avoid;page-break-after:avoid;break-after:avoid}
.title-label{font-size:.68rem;font-weight:900;text-transform:uppercase;letter-spacing:.14em;color:#94a3b8;margin-bottom:10px}
.title-main{font-size:1.9rem;font-weight:900;color:#1a1a2e;line-height:1.15}
.title-sub{font-size:.95rem;font-weight:600;color:#64748b;margin-top:6px}
.title-meta{display:flex;align-items:center;gap:14px;margin-top:8px;flex-wrap:wrap}
.pill{display:inline-block;padding:3px 12px;border-radius:9999px;font-size:.72rem;font-weight:900}
.pill-green{background:rgba(34,197,94,.12);color:#16a34a;border:1px solid rgba(34,197,94,.25)}
.pill-red{background:rgba(239,68,68,.1);color:#dc2626;border:1px solid rgba(239,68,68,.2)}
.pill-yellow{background:rgba(245,158,11,.12);color:#d97706;border:1px solid rgba(245,158,11,.2)}
.pill-blue{background:rgba(59,130,246,.1);color:#2563eb;border:1px solid rgba(59,130,246,.2)}
.pill-gray{background:rgba(100,116,139,.1);color:#64748b;border:1px solid rgba(100,116,139,.2)}
.pill-purple{background:rgba(99,55,255,.1);color:#6337ff;border:1px solid rgba(99,55,255,.2)}
.body{padding:24px 36px 36px}
.section{margin-bottom:28px;page-break-inside:avoid;break-inside:avoid}
.section-title{font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.14em;color:#6337ff;margin-bottom:12px;page-break-after:avoid;break-after:avoid}
.data-table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0}
.data-table td{padding:10px 16px;border:1px solid #e2e8f0;font-size:.92rem;vertical-align:top}
.data-table td.lbl{font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;background:#f8fafc;width:140px;white-space:nowrap}
.data-table td.lbl.danger{color:#dc2626;background:#fff5f5}
.data-table td.val{font-weight:700;color:#1a1a2e}
.data-table td.val.danger{color:#dc2626}
.data-table td.val.accent{color:#6337ff;font-weight:900}
.stats-row{display:grid;border:1px solid #e2e8f0}
.stats-row.cols-2{grid-template-columns:repeat(2,1fr)}
.stats-row.cols-3{grid-template-columns:repeat(3,1fr)}
.stats-row.cols-4{grid-template-columns:repeat(4,1fr)}
.stat-cell{padding:14px 12px;text-align:center;border-left:1px solid #e2e8f0}
.stat-cell:last-child{border-left:none}
.stat-lbl{font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:6px}
.stat-val{font-size:1.05rem;font-weight:900;color:#6337ff}
.list-table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;font-size:.88rem}
.list-table th{background:#f8fafc;padding:10px 14px;text-align:right;font-weight:900;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #e2e8f0;border-left:1px solid #e2e8f0}
.list-table th:last-child{border-left:none}
.list-table td{padding:10px 14px;border-bottom:1px solid #f1f5f9;border-left:1px solid #f1f5f9;color:#1a1a2e;vertical-align:middle}
.list-table td:last-child{border-left:none}
.list-table tr:last-child td{border-bottom:none}
.footer{margin-top:32px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:.75rem;color:#94a3b8}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
`;

export function openPrintWindow(bodyContent: string, title: string): void {
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  ${PRINT_FONT}
  <style>${PRINT_CSS}</style>
</head>
<body><div class="page">${bodyContent}</div></body>
</html>`;

  const win = window.open('', '_blank', 'width=920,height=720');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 650);
}

export function printBanner(quarter: string): string {
  const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<div class="banner">
    <span class="banner-company">FairDirection &mdash; SalesFlow</span>
    <div class="banner-right">
      <span class="banner-quarter">${quarter}</span>
      <span class="banner-date">تاريخ الطباعة: ${date}</span>
    </div>
  </div>`;
}

export function printFooter(): string {
  return `<div class="footer"><span>SalesFlow &mdash; FairDirection</span><span>تم الإنشاء تلقائياً</span></div>`;
}

export function printFmt(n: number): string {
  return new Intl.NumberFormat('ar-EG').format(n) + ' ج.م';
}

export function statusPill(status: string): string {
  const map: Record<string, [string, string]> = {
    confirmed:  ['مؤكد',          'pill-green'],
    collected:  ['مُحصَّل',        'pill-green'],
    claimed:    ['قيد المطالبة',   'pill-yellow'],
    draft:      ['مسودة',          'pill-gray'],
    active:     ['نشط',            'pill-green'],
    inactive:   ['غير نشط',        'pill-red'],
    pending:    ['معلق',           'pill-yellow'],
    submitted:  ['مقدَّمة',        'pill-blue'],
    disputed:   ['متنازع عليه',    'pill-red'],
    paid:       ['تم الصرف',       'pill-green'],
  };
  const [label, cls] = map[status] ?? [status, 'pill-gray'];
  return `<span class="pill ${cls}">${label}</span>`;
}
