import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LedgerRow {
  date: string | Date;
  type: string;
  description?: string | null;
  reference?: string | null;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerSummary {
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

interface ExportOptions {
  title: string;
  entityName: string;
  entityCompany?: string | null;
  entityPhone?: string | null;
  fromDate?: string;
  toDate?: string;
  rows: LedgerRow[];
  summary?: LedgerSummary;
  typeLabels?: Record<string, string>;
  companyName?: string;
}

const BLUEPRINT = [14, 42, 71] as [number, number, number];
const ORANGE   = [232, 93, 31] as [number, number, number];
const PAPER    = [245, 242, 232] as [number, number, number];
const STEEL    = [107, 113, 120] as [number, number, number];
const GREEN    = [62, 142, 90] as [number, number, number];
const RED      = [194, 59, 46] as [number, number, number];

const pkr = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-GB');

export function exportLedgerPdf(opts: ExportOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // ── Header bar ──────────────────────────────────────────────────────────
  doc.setFillColor(...BLUEPRINT);
  doc.rect(0, 0, W, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(opts.companyName || 'ConstructPro', 12, 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(154, 198, 232);
  doc.text('CONSTRUCTION ERP', 12, 15);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(opts.title, W - 12, 10, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(154, 198, 232);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, W - 12, 16, { align: 'right' });

  // ── Orange accent line ───────────────────────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(0, 22, W, 1.2, 'F');

  // ── Entity info ─────────────────────────────────────────────────────────
  let y = 30;
  doc.setFillColor(...PAPER);
  doc.rect(10, y - 4, W - 20, 18, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUEPRINT);
  doc.text(opts.entityName, 14, y + 1);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...STEEL);
  const infoLine = [opts.entityCompany, opts.entityPhone].filter(Boolean).join('  |  ');
  if (infoLine) doc.text(infoLine, 14, y + 7);

  if (opts.fromDate || opts.toDate) {
    const period = `Period: ${opts.fromDate ? fmtDate(opts.fromDate) : '—'}  to  ${opts.toDate ? fmtDate(opts.toDate) : '—'}`;
    doc.setFontSize(8.5);
    doc.setTextColor(...STEEL);
    doc.text(period, W - 14, y + 1, { align: 'right' });
  }

  y += 22;

  // ── Table ────────────────────────────────────────────────────────────────
  const body: any[] = opts.rows.map((r) => [
    fmtDate(r.date),
    r.type,
    r.description ?? '-',
    r.reference ?? '-',
    r.debit > 0 ? pkr(r.debit) : '-',
    r.credit > 0 ? pkr(r.credit) : '-',
    pkr(r.balance),
  ]);

  // Summary footer row
  if (opts.summary && opts.rows.length > 0) {
    body.push([
      { content: 'CLOSING BALANCE', colSpan: 4, styles: { fontStyle: 'bold', fillColor: BLUEPRINT, textColor: [255, 255, 255] } },
      { content: pkr(opts.summary.totalDebit),   styles: { fontStyle: 'bold', fillColor: BLUEPRINT, textColor: [255, 255, 255], halign: 'right' } },
      { content: pkr(opts.summary.totalCredit),  styles: { fontStyle: 'bold', fillColor: BLUEPRINT, textColor: [255, 255, 255], halign: 'right' } },
      { content: pkr(opts.summary.closingBalance), styles: { fontStyle: 'bold', fillColor: ORANGE, textColor: [255, 255, 255], halign: 'right' } },
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Type', 'Description', 'Reference', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: BLUEPRINT,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, textColor: [20, 24, 27] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 30 },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' },
      6: { cellWidth: 32, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 1 && typeof data.cell.raw === 'string') {
        const type = data.cell.raw as string;
        if (type === 'PURCHASE' || type === 'INVOICE') {
          data.cell.styles.textColor = [201, 138, 30];
          data.cell.styles.fontStyle = 'bold';
        } else if (type === 'PAYMENT') {
          data.cell.styles.textColor = [...GREEN];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Balance column color
      if (data.section === 'body' && data.column.index === 6 && data.row.index < opts.rows.length) {
        const bal = opts.rows[data.row.index].balance;
        data.cell.styles.textColor = bal > 0 ? [...RED] : [...GREEN];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ── Footer ───────────────────────────────────────────────────────────────
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...BLUEPRINT);
    doc.rect(0, pageH - 8, W, 8, 'F');
    doc.setFontSize(7);
    doc.setTextColor(154, 198, 232);
    doc.text(`${opts.companyName || 'ConstructPro'} — Confidential`, 12, pageH - 2.5);
    doc.text(`Page ${i} of ${pages}`, W - 12, pageH - 2.5, { align: 'right' });
  }

  const fileName = `${opts.title.replace(/\s+/g, '_')}_${opts.entityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
