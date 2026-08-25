import { useState } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGate from '../../components/common/PermissionGate';
import { Perms } from '../../utils/permissions';
import { useGetPlantByIdQuery, useGetPlantMaintenanceHistoryQuery, useAddPlantMaintenanceMutation, useDeletePlantMaintenanceMutation } from './plantApi';
import { fmtAmount } from '../../utils/formatNumber';

const fmt = fmtAmount;

export default function PlantMaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [notes, setNotes] = useState('');

  const { data: plant, isLoading: plantLoading } = useGetPlantByIdQuery(id ?? '', { skip: !id });
  const { data: history, isLoading: histLoading } = useGetPlantMaintenanceHistoryQuery(id ?? '', { skip: !id });
  const [addMaintenance, { isLoading: adding }] = useAddPlantMaintenanceMutation();
  const [deleteMaintenance] = useDeletePlantMaintenanceMutation();

  const resetForm = () => {
    setDescription('');
    setCost('');
    setServiceProvider('');
    setNextDate('');
    setNotes('');
    setMaintenanceDate(new Date().toISOString().split('T')[0]);
  };

  const handleAdd = async () => {
    if (!id) return;
    try {
      await addMaintenance({
        id,
        data: {
          maintenanceDate,
          description: description || undefined,
          cost: cost ? parseFloat(cost) : undefined,
          serviceProvider: serviceProvider || undefined,
          nextMaintenanceDate: nextDate || undefined,
          notes: notes || undefined,
        },
      }).unwrap();
      dispatch(showSnackbar({ message: 'Maintenance record added', severity: 'success' }));
      setOpen(false);
      resetForm();
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add maintenance record', severity: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!id || !deleteId) return;
    try {
      await deleteMaintenance({ plantId: id, recordId: deleteId }).unwrap();
      dispatch(showSnackbar({ message: 'Maintenance record deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete record', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  if (plantLoading) return <Loader />;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Plant & Equipment', to: '/plants' }, { label: plant?.name ?? '…' }, { label: 'Maintenance' }]} />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <Tooltip title="Back to Plants">
          <IconButton onClick={() => navigate('/plants')} aria-label="Back to Plants">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{plant?.name} — Maintenance</Typography>
          <Typography variant="body2" color="text.secondary">
            {plant?.type ?? ''}{plant?.manufacturer ? ` | ${plant.manufacturer}` : ''} | Status: {plant?.statusDisplay}
          </Typography>
        </Box>
        <PermissionGate permission={Perms.Plants.Edit}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Add Maintenance
          </Button>
        </PermissionGate>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        {histLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Service Provider</TableCell>
                <TableCell>Next Maintenance</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history?.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(row.maintenanceDate).toLocaleDateString()}</TableCell>
                  <TableCell>{row.description ?? '-'}</TableCell>
                  <TableCell align="right">{fmt(row.cost)}</TableCell>
                  <TableCell>{row.serviceProvider ?? '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {row.nextMaintenanceDate ? new Date(row.nextMaintenanceDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{row.notes ?? '-'}</TableCell>
                  <TableCell align="right">
                    <PermissionGate permission={Perms.Plants.Edit}>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
              {!history?.length && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No maintenance records</TableCell>
                </TableRow>
              )}
              {(history?.length ?? 0) > 0 && (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total Maintenance Cost</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {fmt(history?.reduce((sum, r) => sum + r.cost, 0) ?? 0)}
                  </TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={() => { setOpen(false); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Maintenance Record</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={maintenanceDate}
              onChange={(e) => setMaintenanceDate(e.target.value)}
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Cost"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
              />
              <TextField
                label="Service Provider"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Next Maintenance Date"
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!maintenanceDate || adding}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Maintenance Record"
        message="Are you sure you want to delete this maintenance record?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
