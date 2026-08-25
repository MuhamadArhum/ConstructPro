import {
  Box, Button, Chip, CircularProgress, Divider, Grid, IconButton, Paper,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useGetInvoiceQuery, useUpdateInvoiceStatusMutation } from './invoiceApi';
import { INVOICE_STATUS_COLORS } from '../../utils/statusColors';
import { useGetSettingsQuery } from '../settings/settingsApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmtAmount } from '../../utils/formatNumber';

const fmt = fmtAmount;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const BLUEPRINT: [number, number, number] = [14, 42, 71];
const ORANGE: [number, number, number] = [232, 93, 31];

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/invoices';
  const dispatch = useAppDispatch();

  const { data: settings } = useGetSettingsQuery();
  const { data: invoice, isLoading } = useGetInvoiceQuery(id ?? '', { skip: !id });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateInvoiceStatusMutation();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      dispatch(showSnackbar({ message: `Marked as ${newStatus}`, severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update status', severity: 'error' }));
    }
  };

  const handleExportPdf = () => {
    if (!invoice) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(...BLUEPRINT);
    doc.rect(0, 0, W, 24, 'F');
    doc.setFillColor(...ORANGE);
    doc.rect(0, 24, W, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.companyName || 'ConstructPro', 14, 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(154, 198, 232);
    doc.text('CONSTRUCTION ERP', 14, 16);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', W - 14, 11, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(154, 198, 232);
    doc.text(invoice.invoiceNumber, W - 14, 18, { align: 'right' });

    let y = 34;
    doc.setFillColor(245, 242, 232);
    doc.rect(10, y - 2, W - 20, 26, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUEPRINT);
    doc.text(invoice.customer?.name ?? '', 14, y + 4);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 113, 120);
    if (invoice.customer?.companyName) doc.text(invoice.customer.companyName, 14, y + 10);
    if (invoice.customer?.phone) doc.text(invoice.customer.phone, 14, y + 16);

    doc.setFontSize(8.5);
    doc.setTextColor(107, 113, 120);
    doc.text(`Issue Date: ${fmtDate(invoice.issueDate)}`, W - 14, y + 4, { align: 'right' });
    doc.text(`Due Date: ${fmtDate(invoice.dueDate)}`, W - 14, y + 10, { align: 'right' });
    doc.text(`Status: ${invoice.status}`, W - 14, y + 16, { align: 'right' });

    y += 34;

    const bodyRows = (invoice.items ?? []).map((item) => [
      item.description,
      item.quantity.toString(),
      fmt(item.unitPrice),
      fmt(item.total),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: BLUEPRINT, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 45, halign: 'right' },
        3: { cellWidth: 45, halign: 'right' },
      },
      margin: { left: 10, right: 10 },
    });

    const afterTableY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(9);
    doc.setTextColor(107, 113, 120);
    doc.text(`Subtotal: ${fmt(invoice.subtotal)}`, W - 14, afterTableY, { align: 'right' });
    doc.text(`Tax: ${fmt(invoice.taxAmount)}`, W - 14, afterTableY + 6, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUEPRINT);
    doc.text(`TOTAL: ${fmt(invoice.total)}`, W - 14, afterTableY + 14, { align: 'right' });

    if (invoice.notes) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 113, 120);
      doc.text(`Notes: ${invoice.notes}`, 14, afterTableY + 22);
    }

    const pages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const H = doc.internal.pageSize.getHeight();
      doc.setFillColor(...BLUEPRINT);
      doc.rect(0, H - 8, W, 8, 'F');
      doc.setFontSize(7);
      doc.setTextColor(154, 198, 232);
      doc.text(`${settings?.companyName || 'ConstructPro'} — Confidential`, 14, H - 2.5);
      doc.text(`Page ${i} of ${pages}`, W - 14, H - 2.5, { align: 'right' });
    }

    doc.save(`Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
  );

  if (!invoice) return (
    <Box sx={{ mt: 4 }}><Typography>Invoice not found.</Typography></Box>
  );

  const canMarkSent = invoice.status === 'Draft';
  const canMarkPaid = invoice.status === 'Sent';
  const canMarkCancelled = invoice.status !== 'Cancelled';

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Invoices', to: returnTo }, { label: invoice.invoiceNumber }]} />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Tooltip title="Back">
          <IconButton onClick={() => navigate(returnTo)} aria-label="Back"><ArrowBackIcon /></IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{invoice.invoiceNumber}</Typography>
        </Box>
        <Chip label={invoice.status} color={INVOICE_STATUS_COLORS[invoice.status] ?? 'default'} />
        <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf} size="small">
          Export PDF
        </Button>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/invoices/${id}/edit?returnTo=${encodeURIComponent(returnTo)}`)} size="small">
          Edit
        </Button>
      </Stack>

      {(canMarkSent || canMarkPaid || canMarkCancelled) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Quick Actions</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {canMarkSent && (
              <Button size="small" variant="outlined" color="info" onClick={() => handleStatusUpdate('Sent')} disabled={updatingStatus}>
                Mark as Sent
              </Button>
            )}
            {canMarkPaid && (
              <Button size="small" variant="outlined" color="success" onClick={() => handleStatusUpdate('Paid')} disabled={updatingStatus}>
                Mark as Paid
              </Button>
            )}
            {canMarkCancelled && (
              <Button size="small" variant="outlined" color="error" onClick={() => handleStatusUpdate('Cancelled')} disabled={updatingStatus}>
                Mark as Cancelled
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Customer</Typography>
            <Typography sx={{ fontWeight: 700 }}>{invoice.customer?.name ?? '—'}</Typography>
            {invoice.customer?.companyName && <Typography variant="body2" color="text.secondary">{invoice.customer.companyName}</Typography>}
            {invoice.customer?.phone && <Typography variant="body2" color="text.secondary">{invoice.customer.phone}</Typography>}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Details</Typography>
            <Stack spacing={0.5}>
              {invoice.project && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>Project:</Typography>
                  <Typography variant="body2">{invoice.project.name}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>Issue Date:</Typography>
                <Typography variant="body2">{fmtDate(invoice.issueDate)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>Due Date:</Typography>
                <Typography variant="body2">{fmtDate(invoice.dueDate)}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Line Items</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(invoice.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{fmt(item.unitPrice)}</TableCell>
                  <TableCell align="right">{fmt(item.total)}</TableCell>
                </TableRow>
              ))}
              {!invoice.items?.length && (
                <TableRow><TableCell colSpan={4} align="center">No items</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Stack sx={{ alignItems: 'flex-end' }} spacing={1}>
          <Stack direction="row" spacing={6} sx={{ minWidth: 280 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', color: 'text.secondary' }}>Subtotal</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right' }}>{fmt(invoice.subtotal)}</Typography>
          </Stack>
          <Stack direction="row" spacing={6} sx={{ minWidth: 280 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', color: 'text.secondary' }}>Tax {invoice.taxRate > 0 ? `(${invoice.taxRate}%)` : ''}</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right' }}>{fmt(invoice.taxAmount)}</Typography>
          </Stack>
          <Divider sx={{ width: '100%', maxWidth: 400 }} />
          <Stack direction="row" spacing={6} sx={{ minWidth: 280 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: '1.15rem' }}>Total</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right', fontWeight: 700, fontSize: '1.15rem', color: 'primary.main' }}>
              {fmt(invoice.total)}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {invoice.notes && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Notes</Typography>
          <Typography variant="body2">{invoice.notes}</Typography>
        </Paper>
      )}

    </Box>
  );
}
