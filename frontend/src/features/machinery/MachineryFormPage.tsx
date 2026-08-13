import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateMachineryMutation, useGetMachineryByIdQuery, useUpdateMachineryMutation, useGetNextMachineryCodeQuery } from './machineryApi';
import type { MachineryStatus } from '../../types/machinery.types';

export default function MachineryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: isLoadingExisting } = useGetMachineryByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData } = useGetNextMachineryCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateMachineryMutation();
  const [update, { isLoading: isUpdating }] = useUpdateMachineryMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [totalRunningHours, setTotalRunningHours] = useState('0');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [status, setStatus] = useState<MachineryStatus>('Active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setName(existing.name);
      setModel(existing.model ?? '');
      setSerialNumber(existing.serialNumber ?? '');
      setPurchaseDate(existing.purchaseDate ? existing.purchaseDate.split('T')[0] : '');
      setPurchasePrice(existing.purchasePrice ? String(existing.purchasePrice) : '');
      setTotalRunningHours(String(existing.totalRunningHours));
      setNextMaintenanceDate(existing.nextMaintenanceDate ? existing.nextMaintenanceDate.split('T')[0] : '');
      setStatus(existing.status);
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      code: code || undefined,
      name,
      model: model || undefined,
      serialNumber: serialNumber || undefined,
      purchaseDate: purchaseDate || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      totalRunningHours: parseFloat(totalRunningHours) || 0,
      nextMaintenanceDate: nextMaintenanceDate || undefined,
      notes: notes || undefined,
    };
    try {
      if (isEdit && id) {
        await update({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Machinery updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Machinery added', severity: 'success' }));
      }
      navigate('/machinery');
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      if (msg?.includes('Code already in use')) {
        setError('Code already in use. Please choose a different code.');
      } else {
        setError(msg ?? 'Failed to save machinery record.');
      }
    }
  };

  if (isEdit && isLoadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Machinery' : 'Add Machinery'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
              helperText="Auto-generated. You may override it."
            />

            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Model" value={model} onChange={(e) => setModel(e.target.value)} fullWidth />
            <TextField label="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} fullWidth />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Purchase Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Purchase Price"
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> }, htmlInput: { min: 0 } }}
              />
            </Stack>

            <TextField
              label="Total Running Hours"
              type="number"
              value={totalRunningHours}
              onChange={(e) => setTotalRunningHours(e.target.value)}
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />

            <TextField
              label="Next Maintenance Date"
              type="date"
              value={nextMaintenanceDate}
              onChange={(e) => setNextMaintenanceDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as MachineryStatus)}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="UnderMaintenance">Under Maintenance</MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/machinery')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {isEdit ? 'Save Changes' : 'Add Machinery'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
