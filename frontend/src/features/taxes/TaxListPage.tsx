import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, FormControl, Grid, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetTaxRecordsQuery, useGetTaxSummaryQuery, useDeleteTaxRecordMutation, useUpdateTaxRecordMutation } from './taxApi';
import type { TaxType } from '../../types/tax.types';
import TableSkeleton from '../../components/common/TableSkeleton';

const taxTypeLabels: Record<TaxType, string> = {
  VAT: 'VAT',
  GST: 'GST',
  Income: 'Income Tax',
  Withholding: 'Withholding Tax (WHT)',
  Other: 'Other',
};

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

function exportToCsv(rows: any[]) {
  const headers = ['Code', 'Tax Type', 'Period Start', 'Period End', 'Due Date', 'Reference', 'Amount', 'Status'];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.code ?? '',
        taxTypeLabels[r.taxType as TaxType] ?? r.taxType,
        fmtDate(r.periodStart),
        fmtDate(r.periodEnd),
        r.dueDate ? fmtDate(r.dueDate) : '',
        r.reference ?? '',
        r.amount,
        r.isPaid ? 'Paid' : 'Pending',
      ].join(','),
    ),
  ].join('\n');
  const blob = new Blob([lines], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tax-records-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TaxListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const todayStr = new Date().toLocaleDateString('en-CA');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [taxType, setTaxType] = useState('');
  const [isPaid, setIsPaid] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);

  const query = {
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    taxType: taxType || undefined,
    isPaid: isPaid === '' ? undefined : isPaid === 'true',
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, isLoading } = useGetTaxRecordsQuery(query);
  const { data: summary } = useGetTaxSummaryQuery();
  const [deleteRecord] = useDeleteTaxRecordMutation();
  const [updateRecord] = useUpdateTaxRecordMutation();

  const hasFilters = !!(search || taxType || isPaid || startDate !== todayStr || endDate !== todayStr);
  const now = new Date();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRecord(deleteId).unwrap();
      dispatch(showSnackbar({ message: 'Tax record deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!markPaidId) return;
    const row = data?.items.find((r) => r.id === markPaidId);
    if (!row) return;
    try {
      await updateRecord({
        id: markPaidId,
        data: {
          taxType: row.taxType,
          amount: row.amount,
          isPaid: true,
          paidDate: new Date().toISOString().split('T')[0],
          periodStart: row.periodStart.split('T')[0],
          periodEnd: row.periodEnd.split('T')[0],
          code: row.code ?? undefined,
          dueDate: row.dueDate?.split('T')[0],
          reference: row.reference,
          description: row.description,
          notes: row.notes,
        },
      }).unwrap();
      dispatch(showSnackbar({ message: 'Tax record marked as paid', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to mark as paid', severity: 'error' }));
    } finally {
      setMarkPaidId(null);
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
        <Typography variant="h1">Tax Management</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>Export CSV</Button>
          <PermissionGate permission={Perms.Tax.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tax/new')}>Add Tax Record</Button>
          </PermissionGate>
        </Stack>
      </Stack>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Tax', value: summary?.totalTax ?? 0, color: 'primary.main' },
          { label: 'Total Paid', value: summary?.totalPaid ?? 0, color: 'success.main' },
          { label: 'Total Pending', value: summary?.totalPending ?? 0, color: 'warning.main' },
          { label: 'Overdue Amount', value: summary?.overdueAmount ?? 0, color: 'error.main' },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>{fmt(card.value)}</Typography>
                {card.label === 'Overdue Amount' && (summary?.overdueCount ?? 0) > 0 && (
                  <Typography variant="caption" color="error.main">{summary?.overdueCount} record{summary!.overdueCount !== 1 ? 's' : ''} overdue</Typography>
                )}
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
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tax Type</InputLabel>
            <Select label="Tax Type" value={taxType} onChange={(e) => { setTaxType(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {(Object.keys(taxTypeLabels) as TaxType[]).map((k) => (
                <MenuItem key={k} value={k}>{taxTypeLabels[k]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={isPaid} onChange={(e) => { setIsPaid(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Paid</MenuItem>
              <MenuItem value="false">Pending</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Period From" type="date" size="small" value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}
          />
          <TextField
            label="Period To" type="date" size="small" value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 150 }}
          />
          {hasFilters && (
            <Button size="small" variant="text" onClick={() => {
              setSearch(''); setTaxType(''); setIsPaid(''); setStartDate(todayStr); setEndDate(todayStr); setPage(0);
            }}>
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
            {isLoading ? <TableSkeleton cols={8} /> : (
              <>
                {data?.items.map((row) => {
                  const isOverdue = !row.isPaid && row.dueDate && new Date(row.dueDate) < now;
                  return (
                    <TableRow key={row.id} hover sx={isOverdue ? { bgcolor: 'error.50' } : {}}>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{(row as any).code ?? '-'}</TableCell>
                      <TableCell><Chip label={taxTypeLabels[row.taxType]} size="small" variant="outlined" /></TableCell>
                      <TableCell>{fmtDate(row.periodStart)} – {fmtDate(row.periodEnd)}</TableCell>
                      <TableCell sx={isOverdue ? { color: 'error.main', fontWeight: 600 } : {}}>
                        {row.dueDate ? fmtDate(row.dueDate) : '-'}
                      </TableCell>
                      <TableCell>{row.reference ?? '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(row.amount)}</TableCell>
                      <TableCell>
                        <Chip label={row.isPaid ? 'Paid' : 'Pending'} color={row.isPaid ? 'success' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => navigate(`/tax/${row.id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!row.isPaid && (
                          <PermissionGate permission={Perms.Tax.Edit}>
                            <Tooltip title="Mark as Paid">
                              <IconButton size="small" color="success" onClick={() => setMarkPaidId(row.id)}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGate>
                        )}
                        <PermissionGate permission={Perms.Tax.Edit}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => navigate(`/tax/${row.id}/edit`)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </PermissionGate>
                        <PermissionGate permission={Perms.Tax.Delete}>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </PermissionGate>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data?.items.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No tax records found</TableCell>
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
        title="Delete Tax Record"
        message="Are you sure you want to delete this tax record?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
      <ConfirmDialog
        open={Boolean(markPaidId)}
        title="Mark as Paid"
        message="Mark this tax record as paid? Today's date will be set as the paid date."
        confirmLabel="Mark Paid"
        onConfirm={handleMarkPaid}
        onCancel={() => setMarkPaidId(null)}
      />
    </Box>
  );
}
