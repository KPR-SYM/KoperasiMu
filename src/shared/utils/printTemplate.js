/**
 * Utility untuk membuat halaman cetak (Print/PDF) Koperasi SenyumMu dengan template standar premium.
 * Tema: Biru & Kuning (identitas Koperasi SenyumMu)
 */

export const PRINT_BASE_STYLE = `
:root{--print-primary:#1e5fbf;--print-secondary:#f5b301}
html,body{height:100%;margin:0;padding:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff;line-height:1.5}
.page{padding:14mm 16mm;height:100%;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box}
.content-wrap{flex:1 0 auto}
.footer-wrap{flex-shrink:0;margin-top:auto}

/* ── Letterhead header ── */
.header{border-bottom:1.5px solid var(--print-primary);padding-bottom:8px;margin-bottom:10px}
.header-row{display:flex;justify-content:space-between;align-items:center}
.header-brand{display:flex;align-items:center;gap:10px}
.header-brand-divider{width:1px;align-self:stretch;background:#e2e8f0;margin:0 2px}
.header-logo{width:32px;height:32px;border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.header-logo img{width:100%;height:100%;object-fit:contain}
.header-logo svg{width:20px;height:20px;fill:var(--print-primary)}
.header-logo-koperasi{width:24px;height:24px;flex-shrink:0;overflow:hidden;align-self:center}
.header-logo-koperasi img{width:100%;height:100%;object-fit:contain}
.header-school-name{font-size:12.5px;font-weight:700;color:#111;letter-spacing:0.005em;line-height:1.25}
.header-school-sub{font-size:9px;color:#667;margin-top:1px}
.header-school-addr{font-size:8.5px;color:#94a3b8;margin-top:1px}
.header-publisher{font-size:8px;color:#94a3b8;margin-top:1px}
.header-right{text-align:right;font-size:9.5px;color:#64748b;display:flex;align-items:center;gap:10px}
.header-right-meta{text-align:right}
.badge{display:inline-block;background:var(--print-primary);color:#fff;font-size:8.5px;font-weight:700;padding:3px 8px;border-radius:2px;text-transform:uppercase;letter-spacing:0.08em}
.doc-id{font-size:9px;color:#64748b;margin-top:4px}
.doc-printed{font-size:8.5px;color:#a0aec0}

/* ── Report title row ── */
.title-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;padding-bottom:8px;border-bottom:0.5px solid #e5e7eb}
.report-title{font-size:15px;font-weight:700;color:#111}
.report-sub{font-size:9.5px;color:#64748b;margin-top:2px}
.total-badge{font-size:20px;font-weight:700;color:var(--print-primary);line-height:1;text-align:right}
.total-label{font-size:8px;text-transform:uppercase;letter-spacing:0.07em;color:#a0aec0;text-align:right;margin-top:1px}

/* ── Section divider ── */
.section-label{font-size:9px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.section-label::after{content:'';flex:1;height:0.5px;background:#e5e7eb}

/* ── Stats grid (kept minimal — supporting context, not the main content) ── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.stat{border:0.5px solid #e5e7eb;border-radius:2px;padding:5px 8px;position:relative;overflow:hidden}
.stat::before{content:'';position:absolute;top:0;left:0;bottom:0;width:2px}
.stat.total::before{background:var(--print-primary)}
.stat.pelanggaran::before{background:#b91c1c}
.stat.prestasi::before{background:#0d7a4f}
.stat.avg::before{background:var(--print-secondary)}
.stat.violet::before{background:#6d28d9}
.stat.teal::before{background:#0f766e}
.stat.amber::before{background:#b45309}
.stat p.l{font-size:7.5px;text-transform:uppercase;letter-spacing:0.07em;color:#a0aec0;font-weight:700;margin-bottom:1px}
.stat p.v{font-size:14px;font-weight:700;color:#1a1a1a;line-height:1.2}
.stat p.d{font-size:8px;color:#c0c8d2;margin-top:1px}

/* ── Info strip (plain meta line, not a filled card) ── */
.info-strip{border-bottom:0.5px solid #e5e7eb;padding:0 0 8px;display:flex;flex-wrap:wrap;gap:4px 20px;margin-bottom:12px;font-size:9.5px;color:#444}
.info-item{display:flex;gap:5px}
.info-key{color:#94a3b8}
.info-val{font-weight:700;color:#334155}

/* ── Table ── */
table{width:100%;border-collapse:collapse;margin-bottom:20px;border:0.5px solid #d4d4d4}
thead tr{background:var(--print-primary)}
th{font-size:9.5px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:#fff;padding:7px 9px;text-align:left;border:0.5px solid rgba(255,255,255,0.15)}
th:first-child{width:24px;text-align:center;color:#fff}
td{padding:7px 9px;border:0.5px solid #e5e7eb;vertical-align:middle;color:#1a1a1a;font-size:10.5px}
tr:nth-child(even) td{background:#f8f9fb}
tr{page-break-inside:avoid}
td:first-child{text-align:center;color:#aaa;font-size:9.5px}
td.cell-rusak{color:#991b1b;font-weight:700;background:#fef2f2}
td.cell-empty{color:#bbb;font-style:italic}

/* ── Badges ── */
.tag-visitor{display:inline-block;padding:2px 7px;border-radius:2px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em}
.tag-visitor.guru{background:#fef3c7;color:#92400e;border:0.5px solid #fde047}
.tag-visitor.santri{background:#dbeafe;color:#1d4ed8;border:0.5px solid #93c5fd}
.tag-status{display:inline-block;padding:2px 7px;border-radius:2px;font-size:9px;font-weight:700}
.tag-status.warning{background:#fef9c3;color:#713f12;border:0.5px solid #fde047}
.tag-status.success{background:#dcfce7;color:#14532d;border:0.5px solid #86efac}

/* ── Signature ── */
.signature-section{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;margin-bottom:24px;page-break-inside:avoid}
.signature-place{font-size:9.5px;color:#94a3b8}
.signature-group{display:flex;gap:18px}
.signature-box{text-align:center;border:0.5px solid #e5e7eb;border-radius:2px;padding:8px 22px}
.signature-box p.ttd-title{font-size:9px;color:#a0aec0;margin-bottom:2px}
.signature-box p.ttd-role{font-weight:700;font-size:10px;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.03em}
.signature-box.approver p.ttd-role{color:var(--print-primary)}
.signature-box .signature-line{height:48px}
.signature-box p.ttd-name{font-weight:700;font-size:10.5px;color:#1a1a1a;border-top:0.5px solid #bbb;padding-top:4px;margin:0 4px}

/* ── Footer Premium ── */
.footer-line{height:1px;background:#eee;margin-bottom:8px}
.footer-premium{display:flex;justify-content:space-between;align-items:center;font-size:8.5pt;color:#888;font-family:sans-serif}
.footer-left{display:flex;align-items:center;gap:8px}
.footer-qr{width:38px;height:38px;border:1px solid #eee;border-radius:2px;padding:2px;background:#fff}
.footer-logo{width:26px;height:26px;flex-shrink:0;object-fit:contain}
.footer-brand{display:flex;flex-direction:column;line-height:1.2}
.footer-brand-title{font-weight:700;color:#334155}
.footer-brand-sub{font-size:7.5pt;color:#94a3b8}
.footer-right{display:flex;flex-direction:column;text-align:right;line-height:1.3;color:#94a3b8}
.footer-watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:260px;opacity:0.045;pointer-events:none;z-index:0}

@media print{
  html,body{height:auto!important;min-height:auto!important;overflow:visible!important}
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{padding:0;min-height:auto!important;height:auto!important;display:block;overflow:visible!important;position:relative}
  .content-wrap{display:block;height:auto!important;min-height:auto!important;position:relative;z-index:1}
  .footer-wrap{margin-top:24px;display:block;page-break-inside:avoid;position:relative;z-index:1}
  .header-row,.title-row,.stats,.section-label,.info-strip,.signature-section{page-break-inside:avoid}
}
`

export function openPrintWindow(html) {
  const win = window.open('', '_blank', 'width=1200,height=750')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  return true
}

/**
 * Generate a verification URL for the QR code.
 * Uses the same logic as RaportPrintCard to handle local/dev/prod environments.
 */
function _getVerificationUrl(docNumber) {
  const origin = window.location.origin
  const host = window.location.hostname

  const isLocalIp = host.startsWith('192.168.') ||
                    host.startsWith('10.') ||
                    host.startsWith('172.') ||
                    host.includes('.local')

  if (isLocalIp) {
    return `${origin}/verify?no=${encodeURIComponent(docNumber)}`
  }

  if (host === 'localhost' || host === '127.0.0.1') {
    return `https://koperasisenyummu.my.id/verify?no=${encodeURIComponent(docNumber)}`
  }

  return `${origin}/verify?no=${encodeURIComponent(docNumber)}`
}

export function buildPrintHTML({
  language = 'id',
  schoolName = 'SMP Muhammadiyah 04 Tanggul',
  schoolSub = 'Muhammadiyah Boarding School',
  schoolAddress = 'Jln. Pemandian No 88, Tanggul, Jember',
  schoolLogo = '', // URL or base64 data-uri of school logo (shown in header, left)
  koperasiLogo = '', // URL or base64 data-uri of Koperasi SenyumMu logo (shown near badge, right)
  showPublisherLine = true, // "· Diterbitkan oleh Koperasi SenyumMu ..." appended to the sub line
  publisherLine = 'Diterbitkan oleh Koperasi SenyumMu — Unit Usaha Sekolah',
  docBadge = 'LAPORAN',
  docNumber = '',
  title = '',
  subtitle = '',
  totalCount = 0,
  totalLabel = 'Total',
  stats = [], // Array of { label, value, type: 'total|pelanggaran|prestasi|avg|violet|teal|amber', description }
  infoStrip = [], // Array of { label, value }
  tableHeaders = [], // Array of string/HTML
  tableRowsHTML = '', // Raw HTML string for <tr>...</tr>
  showSignature = true,
  signaturePlace = 'Tanggul', // city name used in "Tanggul, 14 Juni 2026"
  signatureTitle = 'Kepala Sekolah',
  signatureName = '',
  secondarySignatureTitle = '', // e.g. 'Tim Sarpras' — if set, shows a second signature box (left side)
  secondarySignatureName = '',
  paperSize = 'A4 landscape',
  // Phase 1: Color theming — default tema Koperasi SenyumMu (biru & kuning)
  colorPrimary = '#1e5fbf',
  colorSecondary = '#f5b301',
  // Phase 3: Footer premium with QR
  footerAppTitle = 'Koperasi SenyumMu',
  footerAppSubtitle = '',
  showWatermark = true, // watermark logo koperasi tipis di tengah halaman
}) {
  const now = new Date()
  const dateLocale = language === 'en' ? 'en-US' : 'id-ID'
  const timeLocale = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeStyle: 'short' }).format(now)
  const dateLocaleOnly = new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium' }).format(now)

  const dict = {
    id: {
      docNo: 'No. Dok',
      printed: 'Dicetak',
      summary: 'Ringkasan',
      details: 'Detail Laporan',
      approvedBy: 'Mengetahui,',
      preparedBy: 'Dibuat oleh,',
      page: 'Hal.',
      total: 'Total',
      timeSuffix: 'WIB',
      placeDateLocale: 'id-ID',
      printTime: 'Waktu Cetak',
      docNoLabel: 'No. Dok',
      verifySubtitle: 'Pindai QR untuk verifikasi keaslian laporan',
    },
    en: {
      docNo: 'Doc No',
      printed: 'Printed',
      summary: 'Summary',
      details: 'Report Details',
      approvedBy: 'Approved by,',
      preparedBy: 'Prepared by,',
      page: 'Page',
      total: 'Total',
      timeSuffix: 'UTC',
      placeDateLocale: 'en-US',
      printTime: 'Print Time',
      docNoLabel: 'Doc No',
      verifySubtitle: 'Scan QR to verify document authenticity',
    }
  }

  const t = dict[language] || dict.id

  const finalDocNumber = docNumber || `DOC/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) % 9999 + 1).padStart(4, '0')}`

  // Phase 1: CSS custom property overrides
  const colorVars = `:root{--print-primary:${colorPrimary};--print-secondary:${colorSecondary}}`

  const statsHtml = stats.map(s =>
    `<div class="stat ${s.type || 'total'}">
      <p class="l">${s.label}</p>
      <p class="v">${s.value}</p>
      ${s.description ? `<p class="d">${s.description}</p>` : ''}
    </div>`
  ).join('')

  const infoStripHtml = infoStrip.map(item =>
    `<div class="info-item">
      <span class="info-key">${item.label}:</span>
      <span class="info-val">${item.value}</span>
    </div>`
  ).join('')

  const tableHeaderHtml = tableHeaders.map(h => `<th>${h}</th>`).join('')

  const placeDateText = `${signaturePlace}, ${dateLocaleOnly}`

  const sigBoxHtml = (roleLabel, role, name, isApprover) => `
    <div class="signature-box${isApprover ? ' approver' : ''}">
      <p class="ttd-title">${roleLabel}</p>
      <p class="ttd-role">${role}</p>
      <div class="signature-line"></div>
      <p class="ttd-name">${name || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</p>
    </div>`

  const signatureBoxesHtml = [
    secondarySignatureTitle ? sigBoxHtml(t.preparedBy, secondarySignatureTitle, secondarySignatureName, false) : '',
    sigBoxHtml(t.approvedBy, signatureTitle, signatureName, true)
  ].filter(Boolean).join('')

  const signatureHtml = showSignature ? `
    <div class="signature-section">
      <div class="signature-place">${placeDateText}</div>
      <div class="signature-group">${signatureBoxesHtml}</div>
    </div>` : ''

  // Phase 3: Footer premium with QR code — always black/white, so it reads reliably in print
  const verificationUrl = _getVerificationUrl(finalDocNumber)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=svg&ecc=L&qzone=1&color=000000&bgcolor=ffffff&data=${encodeURIComponent(verificationUrl)}`
  const resolvedFooterSubtitle = footerAppSubtitle || t.verifySubtitle

  const footerHtml = `
    <div class="footer-line"></div>
    <div class="footer-premium">
      <div class="footer-left">
        <img class="footer-qr" src="${qrSrc}" alt="Verification QR" />
        ${koperasiLogo ? `<img class="footer-logo" src="${koperasiLogo}" alt="${footerAppTitle}">` : ''}
        <div class="footer-brand">
          <span class="footer-brand-title">${footerAppTitle}</span>
          <span class="footer-brand-sub">${resolvedFooterSubtitle}</span>
        </div>
      </div>
      <div class="footer-right">
        <span>${t.docNoLabel}: ${finalDocNumber}</span>
        <span>${t.printTime}: ${timeLocale} ${t.timeSuffix}</span>
      </div>
    </div>`

  const watermarkHtml = (showWatermark && koperasiLogo) ? `<img class="footer-watermark" src="${koperasiLogo}" alt="">` : ''

  const pageStyle = `@page{margin:14mm 16mm;size:${paperSize}}`

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${colorVars}${PRINT_BASE_STYLE}${pageStyle}</style>
</head>
<body>
<div class="page">
  ${watermarkHtml}
  <div class="content-wrap">

    <!-- Letterhead header: single compact row, no stacked decorative rules -->
    <div class="header">
      <div class="header-row">
        <div class="header-brand">
          <div class="header-logo">
            ${schoolLogo
      ? `<img src="${schoolLogo}" alt="${schoolName}">`
      : `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>`
    }
          </div>
          <div>
            <div class="header-school-name">${schoolName}</div>
            <div class="header-school-sub">${schoolSub}${showPublisherLine ? ` · ${publisherLine}` : ''}</div>
          </div>
        </div>
        <div class="header-right">
          ${koperasiLogo ? `<img class="header-logo-koperasi" src="${koperasiLogo}" alt="${footerAppTitle}">` : ''}
          <div class="header-right-meta">
            <div class="badge">${docBadge}</div>
            <div class="doc-id">${t.docNo}: ${finalDocNumber}</div>
            <div class="doc-printed">${t.printed}: ${timeLocale} ${t.timeSuffix}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Title -->
    <div class="title-row">
      <div>
        <div class="report-title">${title}</div>
        ${subtitle ? `<div class="report-sub">${subtitle}</div>` : ''}
      </div>
      <div>
        <div class="total-badge">${totalCount}</div>
        <div class="total-label">${totalLabel}</div>
      </div>
    </div>

    <!-- Stats — only rendered if the caller passes them, kept compact -->
    ${statsHtml ? `<div class="section-label">${t.summary}</div><div class="stats">${statsHtml}</div>` : ''}

    <!-- Info strip — plain meta line, no filled card -->
    ${infoStripHtml ? `<div class="info-strip">${infoStripHtml}</div>` : ''}

    <!-- Table (the real data — main focus of the page) -->
    <div class="section-label">${t.details}</div>
    <table>
      <thead><tr>${tableHeaderHtml}</tr></thead>
      <tbody>${tableRowsHTML}</tbody>
    </table>

  </div><!-- /content-wrap -->

  <div class="footer-wrap">
    ${signatureHtml}
    ${footerHtml}
  </div>

</div><!-- /page -->
<script>window.onload=()=>window.print()<\/script>
</body></html>`
}