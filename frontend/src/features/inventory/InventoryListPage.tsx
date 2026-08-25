import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetInventoryItemsQuery, useDeleteInventoryItemMutation } from './inventoryApi';
import TableSkeleton from '../../components/common/TableSkeleton';
import { fmtAmountOrDash, fmtNum as fmtNumUtil } from '../../utils/formatNumber';

const fmt = fmtAmountOrDash;
const fmtNum = (n?: number) => n != null ? fmtNumUtil(n) : '0';

const exportCSV = (rows: { code?: string; name: string; category?: string; unit?: string; currentStock: number; lowStockThreshold: number; unitPrice?: number; supplierName?: string; location?: string }[]) => {
  const header = ['Code', 'Name', 'Category', 'Unit', 'Current Stock', 'Low Stock Threshold', 'Unit Price', 'Supplier', 'Storage Location'];
  const csvRows = rows.map((r) => [
    r.code ?? '',
    r.name,
    r.category ?? '',
    r.unit ?? '',
    r.currentStock,
    r.lowStockThreshold,
    r.unitPrice ?? '',
    r.supplierName ?? '',
    r.location ?? '',
  ]);
  const content = [header, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory.csv';
  a.click();
  URL.revokeObjectURL(url);
};

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

  const items = data?.items ?? [];
  const lowStockCount = items.filter((r) => r.currentStock <= r.lowStockThreshold).length;
  const totalValue = items.reduce((sum, r) => sum + r.currentStock * (r.unitPrice ?? 0), 0);

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
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => exportCSV(items)}>
            Export CSV
          </Button>
          <PermissionGate permission={Perms.Inventory.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/inventory/new')}>Add Item</Button>
          </PermissionGate>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <Typography variant="caption" color="text.secondary">Total Items</Typography>
            <Typography variant="h4">{data?.totalCount ?? 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <Typography variant="caption" color="text.secondary">Low Stock</Typography>
            <Typography variant="h4">{lowStockCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
            <Typography variant="caption" color="text.secondary">Total Value</Typography>
            <Typography variant="h4">PKR {fmtNum(totalValue)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField label="Search by code / name" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 240 } }} />
          <TextField label="Category" size="small" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }} onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}>
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
              <TableCell>Code</TableCell>
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
            {isLoading ? <TableSkeleton cols={9} /> : (
              <>
                {items.map((row) => (
                  <TableRow
                    key={row.id}
                    hover={!(row.currentStock <= row.lowStockThreshold)}
                    sx={row.currentStock <= row.lowStockThreshold ? { bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.light' } } : undefined}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
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
                {!items.length && <TableRow><TableCell colSpan={9} align="center">No items found</TableCell></TableRow>}
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
