import { useState } from 'react';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert, Box, Chip, IconButton, InputAdornment, Paper, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import { useGetAuditLogsQuery } from './auditLogsApi';
import Loader from '../../components/common/Loader';

export default function AuditLogListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError, refetch, isFetching } = useGetAuditLogsQuery({
    search: search || undefined,
    pageNumber: page + 1,
    pageSize,
  }, { refetchOnMountOrArgChange: true });

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Audit Logs</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()} disabled={isFetching}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by email or action…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }}
          size="small"
          sx={{ width: { xs: '100%', sm: 320 } }}
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
      </Box>

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
                      {search ? 'No logs match your search.' : 'No audit logs found.'}
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
