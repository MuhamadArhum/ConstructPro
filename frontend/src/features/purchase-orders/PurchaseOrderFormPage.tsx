import { useEffect, useState } from 'react';
import {
  Box, Button, Divider, FormControl, Grid, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import { useCreatePurchaseOrderMutation, useUpdatePurchaseOrderMutation, useGetPurchaseOrderQuery } from './purchaseOrderApi';
import { useGetSuppliersQuery } from '../suppliers/supplierApi';
import { useGetProjectsQuery } from '../projects/projectApi';
import type { CreatePOItemDto } from '../../types/purchase-order.types';
import { fmtAmount, fmtNum } from '../../utils/formatNumber';

const STATUS_OPTIONS = ['Draft', 'Sent', 'Received', 'Cancelled'];
const today = () => new Date().toISOString().split('T')[0];

interface LineItem extends CreatePOItemDto {
  _key: number;
}

let keyCounter = 0;
const newItem = (): LineItem => ({ _key: ++keyCounter, description: '', quantity: 1, unitPrice: 0 });

export default function PurchaseOrderFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: loadingExisting } = useGetPurchaseOrderQuery(id ?? '', { skip: !isEdit });
  const { data: suppliersData } = useGetSuppliersQuery({ pageSize: 1000 });
  const { data: projectsData } = useGetProjectsQuery({ pageSize: 1000 });

  const [createPO, { isLoading: creating }] = useCreatePurchaseOrderMutation();
  const [updatePO, { isLoading: updating }] = useUpdatePurchaseOrderMutation();

  const [supplierId, setSupplierId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [issueDate, setIssueDate] = useState(today());
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([newItem()]);

  useEffect(() => {
    if (existing) {
      setSupplierId(existing.supplierId ?? '');
      setProjectId(existing.projectId ?? '');
      setIssueDate(existing.issueDate?.split('T')[0] ?? today());
      setExpectedDelivery(existing.expectedDelivery?.split('T')[0] ?? '');
      setStatus(existing.status ?? 'Draft');
      setNotes(existing.notes ?? '');
      setTaxAmount(existing.taxAmount ?? 0);
      if (existing.items?.length) {
        setItems(existing.items.map((it) => ({ _key: ++keyCounter, description: it.description, quantity: it.quantity, unitPrice: it.unitPrice })));
      }
    }
  }, [existing]);

  const updateItem = (key: number, field: keyof CreatePOItemDto, value: string | number) => {
    setItems((prev) => prev.map((it) => it._key === key ? { ...it, [field]: value } : it));
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((it) => it._key !== key));
  };

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const total = subtotal + (taxAmount || 0);

  const handleSubmit = async () => {
    if (!supplierId) {
      dispatch(showSnackbar({ message: 'Please select a supplier', severity: 'warning' }));
      return;
    }
    if (items.some((it) => !it.description)) {
      dispatch(showSnackbar({ message: 'All line items must have a description', severity: 'warning' }));
      return;
    }
    const payload = {
      supplierId,
      projectId: projectId || undefined,
      issueDate,
      expectedDelivery: expectedDelivery || undefined,
      status,
      taxAmount,
      notes: notes || undefined,
      items: items.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
    };
    try {
      if (isEdit && id) {
        await updatePO({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Purchase order updated', severity: 'success' }));
      } else {
        await createPO(payload).unwrap();
        dispatch(showSnackbar({ message: 'Purchase order created', severity: 'success' }));
      }
      navigate('/purchase-orders');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save purchase order', severity: 'error' }));
    }
  };

  if (isEdit && loadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/purchase-orders')}><ArrowBackIcon /></IconButton>
        <Typography variant="h1">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Header Information</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Supplier</InputLabel>
              <Select label="Supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                {suppliersData?.items.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}{s.companyName ? ` — ${s.companyName}` : ''}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Project (optional)</InputLabel>
              <Select label="Project (optional)" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {projectsData?.data.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Expected Delivery (optional)"
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Line Items</Typography>
          <Button startIcon={<AddIcon />} size="small" onClick={() => setItems((prev) => [...prev, newItem()])}>
            Add Item
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>Qty</TableCell>
                <TableCell align="right" sx={{ width: 160 }}>Unit Price (PKR)</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>Total (PKR)</TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._key}>
                  <TableCell>
                    <TextField
                      value={item.description}
                      onChange={(e) => updateItem(item._key, 'description', e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="Description"
                      required
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      value={item.quantity}
                      onChange={(e) => updateItem(item._key, 'quantity', parseFloat(e.target.value) || 0)}
                      size="small"
                      type="number"
                      sx={{ width: 90 }}
                      slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item._key, 'unitPrice', parseFloat(e.target.value) || 0)}
                      size="small"
                      type="number"
                      sx={{ width: 140 }}
                      slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {fmtNum(item.quantity * item.unitPrice)}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => removeItem(item._key)} disabled={items.length === 1}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Stack sx={{ alignItems: 'flex-end' }} spacing={1}>
          <Stack direction="row" spacing={4} sx={{ minWidth: 320 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', color: 'text.secondary' }}>Subtotal</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right', fontWeight: 600 }}>{fmtAmount(subtotal)}</Typography>
          </Stack>
          <Stack direction="row" spacing={4} sx={{ minWidth: 320, alignItems: 'center' }}>
            <Typography sx={{ flex: 1, textAlign: 'right', color: 'text.secondary' }}>Tax Amount</Typography>
            <TextField
              value={taxAmount}
              onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
              size="small"
              type="number"
              sx={{ width: 120 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
            />
          </Stack>
          <Stack direction="row" spacing={4} sx={{ minWidth: 320 }}>
            <Typography sx={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: '1.1rem' }}>Total</Typography>
            <Typography sx={{ minWidth: 120, textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'primary.main' }}>
              {fmtAmount(total)}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Button onClick={() => navigate('/purchase-orders')}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={creating || updating}>
          {creating || updating ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Purchase Order'}
        </Button>
      </Stack>
    </Box>
  );
}
