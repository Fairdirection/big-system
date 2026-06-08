var o='<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">',i=`
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
`;function l(e,r){let a=`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${r}</title>
  ${o}
  <style>${i}</style>
</head>
<body><div class="page">${e}</div></body>
</html>`,t=window.open("","_blank","width=920,height=720");t&&(t.document.write(a),t.document.close(),t.focus(),setTimeout(()=>{t.print(),t.close()},650))}function n(e){let r=new Date().toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"});return`<div class="banner">
    <span class="banner-company">FairDirection &mdash; SalesFlow</span>
    <div class="banner-right">
      <span class="banner-quarter">${e}</span>
      <span class="banner-date">\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0637\u0628\u0627\u0639\u0629: ${r}</span>
    </div>
  </div>`}function d(){return'<div class="footer"><span>SalesFlow &mdash; FairDirection</span><span>\u062A\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B</span></div>'}function s(e){return new Intl.NumberFormat("ar-EG").format(e)+" \u062C.\u0645"}function p(e){let r={confirmed:["\u0645\u0624\u0643\u062F","pill-green"],collected:["\u0645\u064F\u062D\u0635\u064E\u0651\u0644","pill-green"],claimed:["\u0642\u064A\u062F \u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0629","pill-yellow"],draft:["\u0645\u0633\u0648\u062F\u0629","pill-gray"],active:["\u0646\u0634\u0637","pill-green"],inactive:["\u063A\u064A\u0631 \u0646\u0634\u0637","pill-red"],pending:["\u0645\u0639\u0644\u0642","pill-yellow"],submitted:["\u0645\u0642\u062F\u064E\u0651\u0645\u0629","pill-blue"],disputed:["\u0645\u062A\u0646\u0627\u0632\u0639 \u0639\u0644\u064A\u0647","pill-red"],paid:["\u062A\u0645 \u0627\u0644\u0635\u0631\u0641","pill-green"]},[a,t]=r[e]??[e,"pill-gray"];return`<span class="pill ${t}">${a}</span>`}export{l as a,n as b,d as c,s as d,p as e};
