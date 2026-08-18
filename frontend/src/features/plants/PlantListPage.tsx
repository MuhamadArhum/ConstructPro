import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/BuildOutlined';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetPlantsQuery, useDeletePlantMutation } from './plantApi';
import type { PlantStatus } from '../../types/plant.types';
import TableSkeleton from '../../components/common/TableSkeleton';

const statusColors: Record<PlantStatus, 'success' | 'warning' | 'error' | 'default'> = { Active: 'success', Inactive: 'default', Maintenance: 'warning', Retired: 'error' };
const fmt = (n?: number) => n != null ? `PKR ${n.toLocaleString()}` : '-';

const isDue = (date?: string | null) => (date ? new Date(date) < new Date() : false);

const getDepreciation = (purchasePrice?: number, currentValue?: number): { pct: string; color: 'error.main' | 'warning.main' | 'success.main' } | null => {
  if (!purchasePrice || purchasePrice <= 0) return null;
  const pctNum = ((purchasePrice - (currentValue ?? 0)) / purchasePrice) * 100;
  const pct = pctNum.toFixed(1) + '%';
  const color = pctNum > 50 ? 'error.main' : pctNum > 25 ? 'warning.main' : 'success.main';
  return { pct, color };
};

export default function PlantListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetPlantsQuery({ pageNumber: page + 1, pageSize: rowsPerPage, search: search || undefined, status: status || undefined });
  const [deletePlant] = useDeletePlantMutation();

  const totalCount = data?.totalCount ?? 0;
  const activeCount = data?.items.filter((p) => p.status === 'Active').length ?? 0;
  const maintenanceDueCount = data?.items.filter((p) => isDue(p.nextMaintenanceDate)).length ?? 0;

  const exportCSV = () => {
    if (!data?.items.length) return;
    const headers = ['Code', 'Name', 'Type', 'Manufacturer', 'Location', 'Purchase Price', 'Current Value', 'Status', 'Next Maintenance', 'Depreciation'];
    const rows = data.items.map((r) => {
      const dep = getDepreciation(r.purchasePrice, r.currentValue);
      return [
        r.code ?? '',
        r.name,
        r.type ?? '',
        r.manufacturer ?? '',
        r.location ?? '',
        r.purchasePrice?.toString() ?? '',
        r.currentValue?.toString() ?? '',
        r.statusDisplay,
        r.nextMaintenanceDate ? new Date(r.nextMaintenanceDate).toLocaleDateString() : '',
        dep?.pct ?? '',
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deletePlant(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Plant deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Plant & Equipment</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV} disabled={!data?.items.length}>
            Export CSV
          </Button>
          <PermissionGate permission={Perms.Plants.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/plants/new')}>Add Plant</Button>
          </PermissionGate>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="h4">{totalCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
            <Typography variant="caption" color="text.secondary">Active</Typography>
            <Typography variant="h4" sx={{ color: 'success.main' }}>{activeCount}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderLeft: '4px solid', borderColor: maintenanceDueCount > 0 ? 'error.main' : 'text.secondary' }}>
            <Typography variant="caption" color="text.secondary">Maintenance Due</Typography>
            <Typography variant="h4" sx={{ color: maintenanceDueCount > 0 ? 'error.main' : 'text.primary' }}>{maintenanceDueCount}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search by code / name" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 240 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Maintenance">Under Maintenance</MenuItem>
              <MenuItem value="Retired">Retired / Disposed</MenuItem>
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
              <TableCell>Type</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Purchase Price</TableCell>
              <TableCell>Current Value</TableCell>
              <TableCell>Depreciation</TableCell>
              <TableCell>Next Maintenance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={11} /> : (
              <>
                {data?.items.map((row) => {
                  const dep = getDepreciation(row.purchasePrice, row.currentValue);
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={isDue(row.nextMaintenanceDate) ? { bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.light' } } : {}}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                      <TableCell>{row.type ?? '-'}</TableCell>
                      <TableCell>{row.manufacturer ?? '-'}</TableCell>
                      <TableCell>{row.location ?? '-'}</TableCell>
                      <TableCell>{fmt(row.purchasePrice)}</TableCell>
                      <TableCell>{fmt(row.currentValue)}</TableCell>
                      <TableCell>
                        {dep ? (
                          <Typography variant="body2" sx={{ color: dep.color, fontWeight: 600 }}>
                            {dep.pct}
                          </Typography>
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.nextMaintenanceDate ? new Date(row.nextMaintenanceDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell><Chip label={row.statusDisplay} color={statusColors[row.status]} size="small" /></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Maintenance History"><IconButton size="small" onClick={() => navigate(`/plants/${row.id}/maintenance`)}><BuildIcon fontSize="small" /></IconButton></Tooltip>
                        <PermissionGate permission={Perms.Plants.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/plants/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                        <PermissionGate permission={Perms.Plants.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data?.items.length && <TableRow><TableCell colSpan={11} align="center">No records found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Plant" message="Are you sure?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
