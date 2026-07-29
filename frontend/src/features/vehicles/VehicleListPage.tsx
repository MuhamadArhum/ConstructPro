import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BuildIcon from '@mui/icons-material/Build';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetVehiclesQuery, useDeleteVehicleMutation } from './vehicleApi';
import type { VehicleStatus } from '../../types/vehicle.types';
import TableSkeleton from '../../components/common/TableSkeleton';

const statusColors: Record<VehicleStatus, 'success' | 'warning' | 'error'> = {
  Active: 'success', UnderMaintenance: 'warning', Retired: 'error',
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
        <PermissionGate permission={Perms.Vehicles.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vehicles/new')}>Add Vehicle</Button>
        </PermissionGate>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
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
              <TableCell>Reg. No.</TableCell>
              <TableCell>Make / Model</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Mileage (km)</TableCell>
              <TableCell>Next Maintenance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={7} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.registrationNumber}</TableCell>
                    <TableCell>{row.make} {row.model ?? ''} {row.year ? `(${row.year})` : ''}</TableCell>
                    <TableCell>{row.driverName ?? '-'}</TableCell>
                    <TableCell>{row.totalMileage.toLocaleString()}</TableCell>
                    <TableCell>{row.nextMaintenanceDate ? new Date(row.nextMaintenanceDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><Chip label={row.statusDisplay} color={statusColors[row.status]} size="small" /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Maintenance"><IconButton size="small" onClick={() => navigate(`/vehicles/${row.id}/maintenance`)}><BuildIcon fontSize="small" /></IconButton></Tooltip>
                      <PermissionGate permission={Perms.Vehicles.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/vehicles/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      <PermissionGate permission={Perms.Vehicles.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={7} align="center">No vehicles found</TableCell></TableRow>}
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
