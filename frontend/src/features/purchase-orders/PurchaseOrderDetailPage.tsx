import { useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Divider, Grid, IconButton, Paper,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useGetPurchaseOrderQuery, useDeletePurchaseOrderMutation, useUpdatePurchaseOrderStatusMutation } from './purchaseOrderApi';
import { PO_STATUS_COLORS } from '../../utils/statusColors';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const BLUEPRINT: [number, number, number] = [14, 42, 71];
const ORANGE: [number, number, number] = [232, 93, 31];

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: po, isLoading } = useGetPurchaseOrderQuery(id ?? '', { skip: !id });
  const [deletePO] = useDeletePurchaseOrderMutation();
  const [updateStatus, { isLoading: updatingStatus }] = useUpdatePurchaseOrderStatusMutation();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deletePO(id).unwrap();
      dispatch(showSnackbar({ message: 'Purchase order deleted', severity: 'success' }));
      navigate('/purchase-orders');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete purchase order', severity: 'error' }));
    } finally {
      setDeleteOpen(false);
    }
  };

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
    if (!po) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(...BLUEPRINT);
    doc.rect(0, 0, W, 24, 'F');
    doc.setFillColor(...ORANGE);
    doc.rect(0, 24, W, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ConstructPro', 14, 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(154, 198, 232);
    doc.text('CONSTRUCTION ERP', 14, 16);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PURCHASE ORDER', W - 14, 11, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(154, 198, 232);
    doc.text(po.poNumber, W - 14, 18, { align: 'right' });

    let y = 34;
    doc.setFillColor(245, 242, 232);
    doc.rect(10, y - 2, W - 20, 26, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUEPRINT);
    doc.text(po.supplier?.name ?? '', 14, y + 4);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 113, 120);
    if (po.supplier?.companyName) doc.text(po.supplier.companyName, 14, y + 10);
    if (po.supplier?.phone) doc.text(po.supplier.phone, 14, y + 16);

    doc.setFontSize(8.5);
    doc.setTextColor(107, 113, 120);
    doc.text(`Issue Date: ${fmtDate(po.issueDate)}`, W - 14, y + 4, { align: 'right' });
    if (po.expectedDelivery) doc.text(`Expected Delivery: ${fmtDate(po.expectedDelivery)}`, W - 14, y + 10, { align: 'right' });
    doc.text(`Status: ${po.status}`, W - 14, y + 16, { align: 'right' });

    y += 34;

    const bodyRows = (po.items ?? []).map((item) => [
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
    doc.text(`Subtotal: ${fmt(po.subtotal)}`, W - 14, afterTableY, { align: 'right' });
    doc.text(`Tax: ${fmt(po.taxAmount)}`, W - 14, afterTableY + 6, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLUEPRINT);
    doc.text(`TOTAL: ${fmt(po.total)}`, W - 14, afterTableY + 14, { align: 'right' });

    if (po.notes) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 113, 120);
      doc.text(`Notes: ${po.notes}`, 14, afterTableY + 22);
    }

    const pages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const H = doc.internal.pageSize.getHeight();
      doc.setFillColor(...BLUEPRINT);
      doc.rect(0, H - 8, W, 8, 'F');
      doc.setFontSize(7);
      doc.setTextColor(154, 198, 232);
      doc.text('ConstructPro — Confidential', 14, H - 2.5);
      doc.text(`Page ${i} of ${pages}`, W - 14, H - 2.5, { align: 'right' });
    }

    doc.save(`PO_${po.poNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>
  );

  if (!po) return (
    <Box sx={{ mt: 4 }}><Typography>Purchase order not found.</Typography></Box>
  );

  const canMarkSent = po.status === 'Draft';
  const canMarkReceived = po.status === 'Sent';
  const canMarkCancelled = po.status !== 'Received' && po.status !== 'Cancelled';

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Purchase Orders', to: '/purchase-orders' }, { label: po.poNumber }]} />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <IconButton onClick={() => navigate('/purchase-orders')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{po.poNumber}</Typography>
        </Box>
        <Chip label={po.status} color={PO_STATUS_COLORS[po.status] ?? 'default'} />
        <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf} size="small">
          Export PDF
        </Button>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/purchase-orders/${id}/edit`)} size="small">
          Edit
        </Button>
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)} size="small">
          Delete
        </Button>
      </Stack>

      {(canMarkSent || canMarkReceived || canMarkCancelled) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Quick Actions</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {canMarkSent && (
              <Button size="small" variant="outlined" color="info" onClick={() => handleStatusUpdate('Sent')} disabled={updatingStatus}>
                Mark as Sent
              </Button>
            )}
            {canMarkReceived && (
              <Button size="small" variant="outlined" color="success" onClick={() => handleStatusUpdate('Received')} disabled={updatingStatus}>
                Mark as Received
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
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Supplier</Typography>
            <Typography sx={{ fontWeight: 700 }}>{po.supplier?.name ?? '—'}</Typography>
            {po.supplier?.companyName && <Typography variant="body2" color="text.secondary">{po.supplier.companyName}</Typography>}
            {po.supplier?.phone && <Typography variant="body2" color="text.secondary">{po.supplier.phone}</Typography>}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Details</Typography>
            <Stack spacing={0.5}>
              {po.project && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>Project:</Typography>
                  <Typography variant="body2">{po.project.name}</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>Issue Date:</Typography>
                <Typography variant="body2">{fmtDate(po.issueDate)}</Typography>
              </Stack>
              {po.expectedDelivery && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>Expected Delivery:</Typography>
                  <Typography variant="body2">{fmtDate(po.expectedDelivery)}</Typography>
                </Stack>
              )}
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
              {(po.items ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{fmt(item.unitPrice)}</TableCell>
                  <TableCell align="right">{fmt(item.total)}</TableCell>
                </TableRow>
              ))}
              {!po.items?.length && (
                <TableRow><TableCell colSpan={4} align="center">No items</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Stack sx={{ alignItems: 'flex-end' }} spacing={1}>
          <Stack direction="row" spacing={6} sx={{ minWidth: 280 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', color: 'text.secondary' }}>Subtotal</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right' }}>{fmt(po.subtotal)}</Typography>
          </Stack>
          <Stack direction="row" spacing={6} sx={{ minWidth: 280 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', color: 'text.secondary' }}>Tax</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right' }}>{fmt(po.taxAmount)}</Typography>
          </Stack>
          <Divider sx={{ width: '100%', maxWidth: 400 }} />
          <Stack direction="row" spacing={6} sx={{ minWidth: 280 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: '1.15rem' }}>Total</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right', fontWeight: 700, fontSize: '1.15rem', color: 'primary.main' }}>
              {fmt(po.total)}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {po.notes && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Notes</Typography>
          <Typography variant="body2">{po.notes}</Typography>
        </Paper>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
