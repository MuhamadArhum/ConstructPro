import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetInventoryItemsQuery, useDeleteInventoryItemMutation } from './inventoryApi';
import TableSkeleton from '../../components/common/TableSkeleton';

const fmt = (n?: number) => n != null ? `PKR ${n.toLocaleString()}` : '-';

export default function InventoryListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetInventoryItemsQuery({ pageNumber: page + 1, pageSize: rowsPerPage, search: search || undefined, category: category || undefined, lowStock: lowStockOnly || undefined });
  const [deleteItem] = useDeleteInventoryItemMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteItem(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Item deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Inventory / Supplies</Typography>
        <PermissionGate permission={Perms.Inventory.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/inventory/new')}>Add Item</Button>
        </PermissionGate>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField label="Search" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} />
          <TextField label="Category" size="small" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }} sx={{ minWidth: 160 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Stock</InputLabel>
            <Select label="Stock" value={lowStockOnly ? 'low' : ''} onChange={(e) => { setLowStockOnly(e.target.value === 'low'); setPage(0); }}>
              <MenuItem value="">All Items</MenuItem>
              <MenuItem value="low">Low Stock Only</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Stock Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={8} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{row.category ?? '-'}</TableCell>
                    <TableCell>{row.unit ?? '-'}</TableCell>
                    <TableCell align="right">{row.currentStock}</TableCell>
                    <TableCell align="right">{fmt(row.unitPrice)}</TableCell>
                    <TableCell>{row.supplierName ?? '-'}</TableCell>
                    <TableCell><Chip label={row.isLowStock ? 'Low Stock' : 'OK'} color={row.isLowStock ? 'error' : 'success'} size="small" /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Stock Transactions"><IconButton size="small" onClick={() => navigate(`/inventory/${row.id}/transactions`)}><SwapVertIcon fontSize="small" /></IconButton></Tooltip>
                      <PermissionGate permission={Perms.Inventory.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/inventory/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      <PermissionGate permission={Perms.Inventory.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={8} align="center">No items found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Item" message="Are you sure?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
