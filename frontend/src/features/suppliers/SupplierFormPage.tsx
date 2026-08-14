import { useEffect, useState, type FormEvent } from 'react';
import { Box, Button, FormControlLabel, InputAdornment, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateSupplierMutation, useGetSupplierByIdQuery, useUpdateSupplierMutation, useGetNextSupplierCodeQuery } from './supplierApi';

export default function SupplierFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading } = useGetSupplierByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData, isLoading: isLoadingCode } = useGetNextSupplierCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [update, { isLoading: isUpdating }] = useUpdateSupplierMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [ntn, setNtn] = useState('');
  const [category, setCategory] = useState('');
  const [totalPurchased, setTotalPurchased] = useState('0');
  const [totalPaid, setTotalPaid] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setName(existing.name); setCompanyName(existing.companyName ?? ''); setPhone(existing.phone ?? '');
      setEmail(existing.email ?? ''); setAddress(existing.address ?? ''); setNtn(existing.ntn ?? '');
      setCategory(existing.category ?? ''); setTotalPurchased(existing.totalPurchased.toString());
      setTotalPaid(existing.totalPaid.toString()); setIsActive(existing.isActive); setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { code: code || undefined, name, companyName: companyName || undefined, phone: phone || undefined, email: email || undefined, address: address || undefined, ntn: ntn || undefined, category: category || undefined, totalPurchased: parseFloat(totalPurchased), totalPaid: parseFloat(totalPaid), isActive, notes: notes || undefined };
    try {
      if (isEdit && id) { await update({ id, data: payload }).unwrap(); dispatch(showSnackbar({ message: 'Supplier updated', severity: 'success' })); }
      else { await create(payload).unwrap(); dispatch(showSnackbar({ message: 'Supplier created', severity: 'success' })); }
      navigate('/suppliers');
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message;
      if (msg?.includes('Code already in use')) {
        dispatch(showSnackbar({ message: 'Code already in use. Please choose a different code.', severity: 'error' }));
      } else {
        dispatch(showSnackbar({ message: msg ?? (isEdit ? 'Failed to update supplier.' : 'Failed to create supplier.'), severity: 'error' }));
      }
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Supplier' : 'Add Supplier'}</Typography>
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
              <TextField label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth />
              <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth placeholder="e.g. Building Materials" />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            </Stack>
            <TextField label="NTN" value={ntn} onChange={(e) => setNtn(e.target.value)} fullWidth />
            <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Total Purchased" type="number" value={totalPurchased} onChange={(e) => setTotalPurchased(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              <TextField label="Total Paid" type="number" value={totalPaid} onChange={(e) => setTotalPaid(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
            </Stack>
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />
            <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Active" />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/suppliers')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>{isEdit ? 'Save Changes' : 'Add Supplier'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
