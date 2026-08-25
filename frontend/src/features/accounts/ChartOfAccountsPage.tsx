import { useState } from 'react';
import { Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import TableSkeleton from '../../components/common/TableSkeleton';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetAccountsQuery, useDeleteAccountMutation } from './accountsApi';
import type { AccountType } from '../../types/accounts.types';
import { fmtAmountSigned } from '../../utils/formatNumber';

const typeColors: Record<AccountType, 'info' | 'error' | 'warning' | 'success' | 'default'> = { Asset: 'info', Liability: 'error', Equity: 'warning', Revenue: 'success', Expense: 'default' };
const fmt = fmtAmountSigned;

export default function ChartOfAccountsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState('');
  const [accountType, setAccountType] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetAccountsQuery({
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    accountType: accountType || undefined,
    level: levelFilter ? Number(levelFilter) : undefined,
  });
  const [deleteAccount] = useDeleteAccountMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteAccount(deleteId).unwrap(); dispatch(showSnackbar({ message: 'Account deleted', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' })); }
    finally { setDeleteId(null); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Chart of Accounts</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/accounts/journal')}>Journal Entries</Button>
          <PermissionGate permission={Perms.Accounts.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/accounts/new')}>Add Account</Button>
          </PermissionGate>
        </Stack>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search" size="small" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }} sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}>
            <InputLabel>Account Type</InputLabel>
            <Select label="Account Type" value={accountType} onChange={(e) => { setAccountType(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] as AccountType[]).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 130 } }}>
            <InputLabel>Level</InputLabel>
            <Select label="Level" value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="1">Level 1</MenuItem>
              <MenuItem value="2">Level 2</MenuItem>
              <MenuItem value="3">Level 3</MenuItem>
              <MenuItem value="4">Level 4 (Leaf)</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Level</TableCell><TableCell>Type</TableCell><TableCell>Parent</TableCell><TableCell align="right">Balance</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={8} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell sx={{ paddingLeft: `${(row.level - 1) * 16 + 8}px` }}>{row.name}</TableCell>
                    <TableCell><Chip label={`L${row.level}`} size="small" variant="outlined" color={row.level === 4 ? 'success' : 'default'} /></TableCell>
                    <TableCell><Chip label={row.accountTypeDisplay} color={typeColors[row.accountType]} size="small" /></TableCell>
                    <TableCell>{row.parentName ?? '-'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{row.level === 4 ? fmt(row.balance) : '-'}</TableCell>
                    <TableCell><Chip label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="right">
                      {row.level === 4 && (
                        <Tooltip title="View Ledger">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/accounts/chart/${row.id}/ledger`)}>
                            <ReceiptLongIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <PermissionGate permission={Perms.Accounts.Edit}><Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/accounts/${row.id}/edit`)}><EditIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                      <PermissionGate permission={Perms.Accounts.Delete}><Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip></PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={8} align="center">No accounts found</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[20, 50, 100]} />
      </TableContainer>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Account" message="Are you sure?" confirmLabel="Delete" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
