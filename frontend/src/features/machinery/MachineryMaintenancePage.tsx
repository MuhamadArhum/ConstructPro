import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
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
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import { useGetMachineryByIdQuery, useGetMaintenanceHistoryQuery, useAddMaintenanceMutation } from './machineryApi';
import type { MaintenanceType } from '../../types/machinery.types';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function MachineryMaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<MaintenanceType>('Scheduled');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [runningHours, setRunningHours] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');

  const { data: machinery, isLoading: machLoading } = useGetMachineryByIdQuery(id ?? '', { skip: !id });
  const { data: history, isLoading: histLoading } = useGetMaintenanceHistoryQuery(id ?? '', { skip: !id });
  const [addMaintenance, { isLoading: adding }] = useAddMaintenanceMutation();

  const handleAdd = async () => {
    if (!id) return;
    try {
      await addMaintenance({
        id,
        data: {
          maintenanceDate,
          type,
          description,
          cost: parseFloat(cost),
          runningHoursAtService: runningHours ? parseFloat(runningHours) : undefined,
          nextMaintenanceDate: nextDate || undefined,
          serviceProvider: serviceProvider || undefined,
        },
      }).unwrap();
      dispatch(showSnackbar({ message: 'Maintenance record added', severity: 'success' }));
      setOpen(false);
      setDescription('');
      setCost('');
      setRunningHours('');
      setNextDate('');
      setServiceProvider('');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add maintenance record', severity: 'error' }));
    }
  };

  if (machLoading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/machinery')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{machinery?.name} — Maintenance</Typography>
          <Typography variant="body2" color="text.secondary">
            {machinery?.model ?? ''} | Status: {machinery?.statusDisplay} | Running Hours: {machinery?.totalRunningHours.toLocaleString()} hrs
            {machinery?.isMaintenanceDue && (
              <Chip label="Maintenance Due" color="error" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Maintenance
        </Button>
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
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">Hours at Service</TableCell>
                <TableCell>Next Maintenance</TableCell>
                <TableCell>Service Provider</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history?.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{new Date(row.maintenanceDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.type}
                      color={row.type === 'Scheduled' ? 'primary' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">{fmt(row.cost)}</TableCell>
                  <TableCell align="right">
                    {row.runningHoursAtService ? `${row.runningHoursAtService.toLocaleString()} hrs` : '-'}
                  </TableCell>
                  <TableCell>
                    {row.nextMaintenanceDate ? new Date(row.nextMaintenanceDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{row.serviceProvider ?? '-'}</TableCell>
                </TableRow>
              ))}
              {!history?.length && (
                <TableRow>
                  <TableCell colSpan={7} align="center">No maintenance records</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Maintenance Record</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Date"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={type} onChange={(e) => setType(e.target.value as MaintenanceType)}>
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="Repair">Repair</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
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
                required
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
              />
              <TextField
                label="Running Hours at Service"
                type="number"
                value={runningHours}
                onChange={(e) => setRunningHours(e.target.value)}
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
                label="Service Provider"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!description || !cost || adding}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
