import { useState } from 'react';
import { Box, Button, Card, CardContent, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetCustomersQuery, useDeleteCustomerMutation } from './customerApi';
import TableSkeleton from '../../components/common/TableSkeleton';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function CustomerListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetCustomersQuery({ pageNumber: page + 1, pageSize: rowsPerPage, search: search || undefined, isActive: isActive === '' ? undefined : isActive === 'true' });
  const [deleteCustomer] = useDeleteCustomerMutation();

  const totalOutstanding = data?.items.reduce((sum, c) => sum + c.outstandingBalance, 0) ?? 0;

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteCustomer(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Customer deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Customers</Typography>
        <PermissionGate permission={Perms.Customers.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/customers/new')}>Add Customer</Button>
        </PermissionGate>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}><Card variant="outlined"><CardContent><Typography variant="body2" color="text.secondary">Total Customers</Typography><Typography variant="h5" sx={{ fontWeight: 700 }}>{data?.totalCount ?? 0}</Typography></CardContent></Card></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><Card variant="outlined"><CardContent><Typography variant="body2" color="text.secondary">Total Outstanding</Typography><Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>{fmt(totalOutstanding)}</Typography></CardContent></Card></Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 250 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 140 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Project</TableCell>
              <TableCell align="right">Total Billed</TableCell>
              <TableCell align="right">Outstanding</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={8} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{row.companyName ?? '-'}</TableCell>
                    <TableCell>{row.phone ?? '-'}</TableCell>
                    <TableCell>{row.projectName ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(row.totalBilled)}</TableCell>
                    <TableCell align="right" sx={{ color: row.outstandingBalance > 0 ? 'warning.main' : 'success.main', fontWeight: 600 }}>{fmt(row.outstandingBalance)}</TableCell>
                    <TableCell><Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ledger"><IconButton size="small" onClick={() => navigate(`/customers/${row.id}/ledger`)}><ReceiptLongIcon fontSize="small" /></IconButton></Tooltip>
                      <PermissionGate permission={Perms.Customers.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/customers/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      <PermissionGate permission={Perms.Customers.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={8} align="center">No customers found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Customer" message="Are you sure?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
