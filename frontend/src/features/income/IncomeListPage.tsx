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
import { useGetIncomesQuery, useGetIncomeSummaryQuery, useDeleteIncomeMutation } from './incomeApi';
import TableSkeleton from '../../components/common/TableSkeleton';
import type { IncomeCategory } from '../../types/income.types';

const categoryLabels: Record<IncomeCategory, string> = {
  CustomerPayment: 'Customer Payment',
  ProjectIncome: 'Project Income',
  OtherIncome: 'Other Income',
};

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function IncomeListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetIncomesQuery({
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    category: category || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const { data: summary } = useGetIncomeSummaryQuery();
  const [deleteIncome] = useDeleteIncomeMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteIncome(deleteId).unwrap();
      dispatch(showSnackbar({ message: 'Income deleted successfully', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete income', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Income</Typography>
        <PermissionGate permission={Perms.Income.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/income/new')}>
            Add Income
          </Button>
        </PermissionGate>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total All Time', value: summary?.totalAllTime ?? 0, color: 'success.main' },
          { label: 'This Month', value: summary?.totalThisMonth ?? 0, color: 'primary.main' },
          { label: 'Total Paid', value: summary?.totalPaid ?? 0, color: 'success.main' },
          { label: 'Total Pending', value: summary?.totalPending ?? 0, color: 'warning.main' },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>
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
            label="Search by code / description"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 240 } }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}>
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All</MenuItem>
              {(Object.keys(categoryLabels) as IncomeCategory[]).map((k) => (
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
          {(fromDate || toDate || search || category) && (
            <Button size="small" onClick={() => { setSearch(''); setCategory(''); setFromDate(''); setToDate(''); setPage(0); }}>
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Project</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={9} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={categoryLabels[row.category]} size="small" />
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.customerName ?? '-'}</TableCell>
                    <TableCell>{row.projectName ?? '-'}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {fmt(row.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.isPaid ? 'Paid' : 'Pending'}
                        color={row.isPaid ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <PermissionGate permission={Perms.Income.Edit}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/income/${row.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission={Perms.Income.Delete}>
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
                    <TableCell colSpan={9} align="center">No records found</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
        {(data?.totalCount ?? 0) > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block', borderTop: '1px solid', borderColor: 'divider' }}>
            Showing {Math.min(page * rowsPerPage + 1, data?.totalCount ?? 0)}–{Math.min((page + 1) * rowsPerPage, data?.totalCount ?? 0)} of {data?.totalCount ?? 0} records
          </Typography>
        )}
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
        title="Delete Income"
        message="Are you sure you want to delete this income record?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
