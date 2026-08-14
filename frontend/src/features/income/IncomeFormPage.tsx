import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import {
  useCreateIncomeMutation,
  useGetIncomeByIdQuery,
  useUpdateIncomeMutation,
  useGetNextIncomeCodeQuery,
} from './incomeApi';
import type { IncomeCategory } from '../../types/income.types';

const categories: { value: IncomeCategory; label: string }[] = [
  { value: 'CustomerPayment', label: 'Customer Payment' },
  { value: 'ProjectIncome', label: 'Project Income' },
  { value: 'OtherIncome', label: 'Other Income' },
];

export default function IncomeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: isLoadingExisting } = useGetIncomeByIdQuery(id ?? '', {
    skip: !isEdit,
  });
  const { data: nextCodeData } = useGetNextIncomeCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateIncomeMutation();
  const [update, { isLoading: isUpdating }] = useUpdateIncomeMutation();

  const [code, setCode] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('CustomerPayment');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setCategory(existing.category);
      setAmount(String(existing.amount));
      setDate(existing.date.split('T')[0]);
      setDescription(existing.description);
      setCustomerName(existing.customerName ?? '');
      setProjectName(existing.projectName ?? '');
      setIsPaid(existing.isPaid);
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    const payload = {
      code: code || undefined,
      category,
      amount: parseFloat(amount),
      date,
      description,
      customerName: customerName || undefined,
      projectName: projectName || undefined,
      isPaid,
    };
    try {
      if (isEdit && id) {
        await update({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Income updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Income created', severity: 'success' }));
      }
      navigate('/income');
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      if (msg?.includes('Code already in use')) {
        setError('Code already in use. Please choose a different code.');
      } else {
        setError(msg ?? 'Failed to save income record.');
      }
    }
  };

  if (isEdit && isLoadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>
        {isEdit ? 'Edit Income' : 'Add Income'}
      </Typography>
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

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeCategory)}
              >
                {categories.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> },
                htmlInput: { min: 0 },
              }}
            />

            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              fullWidth
            />

            <TextField
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={<Switch checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />}
              label="Payment Received"
            />

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/income')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {isEdit ? 'Save Changes' : 'Add Income'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
