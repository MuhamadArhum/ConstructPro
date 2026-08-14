import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useGetInventoryItemByIdQuery, useGetStockTransactionsQuery, useAddStockTransactionMutation } from './inventoryApi';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import type { StockTransactionType } from '../../types/inventory.types';

const typeColors: Record<StockTransactionType, 'success' | 'error' | 'warning' | 'info'> = { StockIn: 'success', StockOut: 'error', MaterialIssue: 'warning', Adjustment: 'info' };

export default function StockTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: item, isLoading: loadingItem } = useGetInventoryItemByIdQuery(id ?? '', { skip: !id });
  const { data: transactions, isLoading: loadingTxns } = useGetStockTransactionsQuery(id ?? '', { skip: !id });
  const [addTransaction, { isLoading: isAdding }] = useAddStockTransactionMutation();

  const [type, setType] = useState<StockTransactionType>('StockIn');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(null);
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    try {
      await addTransaction({ id: id!, data: { type, quantity: parseFloat(quantity), unitPrice: unitPrice ? parseFloat(unitPrice) : undefined, date, reference: reference || undefined, projectName: projectName || undefined, notes: notes || undefined } }).unwrap();
      dispatch(showSnackbar({ message: 'Transaction added', severity: 'success' }));
      setQuantity(''); setUnitPrice(''); setReference(''); setProjectName(''); setNotes('');
    } catch { setError('Failed to add transaction.'); }
  };

  if (loadingItem) return <Loader />;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Inventory', to: '/inventory' }, { label: item?.name ?? '…' }, { label: 'Transactions' }]} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h1">Stock Transactions</Typography>
          <Typography color="text.secondary">{item?.name} — Current Stock: <strong>{item?.currentStock} {item?.unit}</strong></Typography>
        </Box>
        <Button onClick={() => navigate('/inventory')}>Back to Inventory</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Add Transaction</Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={type} onChange={(e) => setType(e.target.value as StockTransactionType)}>
                  <MenuItem value="StockIn">Stock In</MenuItem>
                  <MenuItem value="StockOut">Stock Out</MenuItem>
                  <MenuItem value="MaterialIssue">Material Issue</MenuItem>
                  <MenuItem value="Adjustment">Adjustment</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required fullWidth />
              <TextField label="Unit Price" type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} fullWidth />
              <TextField label="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} fullWidth />
            </Stack>
            <Box><Button type="submit" variant="contained" disabled={isAdding}>Add Transaction</Button></Box>
          </Stack>
        </form>
      </Paper>

      <Typography variant="h6" sx={{ mb: 1 }}>Transaction History</Typography>
      <TableContainer component={Paper} variant="outlined">
        {loadingTxns ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box> : (
          <Table size="small">
            <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Unit Price</TableCell><TableCell>Reference</TableCell><TableCell>Project</TableCell></TableRow></TableHead>
            <TableBody>
              {transactions?.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell><Chip label={t.typeDisplay} color={typeColors[t.type]} size="small" /></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t.quantity}</TableCell>
                  <TableCell align="right">{t.unitPrice ? `PKR ${t.unitPrice.toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{t.reference ?? '-'}</TableCell>
                  <TableCell>{t.projectName ?? '-'}</TableCell>
                </TableRow>
              ))}
              {!transactions?.length && <TableRow><TableCell colSpan={6} align="center">No transactions</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
