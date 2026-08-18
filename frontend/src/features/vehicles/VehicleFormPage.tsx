import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateVehicleMutation, useGetVehicleByIdQuery, useUpdateVehicleMutation, useGetNextVehicleCodeQuery } from './vehicleApi';
import type { VehicleStatus } from '../../types/vehicle.types';

export default function VehicleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading } = useGetVehicleByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData, isLoading: isLoadingCode } = useGetNextVehicleCodeQuery(undefined, { skip: isEdit, refetchOnMountOrArgChange: true });
  const [create, { isLoading: isCreating }] = useCreateVehicleMutation();
  const [update, { isLoading: isUpdating }] = useUpdateVehicleMutation();

  const [code, setCode] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('Active');
  const [totalMileage, setTotalMileage] = useState('0');
  const [notes, setNotes] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setRegistrationNumber(existing.registrationNumber);
      setMake(existing.make);
      setModel(existing.model ?? '');
      setYear(existing.year?.toString() ?? '');
      setDriverName(existing.driverName ?? '');
      setDriverContact(existing.driverContact ?? '');
      setPurchasePrice(existing.purchasePrice?.toString() ?? '');
      setPurchaseDate(existing.purchaseDate?.split('T')[0] ?? '');
      setStatus(existing.status);
      setTotalMileage(existing.totalMileage.toString());
      setNotes(existing.notes ?? '');
      setInsuranceExpiry((existing as Record<string, unknown>)['insuranceExpiry'] as string ?? '');
      setTokenExpiry((existing as Record<string, unknown>)['tokenExpiry'] as string ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const base = { code: code || undefined, registrationNumber, make, model: model || undefined, year: year ? parseInt(year) : undefined, driverName: driverName || undefined, driverContact: driverContact || undefined, purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined, purchaseDate: purchaseDate || undefined, status, notes: notes || undefined, ...(insuranceExpiry ? { insuranceExpiry } : {}), ...(tokenExpiry ? { tokenExpiry } : {}) };
    try {
      if (isEdit && id) { await update({ id, data: { ...base, totalMileage: parseFloat(totalMileage) } }).unwrap(); dispatch(showSnackbar({ message: 'Vehicle updated', severity: 'success' })); }
      else { await create(base).unwrap(); dispatch(showSnackbar({ message: 'Vehicle created', severity: 'success' })); }
      navigate('/vehicles');
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      if (msg?.includes('Code already in use')) {
        setError('Code already in use. Please choose a different code.');
      } else {
        setError(msg ?? 'Failed to save vehicle.');
      }
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</Typography>
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
              disabled={isLoadingCode}
              placeholder={isLoadingCode ? 'Generating...' : ''}
              helperText={isLoadingCode ? 'Fetching next code…' : 'Auto-generated. You may override it.'}
            />
            <TextField label="Registration Number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Make" value={make} onChange={(e) => setMake(e.target.value)} required fullWidth />
              <TextField label="Model" value={model} onChange={(e) => setModel(e.target.value)} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} fullWidth slotProps={{ htmlInput: { min: 1900, max: 2100 } }} />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus)}>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="UnderMaintenance">Under Maintenance</MenuItem>
                  <MenuItem value="Retired">Retired</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Driver Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} fullWidth />
              <TextField label="Driver Contact" value={driverContact} onChange={(e) => setDriverContact(e.target.value)} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Purchase Price" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> }, htmlInput: { min: 0 } }} />
              <TextField label="Purchase Date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            {isEdit && <TextField label="Total Mileage (km)" type="number" value={totalMileage} onChange={(e) => setTotalMileage(e.target.value)} fullWidth slotProps={{ htmlInput: { min: 0 } }} />}
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Insurance Expiry" type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Token Expiry" type="date" value={tokenExpiry} onChange={(e) => setTokenExpiry(e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/vehicles')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>{isEdit ? 'Save Changes' : 'Add Vehicle'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
