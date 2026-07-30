import { useState } from 'react';
import { Box, Button, Card, CardContent, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetTaxRecordsQuery, useGetTaxSummaryQuery, useDeleteTaxRecordMutation } from './taxApi';
import type { TaxType } from '../../types/tax.types';
import TableSkeleton from '../../components/common/TableSkeleton';

const taxTypeLabels: Record<TaxType, string> = { SalesTax: 'Sales Tax', IncomeTax: 'Income Tax', PRA: 'PRA', WithholdingTax: 'Withholding Tax (WHT)', SecurityDeposit: 'Security Deposit' };
const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function TaxListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [taxType, setTaxType] = useState('');
  const [isPaid, setIsPaid] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetTaxRecordsQuery({ pageNumber: page + 1, pageSize: rowsPerPage, search: search || undefined, taxType: taxType || undefined, isPaid: isPaid === '' ? undefined : isPaid === 'true' });
  const { data: summary } = useGetTaxSummaryQuery();
  const [deleteRecord] = useDeleteTaxRecordMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteRecord(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Tax record deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Tax Management</Typography>
        <PermissionGate permission={Perms.Tax.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tax/new')}>Add Tax Record</Button>
        </PermissionGate>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Tax', value: summary?.totalTax ?? 0, color: 'primary.main' },
          { label: 'Total Paid', value: summary?.totalPaid ?? 0, color: 'success.main' },
          { label: 'Total Pending', value: summary?.totalPending ?? 0, color: 'warning.main' },
          { label: 'Overdue Count', value: summary?.overdueCount ?? 0, color: 'error.main', isCount: true },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined"><CardContent>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>{card.isCount ? card.value : fmt(card.value)}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 180 } }}>
            <InputLabel>Tax Type</InputLabel>
            <Select label="Tax Type" value={taxType} onChange={(e) => { setTaxType(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {(Object.keys(taxTypeLabels) as TaxType[]).map((k) => <MenuItem key={k} value={k}>{taxTypeLabels[k]}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 140 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={isPaid} onChange={(e) => { setIsPaid(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Paid</MenuItem>
              <MenuItem value="false">Pending</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tax Type</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={7} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell><Chip label={taxTypeLabels[row.taxType]} size="small" variant="outlined" /></TableCell>
                    <TableCell>{new Date(row.periodStart).toLocaleDateString()} – {new Date(row.periodEnd).toLocaleDateString()}</TableCell>
                    <TableCell>{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{row.reference ?? '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(row.amount)}</TableCell>
                    <TableCell><Chip label={row.isPaid ? 'Paid' : 'Pending'} color={row.isPaid ? 'success' : 'warning'} size="small" /></TableCell>
                    <TableCell align="right">
                      <PermissionGate permission={Perms.Tax.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/tax/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      <PermissionGate permission={Perms.Tax.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={7} align="center">No tax records found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Tax Record" message="Are you sure?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
