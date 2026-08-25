import { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Divider, FormControl, Grid, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import { useCreateInvoiceMutation, useUpdateInvoiceMutation, useGetInvoiceQuery } from './invoiceApi';
import { useGetCustomersQuery } from '../customers/customerApi';
import { fmtAmount, fmtNum } from '../../utils/formatNumber';
import { useGetProjectsQuery } from '../projects/projectApi';
import type { CreateInvoiceItemDto } from '../../types/invoice.types';

const STATUS_OPTIONS = ['Draft', 'Sent', 'Paid', 'Cancelled'];
const today = () => new Date().toISOString().split('T')[0];

interface LineItem extends CreateInvoiceItemDto {
  _key: number;
}

// keyCounter is component-scoped via useRef — do NOT use a module-level variable

export default function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/invoices';
  const prefilledProjectId = searchParams.get('projectId') ?? '';
  const dispatch = useAppDispatch();
  const keyRef = useRef(0);
  const newItem = (): LineItem => ({ _key: ++keyRef.current, description: '', quantity: 1, unitPrice: 0 });

  const { data: existing, isLoading: loadingExisting } = useGetInvoiceQuery(id ?? '', { skip: !isEdit });
  const { data: customersData } = useGetCustomersQuery({ pageSize: 1000 });
  const { data: projectsData } = useGetProjectsQuery({ pageSize: 1000 });

  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation();

  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState(prefilledProjectId);
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [items, setItems] = useState<LineItem[]>([newItem()]);

  useEffect(() => {
    if (existing) {
      setCustomerId(existing.customerId ?? '');
      setProjectId(existing.projectId ?? '');
      setIssueDate(existing.issueDate?.split('T')[0] ?? today());
      setDueDate(existing.dueDate?.split('T')[0] ?? today());
      setStatus(existing.status ?? 'Draft');
      setNotes(existing.notes ?? '');
      setTaxRate(existing.taxRate ?? 0);
      if (existing.items?.length) {
        setItems(existing.items.map((it) => ({ _key: ++keyRef.current, description: it.description, quantity: it.quantity, unitPrice: it.unitPrice })));
      }
    }
  }, [existing]);

  const updateItem = (key: number, field: keyof CreateInvoiceItemDto, value: string | number) => {
    setItems((prev) => prev.map((it) => it._key === key ? { ...it, [field]: value } : it));
  };

  const removeItem = (key: number) => {
    setItems((prev) => prev.filter((it) => it._key !== key));
  };

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!customerId) {
      dispatch(showSnackbar({ message: 'Please select a customer', severity: 'warning' }));
      return;
    }
    if (dueDate && issueDate && dueDate < issueDate) {
      dispatch(showSnackbar({ message: 'Due date cannot be before the issue date', severity: 'warning' }));
      return;
    }
    if (items.some((it) => !it.description)) {
      dispatch(showSnackbar({ message: 'All line items must have a description', severity: 'warning' }));
      return;
    }
    if (items.some((it) => it.quantity <= 0)) {
      dispatch(showSnackbar({ message: 'All line items must have a quantity greater than zero', severity: 'warning' }));
      return;
    }
    if (items.some((it) => it.unitPrice <= 0)) {
      dispatch(showSnackbar({ message: 'All line items must have a unit price greater than zero', severity: 'warning' }));
      return;
    }
    if (taxRate < 0 || taxRate > 100) {
      dispatch(showSnackbar({ message: 'Tax rate must be between 0 and 100', severity: 'warning' }));
      return;
    }
    const payload = {
      customerId,
      projectId: projectId || undefined,
      issueDate,
      dueDate,
      status,
      taxRate,
      notes: notes || undefined,
      items: items.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
    };
    try {
      if (isEdit && id) {
        await updateInvoice({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Invoice updated', severity: 'success' }));
      } else {
        await createInvoice(payload).unwrap();
        dispatch(showSnackbar({ message: 'Invoice created', severity: 'success' }));
      }
      navigate(returnTo);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save invoice', severity: 'error' }));
    }
  };

  if (isEdit && loadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(returnTo)}><ArrowBackIcon /></IconButton>
        <Typography variant="h1">{isEdit ? 'Edit Invoice' : 'New Invoice'}</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Header Information</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Customer</InputLabel>
              <Select label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {customersData?.items.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}{c.companyName ? ` — ${c.companyName}` : ''}</MenuItem>
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
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              fullWidth
              required
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
            <Typography sx={{ flex: 1, textAlign: 'right', color: 'text.secondary' }}>
              Tax ({taxRate}%) = {fmtAmount(taxAmount)}
            </Typography>
            <TextField
              value={taxRate}
              onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              size="small"
              type="number"
              sx={{ width: 120 }}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }, htmlInput: { min: 0, max: 100, step: 'any' } }}
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
        <Button onClick={() => navigate(returnTo)}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={creating || updating}>
          {creating || updating ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </Stack>
    </Box>
  );
}
