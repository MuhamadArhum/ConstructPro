import { useEffect, useState, type FormEvent } from 'react';
import {
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
import { useCreateExpenseMutation, useGetExpenseByIdQuery, useUpdateExpenseMutation, useGetNextExpenseCodeQuery } from './expenseApi';
import type { ExpenseCategory } from '../../types/expense.types';

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'LabourExpenses', label: 'Labour Expenses' },
  { value: 'Salaries', label: 'Salaries' },
  { value: 'MachineryMaintenance', label: 'Machinery Maintenance' },
  { value: 'VehicleExpenses', label: 'Vehicle Expenses' },
  { value: 'Fuel', label: 'Fuel' },
  { value: 'PlantExpenses', label: 'Plant Expenses' },
  { value: 'CarpentryExpenses', label: 'Carpentry Expenses' },
  { value: 'ElectricalExpenses', label: 'Electrical Expenses' },
  { value: 'SuppliesMaterialPurchase', label: 'Supplies/Material Purchase' },
  { value: 'OfficeExpenses', label: 'Office Expenses' },
  { value: 'Miscellaneous', label: 'Miscellaneous' },
];

export default function ExpenseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: isLoadingExisting } = useGetExpenseByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData, isLoading: isLoadingCode } = useGetNextExpenseCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [update, { isLoading: isUpdating }] = useUpdateExpenseMutation();

  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('LabourExpenses');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');

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
      setVendor(existing.vendor ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      dispatch(showSnackbar({ message: 'Amount must be greater than zero.', severity: 'error' }));
      return;
    }
    const payload = { code: code || undefined, category, amount: parseFloat(amount), date, description, vendor: vendor || undefined };
    try {
      if (isEdit && id) {
        await update({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Expense updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Expense created', severity: 'success' }));
      }
      navigate('/expense');
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message;
      if (msg?.includes('Code already in use')) {
        dispatch(showSnackbar({ message: 'Code already in use. Please choose a different code.', severity: 'error' }));
      } else {
        dispatch(showSnackbar({ message: msg ?? (isEdit ? 'Failed to update expense.' : 'Failed to create expense.'), severity: 'error' }));
      }
    }
  };

  if (isEdit && isLoadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Typography>
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

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
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
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> }, htmlInput: { min: 0 } }}
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
              label="Vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/expense')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {isEdit ? 'Save Changes' : 'Add Expense'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
