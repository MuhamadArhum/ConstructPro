import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
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
import { useGetMachineriesQuery, useDeleteMachineryMutation, useGetMaintenanceDueQuery } from './machineryApi';
import TableSkeleton from '../../components/common/TableSkeleton';
import type { MachineryStatus } from '../../types/machinery.types';

const statusColor: Record<MachineryStatus, 'success' | 'warning' | 'default'> = {
  Active: 'success',
  UnderMaintenance: 'warning',
  Retired: 'default',
};

const statusLabel: Record<MachineryStatus, string> = {
  Active: 'Active',
  UnderMaintenance: 'Under Maintenance',
  Retired: 'Retired',
};

const isDue = (date?: string | null) => (date ? new Date(date) < new Date() : false);

export default function MachineryListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetMachineriesQuery({
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    status: status || undefined,
  });
  const { data: maintenanceDue } = useGetMaintenanceDueQuery();
  const [deleteMachinery] = useDeleteMachineryMutation();

  const totalCount = data?.totalCount ?? 0;
  const activeCount = data?.items.filter((m) => m.status === 'Active').length ?? 0;
  const maintenanceDueCount = maintenanceDue?.length ?? 0;

  const exportCSV = () => {
    if (!data?.items.length) return;
    const headers = ['Code', 'Name', 'Model', 'Serial No.', 'Status', 'Running Hours', 'Next Maintenance'];
    const rows = data.items.map((r) => [
      r.code ?? '',
      r.name,
      r.model ?? '',
      r.serialNumber ?? '',
      statusLabel[r.status],
      r.totalRunningHours.toString(),
      r.nextMaintenanceDate ? new Date(r.nextMaintenanceDate).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'machinery.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMachinery(deleteId).unwrap();
      dispatch(showSnackbar({ message: 'Machinery deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete machinery', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Machinery</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV} disabled={!data?.items.length}>
            Export CSV
          </Button>
          <PermissionGate permission={Perms.Machinery.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/machinery/new')}>
              Add Machinery
            </Button>
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
          <TextField
            label="Search by code, name, model, serial number"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 280 } }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 180 } }}>
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
              <TableCell>Name</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Serial No.</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Running Hours</TableCell>
              <TableCell>Next Maintenance</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={8} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={isDue(row.nextMaintenanceDate) ? { bgcolor: 'warning.light', '&:hover': { bgcolor: 'warning.light' } } : {}}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell>{row.model ?? '-'}</TableCell>
                    <TableCell>{row.serialNumber ?? '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabel[row.status]}
                        color={statusColor[row.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">{row.totalRunningHours.toLocaleString()} hrs</TableCell>
                    <TableCell
                      sx={{ color: row.isMaintenanceDue ? 'error.main' : 'text.primary', fontWeight: row.isMaintenanceDue ? 600 : 400 }}
                    >
                      {row.nextMaintenanceDate ? new Date(row.nextMaintenanceDate).toLocaleDateString() : '-'}
                      {row.isMaintenanceDue && ' ⚠'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Maintenance History">
                        <IconButton size="small" color="primary" onClick={() => navigate(`/machinery/${row.id}/maintenance`)}>
                          <BuildIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <PermissionGate permission={Perms.Machinery.Edit}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/machinery/${row.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission={Perms.Machinery.Delete}>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No machinery found</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.totalCount ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Machinery"
        message="Are you sure you want to delete this machinery record?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
