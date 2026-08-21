import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, FormControl, Grid, IconButton,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetExpensesQuery, useGetExpenseSummaryQuery, useDeleteExpenseMutation } from './expenseApi';
import { useGetExpenseCategoriesQuery } from './categoryApi';
import TableSkeleton from '../../components/common/TableSkeleton';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

function exportToCsv(rows: any[]) {
  const headers = ['Code', 'Date', 'Category', 'Description', 'Vendor', 'Amount'];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.code ?? '',
        new Date(r.date).toLocaleDateString('en-GB'),
        r.category,
        `"${(r.description ?? '').replace(/"/g, '""')}"`,
        r.vendor ?? '',
        r.amount,
      ].join(','),
    ),
  ].join('\n');
  const blob = new Blob([lines], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const todayStr = new Date().toLocaleDateString('en-CA');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const query = {
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    category: category || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    amountMin: amountMin ? parseFloat(amountMin) : undefined,
    amountMax: amountMax ? parseFloat(amountMax) : undefined,
  };

  const { data, isLoading } = useGetExpensesQuery(query);
  const { data: summary } = useGetExpenseSummaryQuery();
  const { data: categoriesData = [] } = useGetExpenseCategoriesQuery();
  const [deleteExpense] = useDeleteExpenseMutation();

  const hasFilters = !!(search || category || fromDate !== todayStr || toDate !== todayStr || amountMin || amountMax);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(deleteId).unwrap();
      dispatch(showSnackbar({ message: 'Expense deleted successfully', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete expense', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    const rows = data?.items ?? [];
    if (!rows.length) {
      dispatch(showSnackbar({ message: 'No data to export', severity: 'warning' }));
      return;
    }
    exportToCsv(rows);
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Expenses</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>
            Export CSV
          </Button>
          <PermissionGate permission={Perms.Expense.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/expense/new')}>
              Add Expense
            </Button>
          </PermissionGate>
        </Stack>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total All Time', value: summary?.totalAllTime ?? 0 },
          { label: 'This Month', value: summary?.totalThisMonth ?? 0 },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(card.value)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField
            label="Search" size="small" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {categoriesData.map((c) => (
                <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="From Date" type="date" size="small" value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}
          />
          <TextField
            label="To Date" type="date" size="small" value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}
          />
          <TextField
            label="Min Amount" type="number" size="small" value={amountMin}
            onChange={(e) => { setAmountMin(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
            sx={{ minWidth: 140 }}
          />
          <TextField
            label="Max Amount" type="number" size="small" value={amountMax}
            onChange={(e) => { setAmountMax(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
            sx={{ minWidth: 140 }}
          />
          {hasFilters && (
            <Button size="small" variant="text" onClick={() => {
              setSearch(''); setCategory(''); setFromDate(todayStr); setToDate(todayStr);
              setAmountMin(''); setAmountMax(''); setPage(0);
            }}>
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={7} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                    <TableCell>{new Date(row.date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>
                      <Chip label={row.category} size="small" />
                    </TableCell>
                    <TableCell>{row.description ?? '-'}</TableCell>
                    <TableCell>{row.vendor ?? '-'}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{fmt(row.amount)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/expense/${row.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <PermissionGate permission={Perms.Expense.Edit}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/expense/${row.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission={Perms.Expense.Delete}>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No records found</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.totalCount ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
