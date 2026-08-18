import { useEffect, useState, type FormEvent } from 'react';
import { Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useGetSettingsQuery, useUpdateSettingsMutation } from './settingsApi';
import Loader from '../../components/common/Loader';

declare global { interface Window { electronAPI?: { getVersion: () => Promise<string> } } }

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  const [appVersion, setAppVersion] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [ntn, setNtn] = useState('');
  const [strn, setStrn] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [financialYearStart, setFinancialYearStart] = useState('');

  useEffect(() => {
    window.electronAPI?.getVersion().then(setAppVersion).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName); setAddress(settings.address ?? ''); setPhone(settings.phone ?? '');
      setEmail(settings.email ?? ''); setWebsite(settings.website ?? ''); setNtn(settings.ntn ?? '');
      setStrn(settings.strn ?? ''); setCurrency(settings.currency ?? 'PKR'); setFinancialYearStart(settings.financialYearStart ?? '');
    }
  }, [settings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({ companyName, address: address || undefined, phone: phone || undefined, email: email || undefined, website: website || undefined, ntn: ntn || undefined, strn: strn || undefined, currency: currency || undefined, financialYearStart: financialYearStart || undefined }).unwrap();
      dispatch(showSnackbar({ message: 'Settings saved successfully', severity: 'success' }));
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      dispatch(showSnackbar({ message: apiError.data?.message ?? 'Failed to save settings.', severity: 'error' }));
    }
  };

  if (isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>Settings</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography variant="h6">Company Information</Typography>
            <TextField label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required fullWidth />
            <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth multiline rows={2} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            </Stack>
            <TextField label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth />

            <Divider />
            <Typography variant="h6">Tax & Registration</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="NTN" value={ntn} onChange={(e) => setNtn(e.target.value)} fullWidth />
              <TextField label="STRN" value={strn} onChange={(e) => setStrn(e.target.value)} fullWidth />
            </Stack>

            <Divider />
            <Typography variant="h6">Financial Settings</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} fullWidth placeholder="PKR" />
              <TextField label="Financial Year Start" value={financialYearStart} onChange={(e) => setFinancialYearStart(e.target.value)} fullWidth placeholder="e.g. 01-Jul" />
            </Stack>

            {settings?.updatedAt && (
              <Typography variant="caption" color="text.secondary">Last updated: {new Date(settings.updatedAt).toLocaleString()}</Typography>
            )}

            <Box>
              <Button type="submit" variant="contained" size="large" disabled={isUpdating}>Save Settings</Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {appVersion && (
        <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">About</Typography>
              <Typography variant="body2" color="text.secondary">ConstructPro — Construction ERP Management System</Typography>
            </Box>
            <Chip label={`v${appVersion}`} color="primary" variant="outlined" />
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
