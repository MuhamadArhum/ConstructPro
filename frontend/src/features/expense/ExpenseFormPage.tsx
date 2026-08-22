import { useEffect, useState, type FormEvent } from 'react';
import {
  Autocomplete, Box, Button, CircularProgress, FormControl, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateExpenseMutation, useGetExpenseByIdQuery, useUpdateExpenseMutation, useGetNextExpenseCodeQuery } from './expenseApi';
import { useGetExpenseCategoriesQuery } from './categoryApi';
import { useGetSuppliersQuery } from '../suppliers/supplierApi';
import { useGetProjectsQuery } from '../projects/projectApi';

export default function ExpenseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: isLoadingExisting } = useGetExpenseByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData, isLoading: isLoadingCode } = useGetNextExpenseCodeQuery(undefined, { skip: isEdit, refetchOnMountOrArgChange: true });
  const [create, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [update, { isLoading: isUpdating }] = useUpdateExpenseMutation();

  const { data: suppliersData } = useGetSuppliersQuery({ pageSize: 1000 });
  const { data: projectsData } = useGetProjectsQuery({ pageSize: 1000 });
  const { data: categoriesData = [] } = useGetExpenseCategoriesQuery();

  const categoryNames = categoriesData.length > 0
    ? categoriesData.map((c) => c.name)
    : ['LabourExpenses', 'Salaries', 'MachineryMaintenance', 'VehicleExpenses', 'Fuel', 'PlantExpenses', 'CarpentryExpenses', 'ElectricalExpenses', 'SuppliesMaterialPurchase', 'OfficeExpenses', 'Miscellaneous'];

  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [projectName, setProjectName] = useState('');

  const suppliers = suppliersData?.items ?? [];
  const projects = projectsData?.data ?? [];

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) setCode(nextCodeData.code);
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (categoryNames.length > 0 && !category) setCategory(categoryNames[0]);
  }, [categoryNames.length]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setCategory(existing.category);
      setAmount(String(existing.amount));
      setDate(existing.date.split('T')[0]);
      setDescription(existing.description ?? '');
      setVendor(existing.vendor ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      dispatch(showSnackbar({ message: 'Amount must be greater than zero.', severity: 'error' }));
      return;
    }
    const payload = {
      code: code || undefined,
      category,
      amount: parseFloat(amount),
      date,
      description: description || undefined,
      vendor: vendor || undefined,
    };
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
      dispatch(showSnackbar({ message: msg ?? (isEdit ? 'Failed to update expense.' : 'Failed to create expense.'), severity: 'error' }));
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
              label="Code" value={code} onChange={(e) => setCode(e.target.value)}
              fullWidth slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
              disabled={isLoadingCode}
              helperText={isLoadingCode ? 'Fetching next code…' : 'Auto-generated. You may override it.'}
            />

            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categoryNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
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

            <TextField
              label="Date" type="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              required fullWidth slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth multiline rows={2}
            />

            <Autocomplete
              freeSolo
              options={suppliers.map((s: any) => s.companyName ?? s.name)}
              value={vendor}
              onInputChange={(_, val) => setVendor(val)}
              renderInput={(params) => <TextField {...params} label="Vendor / Supplier" fullWidth />}
            />

            <Autocomplete
              freeSolo
              options={projects.map((p: any) => p.name)}
              value={projectName}
              onInputChange={(_, val) => setProjectName(val)}
              renderInput={(params) => <TextField {...params} label="Project (optional)" fullWidth />}
            />

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/expense')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) ? <CircularProgress size={20} /> : isEdit ? 'Save Changes' : 'Add Expense'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
