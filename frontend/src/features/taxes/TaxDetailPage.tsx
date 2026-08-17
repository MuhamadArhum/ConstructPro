import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Divider, Stack, Typography,
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
import { useGetTaxRecordByIdQuery, useDeleteTaxRecordMutation } from './taxApi';
import type { TaxType } from '../../types/tax.types';

const taxTypeLabels: Record<TaxType, string> = {
  VAT: 'VAT',
  GST: 'GST',
  Income: 'Income Tax',
  Withholding: 'Withholding Tax (WHT)',
  Other: 'Other',
};

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

export default function TaxDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: record, isLoading } = useGetTaxRecordByIdQuery(id ?? '', { skip: !id });
  const [deleteRecord] = useDeleteTaxRecordMutation();

  const handleDelete = async () => {
    try {
      await deleteRecord(id!).unwrap();
      dispatch(showSnackbar({ message: 'Tax record deleted', severity: 'success' }));
      navigate('/tax');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete tax record', severity: 'error' }));
    }
    setDeleteOpen(false);
  };

  if (isLoading) return <Loader />;
  if (!record) return <Typography>Tax record not found</Typography>;

  const isOverdue = !record.isPaid && record.dueDate && new Date(record.dueDate) < new Date();

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Tax Management', to: '/tax' }, { label: record.code ?? record.id }]} />

      <Stack direction="row" sx={{ alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/tax')} variant="text">Back</Button>
        <Typography variant="h1" sx={{ flex: 1 }}>{record.code ?? 'Tax Record'}</Typography>
        <PermissionGate permission={Perms.Tax.Edit}>
          <Button startIcon={<EditIcon />} variant="outlined" onClick={() => navigate(`/tax/${id}/edit`)}>Edit</Button>
        </PermissionGate>
        <PermissionGate permission={Perms.Tax.Delete}>
          <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </PermissionGate>
      </Stack>

      {/* Top stat cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Amount</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(record.amount)}</Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Tax Type</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{taxTypeLabels[record.taxType]}</Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={record.isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
              color={record.isPaid ? 'success' : isOverdue ? 'error' : 'warning'}
              sx={{ mt: 0.5 }}
            />
          </CardContent>
        </Card>
      </Stack>

      {/* Detail fields */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Code</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{record.code ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Period</Typography>
              <Typography>{fmtDate(record.periodStart)} – {fmtDate(record.periodEnd)}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Due Date</Typography>
              <Typography sx={isOverdue ? { color: 'error.main', fontWeight: 600 } : {}}>
                {record.dueDate ? fmtDate(record.dueDate) : '-'}
                {isOverdue && ' (Overdue)'}
              </Typography>
            </Box>
            <Divider />
            {record.isPaid && (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary">Paid Date</Typography>
                  <Typography>{record.paidDate ? fmtDate(record.paidDate) : '-'}</Typography>
                </Box>
                <Divider />
              </>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Reference</Typography>
              <Typography>{record.reference ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Description</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.description ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{record.notes ?? '-'}</Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Created At</Typography>
              <Typography>{fmtDate(record.createdAt)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Tax Record"
        message={`Are you sure you want to delete tax record ${record.code ?? ''}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
