import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetLaboursQuery, useDeactivateLabourMutation } from './labourApi';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function LabourListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [trade, setTrade] = useState('');
  const [isActive, setIsActive] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data, isLoading } = useGetLaboursQuery({
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    trade: trade || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  });

  const [deactivateLabour] = useDeactivateLabourMutation();

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
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Labour</Typography>
        <PermissionGate permission={Perms.Labour.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/labour/new')}>
            Add Labour
          </Button>
        </PermissionGate>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search by name, trade, CNIC"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 240 }}
          />
          <TextField
            label="Trade"
            size="small"
            value={trade}
            onChange={(e) => { setTrade(e.target.value); setPage(0); }}
            sx={{ minWidth: 160 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
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
              {data?.items.map((row) => (
                <TableRow key={row.id} hover>
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
                    <Tooltip title="Attendance">
                      <IconButton size="small" onClick={() => navigate(`/labour/${row.id}/attendance`)}>
                        <EventNoteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <PermissionGate permission={Perms.Labour.Edit}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigate(`/labour/${row.id}/edit`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </PermissionGate>
                    <PermissionGate permission={Perms.Labour.Delete}>
                      <Tooltip title="Deactivate">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={!row.isActive}
                          onClick={() => setDeactivateId(row.id)}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.items.length && (
                <TableRow>
                  <TableCell colSpan={10} align="center">No records found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
