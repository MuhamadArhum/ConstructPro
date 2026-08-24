import { useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TableSkeleton from '../../components/common/TableSkeleton';
import { useGetInvoicesQuery, useUpdateInvoiceStatusMutation } from './invoiceApi';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

const STATUS_OPTIONS = ['Draft', 'Sent', 'Paid', 'Cancelled'];

const statusColor = (s: string): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  if (s === 'Sent') return 'info';
  if (s === 'Paid') return 'success';
  if (s === 'Cancelled') return 'warning';
  return 'default';
};

const exportCSV = (rows: { invoiceNumber: string; customer?: { name: string } | null; project?: { name: string } | null; issueDate: string; dueDate: string; total: number; status: string }[]) => {
  const header = ['Invoice Number', 'Customer', 'Project', 'Issue Date', 'Due Date', 'Total Amount', 'Status'];
  const csvRows = rows.map((r) => [
    r.invoiceNumber,
    r.customer?.name ?? '',
    r.project?.name ?? '',
    fmtDate(r.issueDate),
    fmtDate(r.dueDate),
    r.total ?? 0,
    r.status,
  ]);
  const content = [header, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoices.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [pendingStatus, setPendingStatus] = useState<{ id: string; status: string } | null>(null);

  const { data, isLoading } = useGetInvoicesQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    status: status || undefined,
    search: search || undefined,
  });
  const [updateStatus] = useUpdateInvoiceStatusMutation();

  const items = data?.data ?? [];
  const unpaid = items.filter((r) => r.status !== 'Paid' && r.status !== 'Cancelled').length;
  const cancelled = items.filter((r) => r.status === 'Cancelled').length;

  const handleStatusChange = (id: string, newStatus: string) => {
    if (newStatus === 'Paid' || newStatus === 'Cancelled') {
      setPendingStatus({ id, status: newStatus });
    } else {
      confirmStatusChange(id, newStatus);
    }
  };

  const confirmStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus }).unwrap();
      dispatch(showSnackbar({ message: 'Status updated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update status', severity: 'error' }));
    } finally {
      setPendingStatus(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">INVOICES</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCSV(items)}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/new')}>
            New Invoice
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <Typography variant="caption" color="text.secondary">Total Invoices</Typography>
            <Typography variant="h4">{data?.total ?? 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <Typography variant="caption" color="text.secondary">Unpaid</Typography>
            <Typography variant="h4">{unpaid}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'text.disabled' }}>
            <Typography variant="caption" color="text.secondary">Cancelled</Typography>
            <Typography variant="h4">{cancelled}</Typography>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setSearch(searchInput); setPage(0); }
            }}
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
              <TableCell>Invoice #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={8} /> : (
              <>
                {items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 600, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/invoices/${row.id}`)}
                      >
                        {row.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.customer?.name ?? '—'}</TableCell>
                    <TableCell>{row.project?.name ?? '—'}</TableCell>
                    <TableCell>{fmtDate(row.issueDate)}</TableCell>
                    <TableCell>{fmtDate(row.dueDate)}</TableCell>
                    <TableCell align="right">{fmt(row.total)}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={statusColor(row.status)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/invoices/${row.id}`)}>
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
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow><TableCell colSpan={8} align="center">No invoices found</TableCell></TableRow>
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
        open={Boolean(pendingStatus)}
        title={`Mark as ${pendingStatus?.status}`}
        message={
          pendingStatus?.status === 'Paid'
            ? 'Marking this invoice as Paid will update the customer balance and cannot be changed back without manual correction.'
            : 'Marking this invoice as Cancelled will remove it from active billing. Are you sure?'
        }
        confirmLabel={`Mark ${pendingStatus?.status}`}
        destructive={pendingStatus?.status === 'Cancelled'}
        onConfirm={() => pendingStatus && confirmStatusChange(pendingStatus.id, pendingStatus.status)}
        onCancel={() => setPendingStatus(null)}
      />
    </Box>
  );
}
