import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Divider, FormControl, IconButton, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateJournalEntryMutation, useGetAccountsQuery } from './accountsApi';
import type { CreateJournalEntryLineRequest } from '../../types/accounts.types';

export default function JournalEntryFormPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: accounts } = useGetAccountsQuery({ pageSize: 200, isActive: true });
  const [createEntry, { isLoading }] = useCreateJournalEntryMutation();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<CreateJournalEntryLineRequest[]>([
    { accountId: '', debit: 0, credit: 0 },
    { accountId: '', debit: 0, credit: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (index: number, field: keyof CreateJournalEntryLineRequest, value: string | number) => {
    setLines((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    if (!isBalanced) { setError('Debit and Credit must be equal.'); return; }
    if (lines.some(l => !l.accountId)) { setError('All lines must have an account selected.'); return; }
    try {
      await createEntry({ date, description, reference: reference || undefined, notes: notes || undefined, lines }).unwrap();
      dispatch(showSnackbar({ message: 'Journal entry created', severity: 'success' }));
      navigate('/accounts/journal');
    } catch { setError('Failed to create journal entry.'); }
  };

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>New Journal Entry</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} fullWidth />
            </Stack>
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} required fullWidth />

            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Journal Lines</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Account</TableCell><TableCell align="right" sx={{ width: 160 }}>Debit (PKR)</TableCell><TableCell align="right" sx={{ width: 160 }}>Credit (PKR)</TableCell><TableCell sx={{ width: 50 }} /></TableRow></TableHead>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select value={line.accountId} onChange={(e) => updateLine(index, 'accountId', e.target.value)} displayEmpty>
                          <MenuItem value=""><em>Select Account</em></MenuItem>
                          {accounts?.items.map((a) => <MenuItem key={a.id} value={a.id}>{a.code} — {a.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell><TextField type="number" size="small" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)} fullWidth /></TableCell>
                    <TableCell><TextField type="number" size="small" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)} fullWidth /></TableCell>
                    <TableCell><IconButton size="small" color="error" onClick={() => setLines(prev => prev.filter((_, i) => i !== index))} disabled={lines.length <= 2}><RemoveIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><Button size="small" startIcon={<AddIcon />} onClick={() => setLines(prev => [...prev, { accountId: '', debit: 0, credit: 0 }])}>Add Line</Button></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: isBalanced ? 'success.main' : 'error.main' }}>PKR {totalDebit.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: isBalanced ? 'success.main' : 'error.main' }}>PKR {totalCredit.toLocaleString()}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
            {!isBalanced && <Alert severity="warning">Debit ({totalDebit.toLocaleString()}) ≠ Credit ({totalCredit.toLocaleString()})</Alert>}

            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/accounts/journal')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isLoading || !isBalanced}>Post Entry</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
