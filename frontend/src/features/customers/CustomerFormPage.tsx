import { useEffect, useState, type FormEvent } from 'react';
import { Box, Button, FormControlLabel, InputAdornment, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateCustomerMutation, useGetCustomerByIdQuery, useUpdateCustomerMutation, useGetNextCustomerCodeQuery } from './customerApi';

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading } = useGetCustomerByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData } = useGetNextCustomerCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [ntn, setNtn] = useState('');
  const [cnic, setCnic] = useState('');
  const [projectName, setProjectName] = useState('');
  const [totalBilled, setTotalBilled] = useState('0');
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
      setCnic(existing.cnic ?? ''); setProjectName(existing.projectName ?? '');
      setTotalBilled(existing.totalBilled.toString()); setTotalPaid(existing.totalPaid.toString());
      setIsActive(existing.isActive); setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { code: code || undefined, name, companyName: companyName || undefined, phone: phone || undefined, email: email || undefined, address: address || undefined, ntn: ntn || undefined, cnic: cnic || undefined, projectName: projectName || undefined, totalBilled: parseFloat(totalBilled), totalPaid: parseFloat(totalPaid), isActive, notes: notes || undefined };
    try {
      if (isEdit && id) { await update({ id, data: payload }).unwrap(); dispatch(showSnackbar({ message: 'Customer updated', severity: 'success' })); }
      else { await create(payload).unwrap(); dispatch(showSnackbar({ message: 'Customer created', severity: 'success' })); }
      navigate('/customers');
    } catch (err: unknown) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message;
      if (msg?.includes('Code already in use')) {
        dispatch(showSnackbar({ message: 'Code already in use. Please choose a different code.', severity: 'error' }));
      } else {
        dispatch(showSnackbar({ message: msg ?? (isEdit ? 'Failed to update customer.' : 'Failed to create customer.'), severity: 'error' }));
      }
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Customer' : 'Add Customer'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
              helperText="Auto-generated. You may override it."
            />
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth />
              <TextField label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="NTN" value={ntn} onChange={(e) => setNtn(e.target.value)} fullWidth />
              <TextField label="CNIC" value={cnic} onChange={(e) => setCnic(e.target.value)} fullWidth />
            </Stack>
            <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Total Billed" type="number" value={totalBilled} onChange={(e) => setTotalBilled(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              <TextField label="Total Paid" type="number" value={totalPaid} onChange={(e) => setTotalPaid(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
            </Stack>
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />
            <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Active" />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/customers')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>{isEdit ? 'Save Changes' : 'Add Customer'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
