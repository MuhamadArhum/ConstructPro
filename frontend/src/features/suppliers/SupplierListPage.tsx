import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
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
import { useGetSuppliersQuery, useDeleteSupplierMutation } from './supplierApi';
import TableSkeleton from '../../components/common/TableSkeleton';
import { fmtAmount } from '../../utils/formatNumber';

const fmt = fmtAmount;

export default function SupplierListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetSuppliersQuery({ pageNumber: page + 1, pageSize: rowsPerPage, search: search || undefined, isActive: isActive === '' ? undefined : isActive === 'true' });
  const [deleteSupplier] = useDeleteSupplierMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteSupplier(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Supplier deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Suppliers</Typography>
        <PermissionGate permission={Perms.Suppliers.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/suppliers/new')}>Add Supplier</Button>
        </PermissionGate>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search by code / name" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 260 } }} />
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
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Total Purchased</TableCell>
              <TableCell align="right">Outstanding</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={9} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{row.companyName ?? '-'}</TableCell>
                    <TableCell>{row.category ?? '-'}</TableCell>
                    <TableCell>{row.phone ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(row.totalPurchased)}</TableCell>
                    <TableCell align="right" sx={{ color: (row.outstandingBalance ?? 0) > 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>{fmt(row.outstandingBalance)}</TableCell>
                    <TableCell><Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ledger"><IconButton size="small" onClick={() => navigate(`/suppliers/${row.id}/ledger`)}><ReceiptLongIcon fontSize="small" /></IconButton></Tooltip>
                      <PermissionGate permission={Perms.Suppliers.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/suppliers/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      <PermissionGate permission={Perms.Suppliers.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={9} align="center">No suppliers found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Supplier" message="Are you sure?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
