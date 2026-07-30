interface LedgerRow {
  date: string | Date;
  type: string;
  description?: string | null;
  reference?: string | null;
  debit: number;
  credit: number;
  balance: number;
}

interface PrintOptions {
  title: string;
  entityName: string;
  entityCompany?: string | null;
  entityPhone?: string | null;
  fromDate?: string;
  toDate?: string;
  rows: LedgerRow[];
  totalDebit?: number;
  totalCredit?: number;
  closingBalance?: number;
}

const pkr = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-GB');

export function printLedger(opts: PrintOptions) {
  const periodLine = opts.fromDate || opts.toDate
    ? `${opts.fromDate ? fmtDate(opts.fromDate) : '—'} &nbsp;to&nbsp; ${opts.toDate ? fmtDate(opts.toDate) : '—'}`
    : 'All Dates';

  const rows = opts.rows.map((r) => {
    const typeColor = r.type === 'PURCHASE' || r.type === 'INVOICE' ? '#C98A1E' : '#3E8E5A';
    const balColor  = r.balance > 0 ? '#C23B2E' : '#3E8E5A';
    return `
      <tr>
        <td>${fmtDate(r.date)}</td>
        <td style="color:${typeColor};font-weight:600">${r.type}</td>
        <td>${r.description ?? '-'}</td>
        <td>${r.reference ?? '-'}</td>
        <td class="num">${r.debit > 0 ? pkr(r.debit) : '-'}</td>
        <td class="num">${r.credit > 0 ? pkr(r.credit) : '-'}</td>
        <td class="num" style="color:${balColor};font-weight:600">${pkr(r.balance)}</td>
      </tr>`;
  }).join('');

  const summaryRow = (opts.rows.length > 0 && opts.totalDebit !== undefined) ? `
    <tr class="summary">
      <td colspan="4">CLOSING BALANCE</td>
      <td class="num">${pkr(opts.totalDebit ?? 0)}</td>
      <td class="num">${pkr(opts.totalCredit ?? 0)}</td>
      <td class="num" style="background:#E85D1F;color:#fff">${pkr(opts.closingBalance ?? 0)}</td>
    </tr>` : '';

  const infoLine = [opts.entityCompany, opts.entityPhone].filter(Boolean).join('  |  ');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${opts.title} — ${opts.entityName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #14181B; }

    .header { background: #081B30; color: #fff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left .brand { font-size: 16px; font-weight: 700; letter-spacing: .04em; }
    .header-left .sub   { font-size: 9px; color: #9AC6E8; letter-spacing: .12em; margin-top: 2px; }
    .header-right { text-align: right; }
    .header-right .ledger-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
    .header-right .gen-date { font-size: 9px; color: #9AC6E8; margin-top: 3px; }

    .accent { height: 3px; background: #E85D1F; }

    .entity-block { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 20px; background: #F5F2E8; border-bottom: 1px solid #D3CDBA; }
    .entity-name  { font-size: 13px; font-weight: 700; color: #0E2A47; }
    .entity-info  { font-size: 9.5px; color: #6B7178; margin-top: 3px; }
    .period-label { font-size: 9.5px; color: #6B7178; text-align: right; }
    .period-value { font-size: 11px; font-weight: 600; color: #0E2A47; text-align: right; margin-top: 3px; }

    table { width: 100%; border-collapse: collapse; margin-top: 0; }
    thead tr { background: #0E2A47; color: #fff; }
    thead th { padding: 7px 10px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; text-align: left; }
    thead th.num { text-align: right; }
    tbody tr:nth-child(even) { background: #FAF8F4; }
    tbody tr:hover { background: #F0EDE4; }
    td { padding: 6px 10px; border-bottom: 1px solid #E8E4D8; font-size: 10.5px; }
    td.num { text-align: right; font-family: 'Courier New', monospace; }

    tr.summary td { background: #0E2A47; color: #fff; font-weight: 700; font-size: 11px; padding: 8px 10px; border: none; }
    tr.summary td.num { text-align: right; font-family: 'Courier New', monospace; }

    .footer { margin-top: 16px; padding: 8px 20px; border-top: 1px solid #D3CDBA; display: flex; justify-content: space-between; color: #6B7178; font-size: 9px; }

    @media print {
      @page { size: A4 landscape; margin: 8mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="brand">ConstructPro</div>
      <div class="sub">CONSTRUCTION ERP</div>
    </div>
    <div class="header-right">
      <div class="ledger-title">${opts.title}</div>
      <div class="gen-date">Generated: ${fmtDate(new Date())}</div>
    </div>
  </div>
  <div class="accent"></div>
  <div class="entity-block">
    <div>
      <div class="entity-name">${opts.entityName}</div>
      ${infoLine ? `<div class="entity-info">${infoLine}</div>` : ''}
    </div>
    <div>
      <div class="period-label">PERIOD</div>
      <div class="period-value">${periodLine}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Description</th>
        <th>Reference</th>
        <th class="num">Debit (PKR)</th>
        <th class="num">Credit (PKR)</th>
        <th class="num">Balance (PKR)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#6B7178">No transactions</td></tr>'}
      ${summaryRow}
    </tbody>
  </table>
  <div class="footer">
    <span>ConstructPro — Confidential</span>
    <span>${opts.entityName} | ${opts.title}</span>
  </div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
