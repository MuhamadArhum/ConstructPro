import { useEffect, useState, type FormEvent } from 'react';
import {
  Box, Button, CircularProgress, FormControl, FormControlLabel,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Stack,
  Switch, TextField, Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateTaxRecordMutation, useGetTaxRecordByIdQuery, useUpdateTaxRecordMutation, useGetNextTaxCodeQuery } from './taxApi';
import type { TaxType } from '../../types/tax.types';

const taxTypes: { value: TaxType; label: string }[] = [
  { value: 'VAT', label: 'VAT' },
  { value: 'GST', label: 'GST' },
  { value: 'Income', label: 'Income Tax' },
  { value: 'Withholding', label: 'Withholding Tax (WHT)' },
  { value: 'Other', label: 'Other' },
];

const todayStr = new Date().toISOString().split('T')[0];

export default function TaxFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading } = useGetTaxRecordByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData, isLoading: isLoadingCode } = useGetNextTaxCodeQuery(undefined, { skip: isEdit, refetchOnMountOrArgChange: true });
  const [create, { isLoading: isCreating }] = useCreateTaxRecordMutation();
  const [update, { isLoading: isUpdating }] = useUpdateTaxRecordMutation();

  const [code, setCode] = useState('');
  const [taxType, setTaxType] = useState<TaxType>('VAT');
  const [amount, setAmount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) setCode(nextCodeData.code);
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setTaxType(existing.taxType);
      setAmount(existing.amount.toString());
      setPeriodStart(existing.periodStart.split('T')[0]);
      setPeriodEnd(existing.periodEnd.split('T')[0]);
      setDueDate(existing.dueDate?.split('T')[0] ?? '');
      setPaidDate(existing.paidDate?.split('T')[0] ?? '');
      setIsPaid(existing.isPaid);
      setReference(existing.reference ?? '');
      setDescription(existing.description ?? '');
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleIsPaidToggle = (checked: boolean) => {
    setIsPaid(checked);
    if (checked && !paidDate) {
      setPaidDate(todayStr);
    }
    if (!checked) {
      setPaidDate('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      dispatch(showSnackbar({ message: 'Amount must be greater than zero.', severity: 'error' }));
      return;
    }
    if (periodStart && periodEnd && periodEnd < periodStart) {
      dispatch(showSnackbar({ message: 'Period end cannot be before period start.', severity: 'error' }));
      return;
    }
    const payload = {
      code: code || undefined,
      taxType,
      amount: parseFloat(amount),
      periodStart,
      periodEnd,
      dueDate: dueDate || undefined,
      paidDate: isPaid ? (paidDate || todayStr) : undefined,
      isPaid,
      reference: reference || undefined,
      description: description || undefined,
      notes: notes || undefined,
    };
    try {
      if (isEdit && id) {
        await update({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Tax record updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Tax record created', severity: 'success' }));
      }
      navigate('/tax');
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message;
      dispatch(showSnackbar({
        message: msg ?? (isEdit ? 'Failed to update tax record.' : 'Failed to create tax record.'),
        severity: 'error',
      }));
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Tax Record' : 'Add Tax Record'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Code" value={code} onChange={(e) => setCode(e.target.value)}
              fullWidth disabled={isLoadingCode}
              slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
              helperText={isLoadingCode ? 'Fetching next code…' : 'Auto-generated. You may override it.'}
            />

            <FormControl fullWidth required>
              <InputLabel>Tax Type</InputLabel>
              <Select label="Tax Type" value={taxType} onChange={(e) => setTaxType(e.target.value as TaxType)}>
                {taxTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField
              label="Amount" type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required fullWidth
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> },
                htmlInput: { min: 0 },
              }}
            />

            <Stack direction="row" spacing={2}>
              <TextField label="Period Start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Period End" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>

            <TextField
              label="Due Date" type="date" value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              fullWidth slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} fullWidth />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />

            <FormControlLabel
              control={<Switch checked={isPaid} onChange={(e) => handleIsPaidToggle(e.target.checked)} />}
              label="Payment Completed"
            />

            {isPaid && (
              <TextField
                label="Paid Date" type="date" value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                fullWidth slotProps={{ inputLabel: { shrink: true } }}
              />
            )}

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/tax')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) ? <CircularProgress size={20} /> : isEdit ? 'Save Changes' : 'Add Tax Record'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
