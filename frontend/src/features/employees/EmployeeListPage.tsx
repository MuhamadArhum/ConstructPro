import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
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
import PaymentsIcon from '@mui/icons-material/Payments';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetEmployeesQuery, useDeactivateEmployeeMutation, useActivateEmployeeMutation } from './employeesApi';
import TableSkeleton from '../../components/common/TableSkeleton';
import { fmtAmount } from '../../utils/formatNumber';

const fmt = fmtAmount;

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [isActive, setIsActive] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data, isLoading } = useGetEmployeesQuery({
    pageNumber: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    department: department || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  });

  const [deactivateEmployee] = useDeactivateEmployeeMutation();
  const [activateEmployee] = useActivateEmployeeMutation();

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    try {
      await deactivateEmployee(deactivateId).unwrap();
      dispatch(showSnackbar({ message: 'Employee deactivated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to deactivate employee', severity: 'error' }));
    } finally {
      setDeactivateId(null);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateEmployee(id).unwrap();
      dispatch(showSnackbar({ message: 'Employee activated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to activate employee', severity: 'error' }));
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Employees</Typography>
        <PermissionGate permission={Perms.Employees.Create}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/employees/new')}>
            Add Employee
          </Button>
        </PermissionGate>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search by code, name, designation, department"
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 280 } }}
          />
          <TextField
            label="Department"
            size="small"
            value={department}
            onChange={(e) => { setDepartment(e.target.value); setPage(0); }}
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
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>CNIC</TableCell>
              <TableCell align="right">Basic Salary</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={10} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.fullName}</TableCell>
                    <TableCell>{row.designation ?? '-'}</TableCell>
                    <TableCell>{row.department ?? '-'}</TableCell>
                    <TableCell>{row.phoneNumber ?? '-'}</TableCell>
                    <TableCell>{row.cnic ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(row.basicSalary)}</TableCell>
                    <TableCell>{new Date(row.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.isActive ? 'Active' : 'Inactive'}
                        color={row.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={row.isActive ? 'Salary' : 'Employee is inactive'}>
                        <span>
                          <IconButton size="small" color="primary" disabled={!row.isActive} onClick={() => navigate(`/employees/${row.id}/salary`)}>
                            <PaymentsIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <PermissionGate permission={Perms.Employees.Edit}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/employees/${row.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission={Perms.Employees.Edit}>
                        {!row.isActive && (
                          <Tooltip title="Activate">
                            <IconButton size="small" color="success" onClick={() => handleActivate(row.id)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </PermissionGate>
                      <PermissionGate permission={Perms.Employees.Delete}>
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
                    <TableCell colSpan={10} align="center">No records found</TableCell>
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
        title="Deactivate Employee"
        message="Are you sure you want to deactivate this employee?"
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateId(null)}
      />
    </Box>
  );
}
