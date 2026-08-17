import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGate from '../../components/common/PermissionGate';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { Perms } from '../../utils/permissions';
import { useGetExpenseByIdQuery, useDeleteExpenseMutation } from './expenseApi';
import { useState } from 'react';
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
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: expense, isLoading } = useGetExpenseByIdQuery(id ?? '', { skip: !id });
  const [deleteExpense] = useDeleteExpenseMutation();

  const handleDelete = async () => {
    try {
      await deleteExpense(id!).unwrap();
      dispatch(showSnackbar({ message: 'Expense deleted', severity: 'success' }));
      navigate('/expense');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete expense', severity: 'error' }));
    }
    setDeleteOpen(false);
  };

  if (isLoading) return <Loader />;
  if (!expense) return <Typography>Expense record not found</Typography>;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Expenses', to: '/expense' }, { label: expense.code ?? expense.id }]} />

      <Stack direction="row" sx={{ alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/expense')} variant="text">Back</Button>
        <Typography variant="h1" sx={{ flex: 1 }}>{expense.code ?? 'Expense Detail'}</Typography>
        <PermissionGate permission={Perms.Expense.Edit}>
          <Button startIcon={<EditIcon />} variant="outlined" onClick={() => navigate(`/expense/${id}/edit`)}>Edit</Button>
        </PermissionGate>
        <PermissionGate permission={Perms.Expense.Delete}>
          <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </PermissionGate>
      </Stack>

      {/* Amount / Category / Date cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Amount</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(expense.amount)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Category</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{categoryLabels[expense.category]}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{fmtDate(expense.date)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail fields */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Code</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{expense.code ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{expense.description ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Vendor / Supplier</Typography>
              <Typography>{expense.vendor ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Category</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip label={categoryLabels[expense.category]} size="small" />
              </Box>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Created At</Typography>
              <Typography>{fmtDate(expense.createdAt)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Expense"
        message={`Are you sure you want to delete expense ${expense.code ?? ''}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
