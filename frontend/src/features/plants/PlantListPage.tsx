import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetPlantsQuery, useDeletePlantMutation } from './plantApi';
import type { PlantStatus } from '../../types/plant.types';
import TableSkeleton from '../../components/common/TableSkeleton';

const statusColors: Record<PlantStatus, 'success' | 'warning' | 'error'> = { Active: 'success', UnderMaintenance: 'warning', Disposed: 'error' };
const fmt = (n?: number) => n != null ? `PKR ${n.toLocaleString()}` : '-';

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
        <PermissionGate permission={Perms.Plants.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/plants/new')}>Add Plant</Button>
        </PermissionGate>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search by code / name" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 240 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="UnderMaintenance">Under Maintenance</MenuItem>
              <MenuItem value="Disposed">Disposed</MenuItem>
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
                    <TableCell>{row.type ?? '-'}</TableCell>
                    <TableCell>{row.manufacturer ?? '-'}</TableCell>
                    <TableCell>{row.location ?? '-'}</TableCell>
                    <TableCell>{fmt(row.purchasePrice)}</TableCell>
                    <TableCell>{fmt(row.currentValue)}</TableCell>
                    <TableCell><Chip label={row.statusDisplay} color={statusColors[row.status]} size="small" /></TableCell>
                    <TableCell align="right">
                      <PermissionGate permission={Perms.Plants.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/plants/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      <PermissionGate permission={Perms.Plants.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={9} align="center">No records found</TableCell></TableRow>}
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
