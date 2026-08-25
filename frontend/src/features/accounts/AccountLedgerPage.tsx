import { useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetAccountLedgerQuery } from './accountsApi';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { fmtAmountAbs } from '../../utils/formatNumber';

const fmt = fmtAmountAbs;

export default function AccountLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const todayStr = new Date().toLocaleDateString('en-CA');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const { data, isLoading } = useGetAccountLedgerQuery({ id: id!, params: { startDate, endDate } }, { skip: !id });

  if (isLoading) return <Loader />;

  const account = data?.account;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Chart of Accounts', to: '/accounts' }, { label: account?.name ?? '…' }, { label: 'Ledger' }]} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1">{account?.name} — Ledger</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
            <Chip label={`Code: ${account?.code}`} size="small" variant="outlined" />
            <Chip label={account?.accountTypeDisplay} size="small" color="info" />
            <Chip label="Level 4" size="small" color="success" />
          </Stack>
        </Box>
        <Button onClick={() => navigate('/accounts')}>Back to Accounts</Button>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="From Date" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="To Date" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
      </Paper>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Entry No.</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Debit</TableCell>
              <TableCell align="right">Credit</TableCell>
              <TableCell align="right">Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.entries.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.entryNumber}</TableCell>
                <TableCell>{e.description ?? '-'}</TableCell>
                <TableCell>{e.reference ?? '-'}</TableCell>
                <TableCell align="right" sx={{ color: e.debit > 0 ? 'success.main' : 'text.secondary' }}>{e.debit > 0 ? fmt(e.debit) : '-'}</TableCell>
                <TableCell align="right" sx={{ color: e.credit > 0 ? 'error.main' : 'text.secondary' }}>{e.credit > 0 ? fmt(e.credit) : '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: e.balance >= 0 ? 'text.primary' : 'error.main' }}>{e.balance >= 0 ? fmt(e.balance) : `-${fmt(e.balance)}`}</TableCell>
              </TableRow>
            ))}
            {!data?.entries.length && <TableRow><TableCell colSpan={7} align="center">No transactions in this period</TableCell></TableRow>}
            {(data?.entries.length ?? 0) > 0 && (
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 700 }}>Closing Balance</TableCell>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 700, color: (data?.closingBalance ?? 0) >= 0 ? 'success.main' : 'error.main' }}>
                  {(data?.closingBalance ?? 0) >= 0 ? fmt(data?.closingBalance ?? 0) : `-${fmt(Math.abs(data?.closingBalance ?? 0))}`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
