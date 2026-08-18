import { useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TableSkeleton from '../../components/common/TableSkeleton';
import { useGetPurchaseOrdersQuery, useDeletePurchaseOrderMutation, useUpdatePurchaseOrderStatusMutation } from './purchaseOrderApi';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const STATUS_OPTIONS = ['Draft', 'Sent', 'Received', 'Cancelled'];

const statusColor = (s: string): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  if (s === 'Sent') return 'info';
  if (s === 'Received') return 'success';
  if (s === 'Cancelled') return 'error';
  return 'default';
};

const isOverdue = (date?: string | null, status?: string) =>
  date && status !== 'Received' && status !== 'Cancelled' ? new Date(date) < new Date() : false;

const exportCSV = (rows: { poNumber: string; supplier?: { name: string } | null; project?: { name: string } | null; issueDate: string; expectedDelivery?: string | null; total: number; status: string }[]) => {
  const header = ['PO Number', 'Supplier', 'Project', 'Issue Date', 'Expected Delivery', 'Total Amount', 'Status'];
  const csvRows = rows.map((r) => [
    r.poNumber,
    r.supplier?.name ?? '',
    r.project?.name ?? '',
    fmtDate(r.issueDate),
    r.expectedDelivery ? fmtDate(r.expectedDelivery) : '',
    r.total ?? 0,
    r.status,
  ]);
  const content = [header, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'purchase-orders.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function PurchaseOrderListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetPurchaseOrdersQuery({ page: page + 1, pageSize: rowsPerPage, status: status || undefined, search: search || undefined });
  const [deletePO] = useDeletePurchaseOrderMutation();
  const [updateStatus] = useUpdatePurchaseOrderStatusMutation();

  const items = data?.data ?? [];
  const pending = items.filter((r) => r.status === 'Draft' || r.status === 'Sent').length;
  const totalAmount = items.reduce((sum, r) => sum + (r.total ?? 0), 0);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePO(deleteId).unwrap();
      dispatch(showSnackbar({ message: 'Purchase order deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete purchase order', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      dispatch(showSnackbar({ message: 'Status updated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update status', severity: 'error' }));
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">PURCHASE ORDERS</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCSV(items)}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/purchase-orders/new')}>
            New PO
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <Typography variant="caption" color="text.secondary">Total POs</Typography>
            <Typography variant="h4">{data?.total ?? 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <Typography variant="caption" color="text.secondary">Pending</Typography>
            <Typography variant="h4">{pending}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
            <Typography variant="caption" color="text.secondary">Total Amount</Typography>
            <Typography variant="h4">PKR {totalAmount.toLocaleString()}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0); } }}
            onBlur={() => { setSearch(searchInput); setPage(0); }}
            sx={{ minWidth: { sm: 250 } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>PO #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Expected Delivery</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={8} /> : (
              <>
                {items.map((row) => (
                  <TableRow
                    key={row.id}
                    hover={!isOverdue(row.expectedDelivery, row.status)}
                    sx={isOverdue(row.expectedDelivery, row.status) ? { bgcolor: 'error.light', '&:hover': { bgcolor: 'error.light' } } : undefined}
                  >
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/purchase-orders/${row.id}`)}
                      >
                        {row.poNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.supplier?.name ?? '—'}</TableCell>
                    <TableCell>{row.project?.name ?? '—'}</TableCell>
                    <TableCell>{fmtDate(row.issueDate)}</TableCell>
                    <TableCell>{row.expectedDelivery ? fmtDate(row.expectedDelivery) : '—'}</TableCell>
                    <TableCell align="right">{fmt(row.total)}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={statusColor(row.status)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/purchase-orders/${row.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <FormControl size="small" sx={{ ml: 1, minWidth: 110 }}>
                        <Select
                          value={row.status}
                          onChange={(e) => handleStatusChange(row.id, e.target.value)}
                          variant="outlined"
                          sx={{ fontSize: '12px', height: 28 }}
                        >
                          {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s} sx={{ fontSize: '12px' }}>{s}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)} sx={{ ml: 0.5 }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow><TableCell colSpan={8} align="center">No purchase orders found</TableCell></TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
