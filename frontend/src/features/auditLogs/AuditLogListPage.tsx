import { useState } from 'react';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  Alert, Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useGetAuditLogsQuery } from './auditLogsApi';
import Loader from '../../components/common/Loader';

const ACTION_OPTIONS = ['All', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] as const;

export default function AuditLogListPage() {
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditLogsQuery({
    search: search || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    action: actionFilter !== 'All' ? actionFilter : undefined,
    pageNumber: page + 1,
    pageSize,
  }, { refetchOnMountOrArgChange: true });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setPage(0);
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setPage(0);
  };

  const handleActionChange = (e: SelectChangeEvent<string>) => {
    setActionFilter(e.target.value);
    setPage(0);
  };

  const handleExportCSV = () => {
    const logs = data?.items ?? [];
    const headers = ['Timestamp', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Status'];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.userEmail ?? '',
      log.action,
      log.entityType ?? '',
      log.entityId ?? '',
      log.ipAddress ?? '',
      log.succeeded ? 'Success' : 'Failed',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Audit Logs</Typography>
        <Stack direction="row" spacing={1}>
          {data && (
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportCSV}>
              Export CSV
            </Button>
          )}
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} disabled={isFetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by email or action…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }}
            size="small"
            sx={{ width: { xs: '100%', sm: 260 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 150 }}
          />
          <Select
            value={actionFilter}
            onChange={handleActionChange}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {ACTION_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt === 'All' ? 'All Actions' : opt}</MenuItem>
            ))}
          </Select>
        </Stack>
      </Paper>

      {isLoading && <Loader />}
      {isError && <Alert severity="error">Failed to load audit logs.</Alert>}

      {data && (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data.items ?? []).map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.userEmail ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {log.action}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.entityType
                        ? `${log.entityType}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}`
                        : '—'}
                    </TableCell>
                    <TableCell>{log.ipAddress ?? '—'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={log.succeeded ? <CheckCircleIcon /> : <CancelIcon />}
                        label={log.succeeded ? 'Success' : 'Failed'}
                        color={log.succeeded ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {(data.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {search || fromDate || toDate || actionFilter !== 'All'
                        ? 'No logs match your filters.'
                        : 'No audit logs found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data.totalCount}
            page={page}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[pageSize]}
            onPageChange={(_, newPage) => setPage(newPage)}
          />
        </>
      )}
    </>
  );
}
