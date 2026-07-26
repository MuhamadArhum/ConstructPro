import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useGetVehicleByIdQuery, useGetVehicleMaintenanceQuery, useAddVehicleMaintenanceMutation } from './vehicleApi';
import Loader from '../../components/common/Loader';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function VehicleMaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: vehicle, isLoading: loadingVehicle } = useGetVehicleByIdQuery(id ?? '', { skip: !id });
  const { data: records, isLoading: loadingRecords } = useGetVehicleMaintenanceQuery(id ?? '', { skip: !id });
  const [addMaintenance, { isLoading: isAdding }] = useAddVehicleMaintenanceMutation();

  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addMaintenance({ id: id!, data: { maintenanceDate, description, cost: parseFloat(cost), serviceProvider: serviceProvider || undefined, nextDueDate: nextDueDate || undefined } }).unwrap();
      dispatch(showSnackbar({ message: 'Maintenance record added', severity: 'success' }));
      setDescription(''); setCost(''); setServiceProvider(''); setNextDueDate('');
    } catch { setError('Failed to add maintenance record.'); }
  };

  if (loadingVehicle) return <Loader />;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Vehicle Maintenance</Typography>
          <Typography color="text.secondary">{vehicle?.registrationNumber} — {vehicle?.make} {vehicle?.model}</Typography>
        </Box>
        <Button onClick={() => navigate('/vehicles')}>Back to Vehicles</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Add Maintenance Record</Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Date" type="date" value={maintenanceDate} onChange={(e) => setMaintenanceDate(e.target.value)} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} required fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
            </Stack>
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required fullWidth multiline rows={2} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Service Provider" value={serviceProvider} onChange={(e) => setServiceProvider(e.target.value)} fullWidth />
              <TextField label="Next Due Date" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <Box><Button type="submit" variant="contained" disabled={isAdding}>Add Record</Button></Box>
          </Stack>
        </form>
      </Paper>

      <Typography variant="h6" sx={{ mb: 1 }}>Maintenance History</Typography>
      <TableContainer component={Paper} variant="outlined">
        {loadingRecords ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
          <Table size="small">
            <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Description</TableCell><TableCell>Provider</TableCell><TableCell align="right">Cost</TableCell><TableCell>Next Due</TableCell></TableRow></TableHead>
            <TableBody>
              {records?.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{new Date(r.maintenanceDate).toLocaleDateString()}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>{r.serviceProvider ?? '-'}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{fmt(r.cost)}</TableCell>
                  <TableCell>{r.nextDueDate ? <Chip label={new Date(r.nextDueDate).toLocaleDateString()} size="small" color="warning" /> : '-'}</TableCell>
                </TableRow>
              ))}
              {!records?.length && <TableRow><TableCell colSpan={5} align="center">No maintenance records</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
