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
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import { useGetEmployeesQuery, useDeactivateEmployeeMutation } from './employeesApi';
import TableSkeleton from '../../components/common/TableSkeleton';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
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
            label="Search by name, designation, department"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0); } }}
            onBlur={() => { setSearch(searchInput); setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 280 } }}
          />
          <TextField
            label="Department"
            size="small"
            value={departmentInput}
            onChange={(e) => setDepartmentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setDepartment(departmentInput); setPage(0); } }}
            onBlur={() => { setDepartment(departmentInput); setPage(0); }}
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
            {isLoading ? <TableSkeleton cols={9} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover>
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
                      <Tooltip title="Salary">
                        <IconButton size="small" color="primary" onClick={() => navigate(`/employees/${row.id}/salary`)}>
                          <PaymentsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <PermissionGate permission={Perms.Employees.Edit}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/employees/${row.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </PermissionGate>
                      <PermissionGate permission={Perms.Employees.Delete}>
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
                    <TableCell colSpan={9} align="center">No records found</TableCell>
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
