import { useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
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

export default function PurchaseOrderListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetPurchaseOrdersQuery({ page: page + 1, pageSize: rowsPerPage, status: status || undefined });
  const [deletePO] = useDeletePurchaseOrderMutation();
  const [updateStatus] = useUpdatePurchaseOrderStatusMutation();

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
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/purchase-orders/new')}>
          New PO
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); } }}
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
                {data?.data.map((row) => (
                  <TableRow key={row.id} hover>
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
                {!data?.data.length && (
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
          rowsPerPageOptions={[20]}
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
