import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Box, Button, InputAdornment, Paper, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateInventoryItemMutation, useGetInventoryItemByIdQuery, useUpdateInventoryItemMutation, useGetNextInventoryCodeQuery } from './inventoryApi';

export default function InventoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading } = useGetInventoryItemByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData } = useGetNextInventoryCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateInventoryItemMutation();
  const [update, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setName(existing.name); setCategory(existing.category ?? ''); setUnit(existing.unit ?? '');
      setCurrentStock(existing.currentStock.toString()); setLowStockThreshold(existing.lowStockThreshold.toString());
      setUnitPrice(existing.unitPrice?.toString() ?? ''); setSupplierName(existing.supplierName ?? '');
      setLocation(existing.location ?? ''); setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    const payload = { code: code || undefined, name, category: category || undefined, unit: unit || undefined, currentStock: parseFloat(currentStock), lowStockThreshold: parseFloat(lowStockThreshold), unitPrice: unitPrice ? parseFloat(unitPrice) : undefined, supplierName: supplierName || undefined, location: location || undefined, notes: notes || undefined };
    try {
      if (isEdit && id) { await update({ id, data: payload }).unwrap(); dispatch(showSnackbar({ message: 'Item updated', severity: 'success' })); }
      else { await create(payload).unwrap(); dispatch(showSnackbar({ message: 'Item created', severity: 'success' })); }
      navigate('/inventory');
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      if (msg?.includes('Code already in use')) {
        setError('Code already in use. Please choose a different code.');
      } else {
        setError(msg ?? 'Failed to save item.');
      }
    }
  };

  if (isEdit && isLoading) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Item' : 'Add Inventory Item'}</Typography>
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
            <TextField label="Item Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} fullWidth placeholder="e.g. Cement, Steel" />
              <TextField label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} fullWidth placeholder="e.g. Bags, Kg, Meters" />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Current Stock" type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} required fullWidth slotProps={{ htmlInput: { min: 0 } }} />
              <TextField label="Low Stock Threshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} required fullWidth slotProps={{ htmlInput: { min: 0 } }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Unit Price" type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> }, htmlInput: { min: 0 } }} />
              <TextField label="Supplier" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} fullWidth />
            </Stack>
            <TextField label="Storage Location" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/inventory')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>{isEdit ? 'Save Changes' : 'Add Item'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
