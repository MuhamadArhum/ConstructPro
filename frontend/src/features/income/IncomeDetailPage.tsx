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
import { useGetIncomeByIdQuery, useDeleteIncomeMutation } from './incomeApi';
import { useState } from 'react';
import { fmtAmount } from '../../utils/formatNumber';

const categoryLabels: Record<string, string> = {
  CustomerPayment: 'Customer Payment',
  ProjectIncome: 'Project Income',
  OtherIncome: 'Other Income',
};

const fmt = fmtAmount;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

export default function IncomeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: income, isLoading } = useGetIncomeByIdQuery(id ?? '', { skip: !id });
  const [deleteIncome] = useDeleteIncomeMutation();

  const handleDelete = async () => {
    try {
      await deleteIncome(id!).unwrap();
      dispatch(showSnackbar({ message: 'Income deleted', severity: 'success' }));
      navigate('/income');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete income', severity: 'error' }));
    }
    setDeleteOpen(false);
  };

  if (isLoading) return <Loader />;
  if (!income) return <Typography>Income record not found</Typography>;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Income', to: '/income' }, { label: income.code ?? income.id }]} />

      <Stack direction="row" sx={{ alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/income')} variant="text">
          Back
        </Button>
        <Typography variant="h1" sx={{ flex: 1 }}>
          {income.code ?? 'Income Detail'}
        </Typography>
        <Chip
          label={income.isPaid ? 'Paid' : 'Pending'}
          color={income.isPaid ? 'success' : 'warning'}
        />
        <PermissionGate permission={Perms.Income.Edit}>
          <Button startIcon={<EditIcon />} variant="outlined" onClick={() => navigate(`/income/${id}/edit`)}>
            Edit
          </Button>
        </PermissionGate>
        <PermissionGate permission={Perms.Income.Delete}>
          <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </PermissionGate>
      </Stack>

      {/* Amount card */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Amount</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(income.amount)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Category</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{categoryLabels[income.category]}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Date</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{fmtDate(income.date)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Details */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Code</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{income.code ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{income.description ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Customer</Typography>
              <Typography>{income.customerName ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Project</Typography>
              <Typography>{income.projectName ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Payment Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip label={income.isPaid ? 'Paid' : 'Pending'} color={income.isPaid ? 'success' : 'warning'} size="small" />
              </Box>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Created At</Typography>
              <Typography>{fmtDate(income.createdAt)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Income"
        message={`Are you sure you want to delete income ${income.code ?? ''}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
