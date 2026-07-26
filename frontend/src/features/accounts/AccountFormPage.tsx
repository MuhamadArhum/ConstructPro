import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Box, Button, FormControl, FormControlLabel, InputLabel, MenuItem, Paper, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateAccountMutation, useGetAccountByIdQuery, useGetAccountsQuery, useUpdateAccountMutation } from './accountsApi';
import type { AccountType } from '../../types/accounts.types';

export default function AccountFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading } = useGetAccountByIdQuery(id ?? '', { skip: !isEdit });
  const { data: allAccounts } = useGetAccountsQuery({ pageSize: 200 });
  const [create, { isLoading: isCreating }] = useCreateAccountMutation();
  const [update, { isLoading: isUpdating }] = useUpdateAccountMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Asset');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setCode(existing.code); setName(existing.name); setAccountType(existing.accountType);
      setParentId(existing.parentId ?? ''); setIsActive(existing.isActive); setDescription(existing.description ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    const payload = { code, name, accountType, parentId: parentId || undefined, isActive, description: description || undefined };
    try {
      if (isEdit && id) { await update({ id, data: payload }).unwrap(); dispatch(showSnackbar({ message: 'Account updated', severity: 'success' })); }
      else { await create(payload).unwrap(); dispatch(showSnackbar({ message: 'Account created', severity: 'success' })); }
      navigate('/accounts');
    } catch { setError('Failed to save account.'); }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Account' : 'Add Account'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction="row" spacing={2}>
              <TextField label="Account Code" value={code} onChange={(e) => setCode(e.target.value)} required fullWidth placeholder="e.g. 1001" />
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
                  {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as AccountType[]).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField label="Account Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <FormControl fullWidth>
              <InputLabel>Parent Account</InputLabel>
              <Select label="Parent Account" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {allAccounts?.items.filter(a => a.id !== id).map((a) => <MenuItem key={a.id} value={a.id}>{a.code} — {a.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
            <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Active" />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/accounts')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>{isEdit ? 'Save Changes' : 'Add Account'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
