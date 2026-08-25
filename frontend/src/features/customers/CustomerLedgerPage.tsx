import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import {
  useGetCustomerLedgerQuery,
  useAddCustomerTransactionMutation,
  useDeleteCustomerTransactionMutation,
} from './customerApi';
import type { CustomerTransactionType } from '../../types/customer.types';
import { exportLedgerPdf } from '../../utils/exportLedgerPdf';
import { printLedger } from '../../utils/printLedger';
import { useGetSettingsQuery } from '../settings/settingsApi';
import { fmtAmount, fmtNum } from '../../utils/formatNumber';

const fmt = fmtAmount;
const today = () => new Date().toISOString().split('T')[0];

export default function CustomerLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Dialog state
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<CustomerTransactionType>('INVOICE');
  const [amount, setAmount] = useState('');
  const [txDate, setTxDate] = useState(today());
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  const { data: settings } = useGetSettingsQuery();

  const { data, isLoading } = useGetCustomerLedgerQuery(
    { id: id ?? '', fromDate: fromDate || undefined, toDate: toDate || undefined },
    { skip: !id },
  );
  const [addTransaction, { isLoading: adding }] = useAddCustomerTransactionMutation();
  const [deleteTransaction, { isLoading: deleting }] = useDeleteCustomerTransactionMutation();

  const resetDialog = () => {
    setTxType('INVOICE');
    setAmount('');
    setTxDate(today());
    setDescription('');
    setReference('');
  };

  const handleAdd = async () => {
    if (!id || !amount) return;
    try {
      await addTransaction({
        id,
        data: {
          type: txType,
          amount: parseFloat(amount),
          date: txDate,
          description: description || undefined,
          reference: reference || undefined,
        },
      }).unwrap();
      dispatch(showSnackbar({ message: 'Transaction added', severity: 'success' }));
      setOpen(false);
      resetDialog();
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add transaction', severity: 'error' }));
    }
  };

  const handleDelete = async () => {
    if (!id || !deleteId) return;
    try {
      await deleteTransaction({ customerId: id, txId: deleteId }).unwrap();
      dispatch(showSnackbar({ message: 'Transaction deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete transaction', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) return <Loader />;

  const customer = data?.customer;
  const transactions = data?.transactions ?? [];
  const summary = data?.summary;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Customers', to: '/customers' }, { label: data?.customer?.name ?? '…' }, { label: 'Ledger' }]} />
      {/* Page Header */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/customers')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">CUSTOMER LEDGER</Typography>
          {customer && (
            <Typography variant="body2" color="text.secondary">
              {customer.name}{customer.companyName ? ` — ${customer.companyName}` : ''}{customer.phone ? ` | ${customer.phone}` : ''}
            </Typography>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          disabled={!data || !transactions.length}
          onClick={() => printLedger({
            title: 'CUSTOMER LEDGER',
            entityName: customer?.name ?? '',
            entityCompany: customer?.companyName,
            entityPhone: customer?.phone,
            fromDate, toDate,
            rows: transactions,
            totalDebit: summary?.totalDebit,
            totalCredit: summary?.totalCredit,
            closingBalance: summary?.closingBalance,
            companyName: settings?.companyName,
          })}
        >
          Print
        </Button>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          disabled={!data || !transactions.length}
          onClick={() => exportLedgerPdf({
            title: 'CUSTOMER LEDGER',
            entityName: customer?.name ?? '',
            entityCompany: customer?.companyName,
            entityPhone: customer?.phone,
            fromDate, toDate,
            rows: transactions,
            summary,
            companyName: settings?.companyName,
          })}
        >
          Export PDF
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Transaction
        </Button>
      </Stack>

      {/* Info Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Billed</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {fmt(customer?.totalBilled ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Paid</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                {fmt(customer?.totalPaid ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Outstanding Balance</Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: (customer?.outstandingBalance ?? 0) > 0
                    ? 'warning.main'
                    : 'success.main',
                }}
              >
                {fmt(customer?.outstandingBalance ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          {(fromDate || toDate) && (
            <Button size="small" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Ledger Table */}
      <TableContainer component={Paper} variant="outlined">
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Debit (PKR)</TableCell>
                <TableCell align="right">Credit (PKR)</TableCell>
                <TableCell align="right">Balance (PKR)</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.type}
                      color={row.type === 'INVOICE' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{row.description ?? '-'}</TableCell>
                  <TableCell>{row.reference ?? '-'}</TableCell>
                  <TableCell align="right">{row.debit > 0 ? fmtNum(row.debit) : '-'}</TableCell>
                  <TableCell align="right">{row.credit > 0 ? fmtNum(row.credit) : '-'}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: row.balance > 0
                        ? 'warning.main'
                        : row.balance === 0
                          ? 'success.main'
                          : 'error.main',
                    }}
                  >
                    {fmtNum(row.balance)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(row.id)}
                        disabled={deleting}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!transactions.length && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No transactions found</TableCell>
                </TableRow>
              )}
              {/* Summary Footer */}
              {transactions.length > 0 && summary && (
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>Summary</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtNum(summary.totalDebit)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtNum(summary.totalCredit)}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color: summary.closingBalance > 0
                        ? 'warning.main'
                        : summary.closingBalance === 0
                          ? 'success.main'
                          : 'error.main',
                    }}
                  >
                    {fmtNum(summary.closingBalance)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Add Transaction Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); resetDialog(); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={txType} onChange={(e) => setTxType(e.target.value as CustomerTransactionType)}>
                  <MenuItem value="INVOICE">INVOICE</MenuItem>
                  <MenuItem value="PAYMENT">PAYMENT</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Date"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
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
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Reference (optional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); resetDialog(); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!amount || !txDate || adding}
          >
            {adding ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
