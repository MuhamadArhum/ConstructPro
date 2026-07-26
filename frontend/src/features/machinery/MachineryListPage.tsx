import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
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
import { useGetMachineriesQuery, useDeleteMachineryMutation, useGetMaintenanceDueQuery } from './machineryApi';
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

  const activeCount = data?.items.filter((m) => m.status === 'Active').length ?? 0;
  const underMaintenanceCount = data?.items.filter((m) => m.status === 'UnderMaintenance').length ?? 0;

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
        <PermissionGate permission={Perms.Machinery.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/machinery/new')}>
            Add Machinery
          </Button>
        </PermissionGate>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Active', value: activeCount, color: 'success.main' },
          { label: 'Under Maintenance', value: underMaintenanceCount, color: 'warning.main' },
          { label: 'Maintenance Due', value: maintenanceDue?.length ?? 0, color: (maintenanceDue?.length ?? 0) > 0 ? 'error.main' : 'text.secondary' },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search by name, model, serial number"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
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
              {data?.items.map((row) => (
                <TableRow key={row.id} hover>
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
                  <TableCell colSpan={7} align="center">No machinery found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
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
