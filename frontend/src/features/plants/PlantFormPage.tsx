import { useEffect, useState, type FormEvent } from 'react';
import { Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreatePlantMutation, useGetPlantByIdQuery, useUpdatePlantMutation, useGetNextPlantCodeQuery } from './plantApi';
import type { PlantStatus } from '../../types/plant.types';

export default function PlantFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading } = useGetPlantByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData, isLoading: isLoadingCode } = useGetNextPlantCodeQuery(undefined, { skip: isEdit, refetchOnMountOrArgChange: true });
  const [create, { isLoading: isCreating }] = useCreatePlantMutation();
  const [update, { isLoading: isUpdating }] = useUpdatePlantMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [status, setStatus] = useState<PlantStatus>('Active');
  const [location, setLocation] = useState('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setName(existing.name); setType(existing.type ?? ''); setManufacturer(existing.manufacturer ?? '');
      setSerialNumber(existing.serialNumber ?? ''); setPurchaseDate(existing.purchaseDate?.split('T')[0] ?? '');
      setPurchasePrice(existing.purchasePrice?.toString() ?? ''); setCurrentValue(existing.currentValue?.toString() ?? '');
      setStatus(existing.status); setLocation(existing.location ?? '');
      setNextMaintenanceDate(existing.nextMaintenanceDate?.split('T')[0] ?? ''); setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { code: code || undefined, name, type: type || undefined, manufacturer: manufacturer || undefined, serialNumber: serialNumber || undefined, purchaseDate: purchaseDate || undefined, purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined, currentValue: currentValue ? parseFloat(currentValue) : undefined, status, location: location || undefined, nextMaintenanceDate: nextMaintenanceDate || undefined, notes: notes || undefined };
    try {
      if (isEdit && id) { await update({ id, data: payload }).unwrap(); dispatch(showSnackbar({ message: 'Plant updated', severity: 'success' })); }
      else { await create(payload).unwrap(); dispatch(showSnackbar({ message: 'Plant created', severity: 'success' })); }
      navigate('/plants');
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message;
      if (msg?.includes('Code already in use')) {
        dispatch(showSnackbar({ message: 'Code already in use. Please choose a different code.', severity: 'error' }));
      } else {
        dispatch(showSnackbar({ message: msg ?? (isEdit ? 'Failed to update plant.' : 'Failed to create plant.'), severity: 'error' }));
      }
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Plant' : 'Add Plant'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
              disabled={isLoadingCode}
              placeholder={isLoadingCode ? 'Generating...' : ''}
              helperText={isLoadingCode ? 'Fetching next code…' : 'Auto-generated. You may override it.'}
            />
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Type" value={type} onChange={(e) => setType(e.target.value)} fullWidth />
              <TextField label="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} fullWidth />
              <FormControl fullWidth><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as PlantStatus)}><MenuItem value="Active">Active</MenuItem><MenuItem value="Inactive">Inactive</MenuItem><MenuItem value="Maintenance">Under Maintenance</MenuItem><MenuItem value="Retired">Retired / Disposed</MenuItem></Select></FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Purchase Price" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              <TextField label="Current Value" type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Purchase Date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Next Maintenance Date" type="date" value={nextMaintenanceDate} onChange={(e) => setNextMaintenanceDate(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/plants')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>{isEdit ? 'Save Changes' : 'Add Plant'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
