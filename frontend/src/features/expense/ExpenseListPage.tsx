import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetExpensesQuery, useGetExpenseSummaryQuery, useDeleteExpenseMutation } from './expenseApi';
import TableSkeleton from '../../components/common/TableSkeleton';
import type { ExpenseCategory } from '../../types/expense.types';

const categoryLabels: Record<ExpenseCategory, string> = {
  LabourExpenses: 'Labour Expenses',
  Salaries: 'Salaries',
  MachineryMaintenance: 'Machinery Maintenance',
  VehicleExpenses: 'Vehicle Expenses',
  Fuel: 'Fuel',
  PlantExpenses: 'Plant Expenses',
  CarpentryExpenses: 'Carpentry Expenses',
  ElectricalExpenses: 'Electrical Expenses',
  SuppliesMaterialPurchase: 'Supplies/Material Purchase',
  OfficeExpenses: 'Office Expenses',
  Miscellaneous: 'Miscellaneous',
};

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetExpensesQuery({
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    category: category || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const { data: summary } = useGetExpenseSummaryQuery();
  const [deleteExpense] = useDeleteExpenseMutation();

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

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Expense</Typography>
        <PermissionGate permission={Perms.Expense.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/expense/new')}>
            Add Expense
          </Button>
        </PermissionGate>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total All Time', value: summary?.totalAllTime ?? 0 },
          { label: 'This Month', value: summary?.totalThisMonth ?? 0 },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                  {fmt(card.value)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {(Object.keys(categoryLabels) as ExpenseCategory[]).map((k) => (
                <MenuItem key={k} value={k}>{categoryLabels[k]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={6} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={categoryLabels[row.category]} size="small" />
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.vendor ?? '-'}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                      {fmt(row.amount)}
                    </TableCell>
                    <TableCell align="right">
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
                    <TableCell colSpan={6} align="center">No records found</TableCell>
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
