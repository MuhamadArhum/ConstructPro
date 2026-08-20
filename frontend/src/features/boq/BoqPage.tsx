import { useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { useGetProjectQuery } from '../projects/projectApi';
import {
  useGetBoqByProjectQuery,
  useCreateBoqMutation,
  useAddBoqSectionMutation,
  useUpdateBoqSectionMutation,
  useDeleteBoqSectionMutation,
  useAddBoqItemMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,
} from './boqApi';
import type { BoqDto, BoqSectionDto, BoqItemDto } from '../../types/boq.types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtNum = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const COMMON_UNITS = ['Sft', 'Rft', 'Cft', 'Nos', 'Bags', 'Kg', 'Ton', 'Ltr', 'Mtr', 'Sqm', 'Cum'];

// ── Print ──────────────────────────────────────────────────────────────────────
function handlePrint(boq: BoqDto, projectName: string) {
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const sectionsHtml = boq.sections.map((sec, sIdx) => {
    const rowsHtml = sec.items.map((item, iIdx) => `
      <tr>
        <td>${iIdx + 1}</td>
        <td>${item.description}${item.notes ? `<br/><small style="color:#666">${item.notes}</small>` : ''}</td>
        <td style="text-align:center">${item.unit}</td>
        <td style="text-align:right">${fmtNum(item.quantity)}</td>
        <td style="text-align:right">${fmtNum(item.unitRate)}</td>
        <td style="text-align:right;font-weight:600">${item.amount > 0 ? fmtNum(item.amount) : '—'}</td>
      </tr>`).join('');

    const subtotalRow = sec.items.length > 0 ? `
      <tr style="background:#f0f4ff">
        <td colspan="5" style="text-align:right;font-weight:700;color:#555">Section Total:</td>
        <td style="text-align:right;font-weight:700;color:#1a3c6e">PKR ${fmtNum(sec.subtotal)}</td>
      </tr>` : '';

    const emptyRow = sec.items.length === 0 ? `
      <tr><td colspan="6" style="text-align:center;color:#999;padding:16px">No items</td></tr>` : '';

    return `
      <div class="section">
        <div class="section-header">
          <span class="section-num">${sIdx + 1}</span>
          <span class="section-title">${sec.title}</span>
          <span class="section-subtotal">PKR ${fmtNum(sec.subtotal)}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Description</th>
              <th style="width:70px;text-align:center">Unit</th>
              <th style="width:80px;text-align:right">Qty</th>
              <th style="width:110px;text-align:right">Rate (PKR)</th>
              <th style="width:120px;text-align:right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}${emptyRow}${subtotalRow}</tbody>
        </table>
      </div>`;
  }).join('');

  const summaryRows = boq.sections.map((s, i) => `
    <tr>
      <td style="color:#666">${i + 1}</td>
      <td>${s.title}</td>
      <td style="text-align:right;font-weight:600">PKR ${fmtNum(s.subtotal)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>BOQ — ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 20px 28px; }
    .header { border-bottom: 3px solid #1a3c6e; padding-bottom: 12px; margin-bottom: 18px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .company { font-size: 20px; font-weight: 700; color: #1a3c6e; }
    .doc-title { font-size: 14px; font-weight: 700; color: #1a3c6e; margin-top: 4px; }
    .project-name { font-size: 12px; color: #555; margin-top: 2px; }
    .header-right { text-align: right; font-size: 10px; color: #666; }
    .grand-total-banner { background: #1a3c6e; color: white; padding: 10px 16px; border-radius: 6px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
    .grand-total-banner .label { font-size: 13px; font-weight: 600; }
    .grand-total-banner .amount { font-size: 20px; font-weight: 800; }
    .section { margin-bottom: 18px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
    .section-header { display: flex; align-items: center; gap: 10px; background: #e8edf5; padding: 8px 12px; border-bottom: 1px solid #ddd; }
    .section-num { background: #1a3c6e; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .section-title { font-weight: 700; font-size: 12px; flex: 1; }
    .section-subtotal { font-weight: 700; color: #1a3c6e; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f5f7fa; }
    th { padding: 6px 8px; font-weight: 600; font-size: 10px; text-align: left; border-bottom: 1px solid #ddd; color: #444; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .summary { margin-top: 16px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
    .summary-header { background: #e8edf5; padding: 8px 12px; font-weight: 700; font-size: 12px; border-bottom: 1px solid #ddd; }
    .summary table { }
    .grand-row { background: #f0f4ff; font-weight: 800; font-size: 13px; color: #1a3c6e; }
    .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
    @media print {
      body { padding: 10px 18px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div>
        <div class="company">ConstructPro</div>
        <div class="doc-title">Bill of Quantities</div>
        <div class="project-name">Project: ${projectName}</div>
      </div>
      <div class="header-right">
        <div>Date: ${date}</div>
        <div style="margin-top:4px">${boq.sections.length} Section${boq.sections.length !== 1 ? 's' : ''} &nbsp;|&nbsp; ${boq.sections.reduce((s, sec) => s + sec.items.length, 0)} Items</div>
      </div>
    </div>
  </div>

  <div class="grand-total-banner">
    <span class="label">Grand Total</span>
    <span class="amount">${fmt(boq.grandTotal)}</span>
  </div>

  ${sectionsHtml}

  ${boq.sections.length > 0 ? `
  <div class="summary">
    <div class="summary-header">Summary</div>
    <table>
      <tbody>
        ${summaryRows}
        <tr class="grand-row">
          <td colspan="2" style="font-weight:800">Grand Total</td>
          <td style="text-align:right;font-weight:800">${fmt(boq.grandTotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    <span>Generated by ConstructPro</span>
    <span>${date}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

// ── Export PDF ─────────────────────────────────────────────────────────────────
function handleExportPdf(boq: BoqDto, projectName: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const primaryColor: [number, number, number] = [26, 60, 110];
  const lightBg: [number, number, number] = [232, 237, 245];

  let y = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('BILL OF QUANTITIES', margin, 13);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, margin, 19);
  doc.text(`Date: ${date}`, pageW - margin, 19, { align: 'right' });

  y = 28;

  // Grand Total banner
  doc.setFillColor(...lightBg);
  doc.rect(margin, y, pageW - margin * 2, 12, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', margin + 4, y + 7.5);
  doc.setFontSize(13);
  doc.text(fmt(boq.grandTotal), pageW - margin - 4, y + 7.5, { align: 'right' });
  y += 17;

  // Sections
  boq.sections.forEach((sec, sIdx) => {
    // Section header
    if (y > 250) { doc.addPage(); y = 14; }

    doc.setFillColor(...primaryColor);
    doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(`${sIdx + 1}. ${sec.title}`, margin + 4, y + 5.5);
    doc.text(`PKR ${fmtNum(sec.subtotal)}`, pageW - margin - 4, y + 5.5, { align: 'right' });
    y += 9;

    const tableBody = sec.items.map((item, iIdx) => [
      String(iIdx + 1),
      item.notes ? `${item.description}\n${item.notes}` : item.description,
      item.unit,
      fmtNum(item.quantity),
      fmtNum(item.unitRate),
      item.amount > 0 ? fmtNum(item.amount) : '—',
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Description', 'Unit', 'Qty', 'Rate (PKR)', 'Amount (PKR)']],
      body: tableBody,
      foot: sec.items.length > 0
        ? [['', '', '', '', 'Section Total:', `PKR ${fmtNum(sec.subtotal)}`]]
        : undefined,
      theme: 'grid',
      headStyles: { fillColor: [240, 244, 255], textColor: primaryColor, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: [240, 244, 255], textColor: primaryColor, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8 },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 18, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: () => { y = 14; },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  });

  // Summary table
  if (boq.sections.length > 0) {
    if (y > 230) { doc.addPage(); y = 14; }

    doc.setFillColor(...primaryColor);
    doc.rect(margin, y, pageW - margin * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', margin + 4, y + 5.5);
    y += 9;

    const summaryBody = boq.sections.map((s, i) => [
      String(i + 1), s.title, `PKR ${fmtNum(s.subtotal)}`
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Section', 'Amount']],
      body: summaryBody,
      foot: [['', 'Grand Total', fmt(boq.grandTotal)]],
      theme: 'grid',
      headStyles: { fillColor: lightBg, textColor: primaryColor, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12 },
        2: { halign: 'right', fontStyle: 'bold' },
      },
    });
  }

  // Footer on each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by ConstructPro', margin, 290);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, 290, { align: 'right' });
  }

  doc.save(`BOQ-${projectName.replace(/[^a-z0-9]/gi, '_')}-${date.replace(/ /g, '-')}.pdf`);
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function BoqPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: project } = useGetProjectQuery(projectId ?? '', { skip: !projectId });
  const { data: boq, isLoading } = useGetBoqByProjectQuery(projectId ?? '', { skip: !projectId });

  const [createBoq, { isLoading: creating }] = useCreateBoqMutation();
  const [addSection, { isLoading: addingSection }] = useAddBoqSectionMutation();
  const [updateSection] = useUpdateBoqSectionMutation();
  const [deleteSection] = useDeleteBoqSectionMutation();
  const [addItem, { isLoading: addingItem }] = useAddBoqItemMutation();
  const [updateItem, { isLoading: updatingItem }] = useUpdateBoqItemMutation();
  const [deleteItem] = useDeleteBoqItemMutation();

  const [sectionOpen, setSectionOpen] = useState(false);
  const [editSection, setEditSection] = useState<BoqSectionDto | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  const [itemOpen, setItemOpen] = useState(false);
  const [itemSectionId, setItemSectionId] = useState('');
  const [editItem, setEditItem] = useState<BoqItemDto | null>(null);
  const [itemDesc, setItemDesc] = useState('');
  const [itemUnit, setItemUnit] = useState('Nos');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemProjectId] = useState(projectId ?? '');

  const openAddSection = () => { setEditSection(null); setSectionTitle(''); setSectionOpen(true); };
  const openEditSection = (s: BoqSectionDto) => { setEditSection(s); setSectionTitle(s.title); setSectionOpen(true); };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !sectionTitle.trim()) return;
    try {
      if (editSection) {
        await updateSection({ sectionId: editSection.id, projectId, data: { title: sectionTitle } }).unwrap();
        dispatch(showSnackbar({ message: 'Section updated', severity: 'success' }));
      } else {
        await addSection({ projectId, data: { title: sectionTitle } }).unwrap();
        dispatch(showSnackbar({ message: 'Section added', severity: 'success' }));
      }
      setSectionOpen(false);
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
    }
  };

  const openAddItem = (sectionId: string) => {
    setEditItem(null); setItemSectionId(sectionId);
    setItemDesc(''); setItemUnit('Nos'); setItemQty(''); setItemRate(''); setItemNotes('');
    setItemOpen(true);
  };

  const openEditItem = (item: BoqItemDto) => {
    setEditItem(item); setItemSectionId(item.sectionId);
    setItemDesc(item.description); setItemUnit(item.unit);
    setItemQty(String(item.quantity)); setItemRate(String(item.unitRate));
    setItemNotes(item.notes ?? '');
    setItemOpen(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    const data = {
      description: itemDesc, unit: itemUnit,
      quantity: parseFloat(itemQty) || 0,
      unitRate: parseFloat(itemRate) || 0,
      notes: itemNotes || undefined,
    };
    try {
      if (editItem) {
        await updateItem({ itemId: editItem.id, projectId, data }).unwrap();
        dispatch(showSnackbar({ message: 'Item updated', severity: 'success' }));
      } else {
        await addItem({ sectionId: itemSectionId, projectId, data }).unwrap();
        dispatch(showSnackbar({ message: 'Item added', severity: 'success' }));
      }
      setItemOpen(false);
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
    }
  };

  const previewAmount = (parseFloat(itemQty) || 0) * (parseFloat(itemRate) || 0);
  const projectName = project?.name ?? 'Project';

  if (isLoading) return <Loader />;

  return (
    <Box sx={{ p: 3 }}>
      <AppBreadcrumbs crumbs={[
        { label: 'Projects', to: '/projects' },
        { label: projectName, to: `/projects/${projectId}` },
        { label: 'BOQ' },
      ]} />

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => navigate(`/projects/${projectId}`)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <ArticleIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Bill of Quantities</Typography>
            <Typography variant="body2" color="text.secondary">{projectName}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          {boq && (
            <>
              <Button
                startIcon={<PrintIcon />} variant="outlined" size="small"
                onClick={() => handlePrint(boq, projectName)}
              >
                Print
              </Button>
              <Button
                startIcon={<PictureAsPdfIcon />} variant="outlined" size="small" color="error"
                onClick={() => handleExportPdf(boq, projectName)}
              >
                Export PDF
              </Button>
              <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddSection}>
                Add Section
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* No BOQ yet */}
      {!boq && (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <ArticleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No BOQ Created Yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a Bill of Quantities to list all materials, labour and work items with quantities and rates.
          </Typography>
          <Button
            variant="contained"
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            onClick={async () => {
              if (!projectId) return;
              try {
                await createBoq({ projectId, data: {} }).unwrap();
              } catch (err: any) {
                dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
              }
            }}
            disabled={creating}
          >
            Create BOQ
          </Button>
        </Paper>
      )}

      {/* BOQ Content */}
      {boq && (
        <>
          {/* Grand Total Banner */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{fmt(boq.grandTotal)}</Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {boq.sections.length} section{boq.sections.length !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {boq.sections.reduce((s, sec) => s + sec.items.length, 0)} items
              </Typography>
            </Stack>
          </Paper>

          {boq.sections.length === 0 && (
            <EmptyState
              message="No sections yet. Add a section to start building your BOQ."
              actionLabel="Add Section"
              onAction={openAddSection}
            />
          )}

          {boq.sections.map((section, sIdx) => (
            <Paper key={section.id} variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
              <Stack direction="row" sx={{
                alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1.5, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider',
              }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Chip label={`${sIdx + 1}`} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 28 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{section.title}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {fmt(section.subtotal)}
                  </Typography>
                  <Tooltip title="Add Item">
                    <IconButton size="small" color="primary" onClick={() => openAddItem(section.id)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Section">
                    <IconButton size="small" onClick={() => openEditSection(section)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Section">
                    <IconButton size="small" color="error" onClick={() => setDeleteSectionId(section.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ width: 40, fontWeight: 600, color: 'text.secondary' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ width: 80, fontWeight: 600 }}>Unit</TableCell>
                      <TableCell sx={{ width: 90, fontWeight: 600 }} align="right">Qty</TableCell>
                      <TableCell sx={{ width: 130, fontWeight: 600 }} align="right">Rate (PKR)</TableCell>
                      <TableCell sx={{ width: 140, fontWeight: 600 }} align="right">Amount (PKR)</TableCell>
                      <TableCell sx={{ width: 80, fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.items.map((item, iIdx) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{iIdx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.description}</Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary">{item.notes}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={item.unit} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{fmtNum(item.quantity)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{fmtNum(item.unitRate)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: item.amount > 0 ? 'text.primary' : 'text.disabled' }}>
                            {item.amount > 0 ? fmtNum(item.amount) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0} sx={{ justifyContent: 'flex-end' }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditItem(item)}>
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => setDeleteItemId(item.id)}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {section.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                          No items — click + to add
                        </TableCell>
                      </TableRow>
                    )}
                    {section.items.length > 0 && (
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={5} align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                          Section Total:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {fmtNum(section.subtotal)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}

          {boq.sections.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 1, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Summary</Typography>
              </Box>
              <Table size="small">
                <TableBody>
                  {boq.sections.map((s, i) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ color: 'text.secondary', width: 40 }}>{i + 1}</TableCell>
                      <TableCell>{s.title}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(s.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'primary.50' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Grand Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: 'primary.main' }}>
                      {fmt(boq.grandTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      {/* Section Dialog */}
      <Dialog open={sectionOpen} onClose={() => setSectionOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSectionSubmit}>
          <DialogTitle>{editSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
          <DialogContent>
            <TextField
              label="Section Title" value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              fullWidth autoFocus required
              placeholder="e.g. Foundation Work, Masonry, Finishing"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSectionOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingSection || !sectionTitle.trim()}>
              {addingSection ? <CircularProgress size={18} /> : editSection ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemOpen} onClose={() => setItemOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleItemSubmit}>
          <DialogTitle>{editItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Description" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)}
                fullWidth required multiline rows={2}
                placeholder="e.g. Brick masonry in cement mortar (1:6)"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Unit" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)}
                  fullWidth required select slotProps={{ select: { native: true } }}
                >
                  {COMMON_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </TextField>
                <TextField
                  label="Quantity" type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)}
                  fullWidth required
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                />
              </Stack>
              <TextField
                label="Unit Rate (PKR)" type="number" value={itemRate} onChange={(e) => setItemRate(e.target.value)}
                fullWidth required
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment>, inputProps: { min: 0, step: 0.01 } } }}
              />
              {itemQty && itemRate && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Amount = {parseFloat(itemQty) || 0} × {parseFloat(itemRate) || 0} = <strong>{fmt(previewAmount)}</strong>
                </Alert>
              )}
              <TextField
                label="Notes (optional)" value={itemNotes} onChange={(e) => setItemNotes(e.target.value)}
                fullWidth size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setItemOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingItem || updatingItem || !itemDesc.trim()}>
              {(addingItem || updatingItem) ? <CircularProgress size={18} /> : editItem ? 'Update' : 'Add Item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Section */}
      <ConfirmDialog
        open={Boolean(deleteSectionId)} title="Delete Section"
        message="This will delete the section and all its items. This cannot be undone."
        confirmLabel="Delete" destructive
        onConfirm={async () => {
          if (!deleteSectionId || !projectId) return;
          try {
            await deleteSection({ sectionId: deleteSectionId, projectId }).unwrap();
            dispatch(showSnackbar({ message: 'Section deleted', severity: 'success' }));
          } catch {
            dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' }));
          }
          setDeleteSectionId(null);
        }}
        onCancel={() => setDeleteSectionId(null)}
      />

      {/* Delete Item */}
      <ConfirmDialog
        open={Boolean(deleteItemId)} title="Delete Item"
        message="Are you sure you want to delete this item?"
        confirmLabel="Delete" destructive
        onConfirm={async () => {
          if (!deleteItemId) return;
          try {
            await deleteItem({ itemId: deleteItemId, projectId: deleteItemProjectId }).unwrap();
            dispatch(showSnackbar({ message: 'Item deleted', severity: 'success' }));
          } catch {
            dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' }));
          }
          setDeleteItemId(null);
        }}
        onCancel={() => setDeleteItemId(null)}
      />
    </Box>
  );
}
