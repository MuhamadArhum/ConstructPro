import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
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
import { useCreateExpenseMutation, useGetExpenseByIdQuery, useUpdateExpenseMutation } from './expenseApi';
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
  const [create, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [update, { isLoading: isUpdating }] = useUpdateExpenseMutation();

  const [category, setCategory] = useState<ExpenseCategory>('LabourExpenses');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setCategory(existing.category);
      setAmount(String(existing.amount));
      setDate(existing.date.split('T')[0]);
      setDescription(existing.description);
      setVendor(existing.vendor ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = { category, amount: parseFloat(amount), date, description, vendor: vendor || undefined };
    try {
      if (isEdit && id) {
        await update({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Expense updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Expense created', severity: 'success' }));
      }
      navigate('/expense');
    } catch {
      setError('Failed to save expense record.');
    }
  };

  if (isEdit && isLoadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 560 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

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
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
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
                {isEdit ? 'Save Changes' : 'Create Expense'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
