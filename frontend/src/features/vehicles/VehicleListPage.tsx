import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetVehiclesQuery, useDeleteVehicleMutation } from './vehicleApi';
import type { VehicleStatus } from '../../types/vehicle.types';
import TableSkeleton from '../../components/common/TableSkeleton';
import { fmtNum } from '../../utils/formatNumber';

const statusColors: Record<VehicleStatus, 'success' | 'warning' | 'error'> = {
  Active: 'success', UnderMaintenance: 'warning', Retired: 'error',
};

const isDue = (date?: string | null) => (date ? new Date(date) < new Date() : false);

const getExpiryStatus = (insuranceExpiry?: string | null, tokenExpiry?: string | null): 'expired' | 'expiring' | null => {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);

  const dates = [insuranceExpiry, tokenExpiry].filter(Boolean) as string[];
  if (dates.length === 0) return null;

  const parsed = dates.map((d) => new Date(d));
  if (parsed.some((d) => d < now)) return 'expired';
  if (parsed.some((d) => d < soon)) return 'expiring';
  return null;
};

export default function VehicleListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetVehiclesQuery({ pageNumber: page + 1, pageSize: rowsPerPage, search: search || undefined, status: status || undefined });
  const [deleteVehicle] = useDeleteVehicleMutation();

  const totalCount = data?.totalCount ?? 0;
  const activeCount = data?.items.filter((v) => v.status === 'Active').length ?? 0;
  const maintenanceDueCount = data?.items.filter((v) => isDue(v.nextMaintenanceDate)).length ?? 0;

  const exportCSV = () => {
    if (!data?.items.length) return;
    const headers = ['Code', 'Reg. No.', 'Make', 'Model', 'Year', 'Driver', 'Mileage (km)', 'Status', 'Next Maintenance'];
    const rows = data.items.map((r) => [
      r.code ?? '',
      r.registrationNumber,
      r.make,
      r.model ?? '',
      r.year?.toString() ?? '',
      r.driverName ?? '',
      r.totalMileage.toString(),
      r.statusDisplay,
      r.nextMaintenanceDate ? new Date(r.nextMaintenanceDate).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicles.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteVehicle(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Vehicle deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete vehicle', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Vehicles</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV} disabled={!data?.items.length}>
            Export CSV
          </Button>
          <PermissionGate permission={Perms.Vehicles.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vehicles/new')}>Add Vehicle</Button>
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
              <MenuItem value="UnderMaintenance">Under Maintenance</MenuItem>
              <MenuItem value="Retired">Retired</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Reg. No.</TableCell>
              <TableCell>Make / Model</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Mileage (km)</TableCell>
              <TableCell>Next Maintenance</TableCell>
              <TableCell>Expiry Status</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={9} /> : (
              <>
                {data?.items.map((row) => {
                  const expiryStatus = getExpiryStatus(
                    ((row as unknown) as Record<string, unknown>)['insuranceExpiry'] as string | null | undefined,
                    ((row as unknown) as Record<string, unknown>)['tokenExpiry'] as string | null | undefined,
                  );
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={isDue(row.nextMaintenanceDate) ? { bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.light' } } : {}}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.registrationNumber}</TableCell>
                      <TableCell>{row.make} {row.model ?? ''} {row.year ? `(${row.year})` : ''}</TableCell>
                      <TableCell>{row.driverName ?? '-'}</TableCell>
                      <TableCell>{fmtNum(row.totalMileage)}</TableCell>
                      <TableCell>{row.nextMaintenanceDate ? new Date(row.nextMaintenanceDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        {expiryStatus === 'expired' && <Chip label="Expired" color="error" size="small" />}
                        {expiryStatus === 'expiring' && <Chip label="Expiring Soon" color="warning" size="small" />}
                      </TableCell>
                      <TableCell><Chip label={row.statusDisplay} color={statusColors[row.status]} size="small" /></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Maintenance"><IconButton size="small" onClick={() => navigate(`/vehicles/${row.id}/maintenance`)}><BuildIcon fontSize="small" /></IconButton></Tooltip>
                        <PermissionGate permission={Perms.Vehicles.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/vehicles/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                        <PermissionGate permission={Perms.Vehicles.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data?.items.length && <TableRow><TableCell colSpan={9} align="center">No vehicles found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>

      <ConfirmDialog open={Boolean(deleteId)} title="Delete Vehicle" message="Are you sure you want to delete this vehicle?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
