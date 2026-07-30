import { useState } from 'react';
import { Box, Button, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useGetJournalEntriesQuery, useDeleteJournalEntryMutation } from './accountsApi';
import TableSkeleton from '../../components/common/TableSkeleton';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function JournalEntryListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetJournalEntriesQuery({ pageNumber: page + 1, pageSize: rowsPerPage, search: search || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined });
  const [deleteEntry] = useDeleteJournalEntryMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteEntry(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Journal entry deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Journal Entries</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/accounts')}>Chart of Accounts</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/accounts/journal/new')}>New Entry</Button>
        </Stack>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 200 }} />
          <TextField label="From Date" type="date" size="small" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="To Date" type="date" size="small" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
      </Paper>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Entry No.</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Total Debit</TableCell>
              <TableCell>Posted</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={7} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.entryNumber}</TableCell>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.reference ?? '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(row.totalDebit)}</TableCell>
                    <TableCell><Chip label={row.isPosted ? 'Posted' : 'Draft'} color={row.isPosted ? 'success' : 'warning'} size="small" /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/accounts/journal/${row.id}`)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={7} align="center">No journal entries found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Entry" message="Are you sure?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
