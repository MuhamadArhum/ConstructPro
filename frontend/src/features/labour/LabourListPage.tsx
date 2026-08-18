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
import EventNoteIcon from '@mui/icons-material/EventNote';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import GroupOffIcon from '@mui/icons-material/GroupOff';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import {
  useGetLaboursQuery,
  useDeactivateLabourMutation,
  useActivateLabourMutation,
  useGetLabourSummaryQuery,
} from './labourApi';
import TableSkeleton from '../../components/common/TableSkeleton';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

interface SummaryCardProps {
  label: string;
  value: string | number;
  color: 'info' | 'default' | 'warning' | 'error';
  icon: React.ReactNode;
}

function SummaryCard({ label, value, color, icon }: SummaryCardProps) {
  const colorMap: Record<string, string> = {
    info: '#1976d2',
    default: '#757575',
    warning: '#ed6c02',
    error: '#d32f2f',
  };
  const bgMap: Record<string, string> = {
    info: '#e3f2fd',
    default: '#f5f5f5',
    warning: '#fff3e0',
    error: '#ffebee',
  };
  return (
    <Card variant="outlined" sx={{ borderColor: colorMap[color], bgcolor: bgMap[color] }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ color: colorMap[color] }}>{icon}</Box>
          <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colorMap[color], lineHeight: 1.2 }}>{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function LabourListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [trade, setTrade] = useState('');
  const [isActive, setIsActive] = useState('');
  const [joinDateFrom, setJoinDateFrom] = useState('');
  const [joinDateTo, setJoinDateTo] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data, isLoading } = useGetLaboursQuery({
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    trade: trade || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
    joinDateFrom: joinDateFrom || undefined,
    joinDateTo: joinDateTo || undefined,
  });

  const { data: summary } = useGetLabourSummaryQuery();

  const [deactivateLabour] = useDeactivateLabourMutation();
  const [activateLabour] = useActivateLabourMutation();

  const hasFilters = Boolean(search || trade || isActive || joinDateFrom || joinDateTo);

  const handleClearFilters = () => {
    setSearch('');
    setTrade('');
    setIsActive('');
    setJoinDateFrom('');
    setJoinDateTo('');
    setPage(0);
  };

  const handleActivate = async (id: string) => {
    try {
      await activateLabour(id).unwrap();
      dispatch(showSnackbar({ message: 'Labour activated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to activate labour', severity: 'error' }));
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await deactivateLabour(deactivateId).unwrap();
      dispatch(showSnackbar({ message: 'Labour deactivated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to deactivate labour', severity: 'error' }));
    } finally {
      setDeactivateId(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">Labour</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={() => navigate('/labour/attendance/bulk')}
            size="small"
          >
            Bulk Attendance
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReceiptLongIcon />}
            onClick={() => navigate('/labour/payroll')}
            size="small"
          >
            Monthly Payroll
          </Button>
          <PermissionGate permission={Perms.Labour.Create}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/labour/new')}>
              Add Labour
            </Button>
          </PermissionGate>
        </Stack>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            label="Total Active Workers"
            value={summary?.totalActive ?? '—'}
            color="info"
            icon={<PeopleAltIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            label="Total Inactive Workers"
            value={summary?.totalInactive ?? '—'}
            color="default"
            icon={<GroupOffIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            label="Daily Wage Bill"
            value={summary ? fmt(summary.totalDailyWageBill) : '—'}
            color="warning"
            icon={<AttachMoneyIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            label="Total Pending Advances"
            value={summary ? fmt(summary.totalPendingAdvances) : '—'}
            color="error"
            icon={<AccountBalanceWalletIcon />}
          />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField
            label="Search by code, name, trade, phone"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 240 } }}
          />
          <TextField
            label="Trade"
            size="small"
            value={trade}
            onChange={(e) => { setTrade(e.target.value); setPage(0); }}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 140 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Join Date From"
            type="date"
            size="small"
            value={joinDateFrom}
            onChange={(e) => { setJoinDateFrom(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
          />
          <TextField
            label="Join Date To"
            type="date"
            size="small"
            value={joinDateTo}
            onChange={(e) => { setJoinDateTo(e.target.value); setPage(0); }}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}
          />
          {hasFilters && (
            <Button size="small" onClick={handleClearFilters}>Clear Filters</Button>
          )}
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Trade</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>CNIC</TableCell>
              <TableCell align="right">Daily Wage</TableCell>
              <TableCell align="right">OT Rate/hr</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total Advances</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={11} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell>{row.trade ?? '-'}</TableCell>
                    <TableCell>{row.phoneNumber ?? '-'}</TableCell>
                    <TableCell>{row.cnic ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(row.dailyWage)}</TableCell>
                    <TableCell align="right">{fmt(row.overtimeRatePerHour)}</TableCell>
                    <TableCell>{new Date(row.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.isActive ? 'Active' : 'Inactive'}
                        color={row.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'warning.main' }}>
                      {fmt(row.totalAdvances)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Profile">
                        <IconButton size="small" onClick={() => navigate(`/labour/${row.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Attendance">
                        <IconButton size="small" onClick={() => navigate(`/labour/${row.id}/attendance`)}>
                          <EventNoteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Payroll">
                        <IconButton size="small" onClick={() => navigate(`/labour/${row.id}/payroll`)}>
                          <MonetizationOnIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <PermissionGate permission={Perms.Labour.Edit}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/labour/${row.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission={Perms.Labour.Edit}>
                        {!row.isActive && (
                          <Tooltip title="Activate">
                            <IconButton size="small" color="success" onClick={() => handleActivate(row.id)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </PermissionGate>
                      <PermissionGate permission={Perms.Labour.Delete}>
                        <Tooltip title="Deactivate">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={!row.isActive}
                              onClick={() => setDeactivateId(row.id)}
                            >
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">No records found</TableCell>
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
        open={Boolean(deactivateId)}
        title="Deactivate Labour"
        message="Are you sure you want to deactivate this labour?"
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
      />
    </Box>
  );
}
