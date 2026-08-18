import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useGetEmployeesQuery, useGetAllSalariesQuery, useBulkProcessSalaryMutation } from './employeesApi';
import type { EmployeeDto } from '../../types/employee.types';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface RowState {
  employeeId: string;
  employee: EmployeeDto;
  basicSalary: string;
  bonus: string;
  deductions: string;
  daysPresent: string;
  totalDays: string;
  remarks: string;
  included: boolean;
}

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

function calcNet(row: RowState): number {
  const basic = parseFloat(row.basicSalary) || 0;
  const bonus = parseFloat(row.bonus) || 0;
  const deductions = parseFloat(row.deductions) || 0;
  return basic + bonus - deductions;
}

export default function BulkSalaryPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<RowState[]>([]);
  const [result, setResult] = useState<{ processed: number; errors: string[] } | null>(null);

  const { data: employeesData, isLoading: empLoading } = useGetEmployeesQuery({ all: true });
  const { data: existingSalaries } = useGetAllSalariesQuery({ month, year });
  const [bulkProcess, { isLoading: processing }] = useBulkProcessSalaryMutation();

  // Build rows when employees or month/year changes
  useEffect(() => {
    if (!employeesData?.items) return;
    setRows(
      employeesData.items.map((emp) => ({
        employeeId: emp.id,
        employee: emp,
        basicSalary: String(emp.basicSalary),
        bonus: '0',
        deductions: '0',
        daysPresent: '26',
        totalDays: '30',
        remarks: '',
        included: true,
      })),
    );
    setResult(null);
  }, [employeesData, month, year]);

  const existingIds = new Set((existingSalaries ?? []).map((s) => s.employeeId));

  const updateRow = useCallback((employeeId: string, field: keyof RowState, value: string | boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.employeeId === employeeId ? { ...r, [field]: value } : r)),
    );
  }, []);

  const toggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, included: checked })));
  };

  const includedRows = rows.filter((r) => r.included);

  const handleProcess = async () => {
    if (!includedRows.length) {
      dispatch(showSnackbar({ message: 'No employees selected', severity: 'warning' }));
      return;
    }
    try {
      const res = await bulkProcess({
        month,
        year,
        entries: includedRows.map((r) => ({
          employeeId: r.employeeId,
          basicSalary: parseFloat(r.basicSalary) || 0,
          bonus: parseFloat(r.bonus) || 0,
          deductions: parseFloat(r.deductions) || 0,
          daysPresent: parseInt(r.daysPresent) || 0,
          totalDays: parseInt(r.totalDays) || 30,
          remarks: r.remarks || undefined,
        })),
      }).unwrap();
      setResult(res);
      dispatch(showSnackbar({
        message: `${res.processed} salary records processed successfully`,
        severity: res.errors.length > 0 ? 'warning' : 'success',
      }));
    } catch {
      dispatch(showSnackbar({ message: 'Bulk salary processing failed', severity: 'error' }));
    }
  };

  const allChecked = rows.length > 0 && rows.every((r) => r.included);
  const someChecked = rows.some((r) => r.included) && !allChecked;

  return (
    <Box>
      <AppBreadcrumbs
        crumbs={[{ label: 'Employees', to: '/employees' }, { label: 'Bulk Salary Processing' }]}
      />

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/employees')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">Bulk Salary Processing</Typography>
          <Typography variant="body2" color="text.secondary">
            Process salary for multiple employees at once
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <GroupsIcon />}
          onClick={handleProcess}
          disabled={processing || !includedRows.length}
        >
          {processing ? 'Processing…' : `Process ${includedRows.length} Selected`}
        </Button>
      </Stack>

      {/* Month/Year Selector */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Month</InputLabel>
            <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {monthNames.map((m, i) => (
                <MenuItem key={i} value={i + 1}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Year"
            type="number"
            size="small"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || now.getFullYear())}
            sx={{ width: 100 }}
          />
          <Typography variant="body2" color="text.secondary">
            {empLoading ? 'Loading employees…' : `${rows.length} active employees`}
          </Typography>
        </Stack>
      </Paper>

      {/* Result Alert */}
      {result && (
        <Alert
          severity={result.errors.length > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setResult(null)}
        >
          <strong>{result.processed}</strong> salaries processed successfully.
          {result.errors.length > 0 && (
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </Box>
          )}
        </Alert>
      )}

      {empLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someChecked}
                    checked={allChecked}
                    onChange={(e) => toggleAll(e.target.checked)}
                    size="small"
                  />
                </TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Designation</TableCell>
                <TableCell sx={{ minWidth: 110 }}>Basic Salary</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Bonus</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Deductions</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Days Present</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Total Days</TableCell>
                <TableCell align="right">Net Salary</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const alreadyProcessed = existingIds.has(row.employeeId);
                const net = calcNet(row);
                return (
                  <TableRow
                    key={row.employeeId}
                    hover
                    sx={{ opacity: row.included ? 1 : 0.45 }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={row.included}
                        onChange={(e) => updateRow(row.employeeId, 'included', e.target.checked)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.employee.fullName}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {row.employee.code ?? '-'}
                    </TableCell>
                    <TableCell>{row.employee.designation ?? '-'}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.basicSalary}
                        onChange={(e) => updateRow(row.employeeId, 'basicSalary', e.target.value)}
                        sx={{ width: 100 }}
                        disabled={!row.included}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.bonus}
                        onChange={(e) => updateRow(row.employeeId, 'bonus', e.target.value)}
                        sx={{ width: 90 }}
                        disabled={!row.included}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.deductions}
                        onChange={(e) => updateRow(row.employeeId, 'deductions', e.target.value)}
                        sx={{ width: 90 }}
                        disabled={!row.included}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.daysPresent}
                        onChange={(e) => updateRow(row.employeeId, 'daysPresent', e.target.value)}
                        sx={{ width: 70 }}
                        disabled={!row.included}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.totalDays}
                        onChange={(e) => updateRow(row.employeeId, 'totalDays', e.target.value)}
                        sx={{ width: 70 }}
                        disabled={!row.included}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                      {fmt(net)}
                    </TableCell>
                    <TableCell>
                      {alreadyProcessed ? (
                        <Chip
                          label="Already processed — will update"
                          color="warning"
                          size="small"
                          sx={{ fontSize: 10 }}
                        />
                      ) : (
                        <Chip label="Pending" color="default" size="small" sx={{ fontSize: 10 }} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No active employees found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Bottom action bar */}
      {rows.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {includedRows.length} of {rows.length} employees selected
              {includedRows.length > 0 && (
                <> &bull; Estimated total net: <strong>{fmt(includedRows.reduce((s, r) => s + calcNet(r), 0))}</strong></>
              )}
            </Typography>
            <Button
              variant="contained"
              startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <GroupsIcon />}
              onClick={handleProcess}
              disabled={processing || !includedRows.length}
            >
              {processing ? 'Processing…' : `Process ${includedRows.length} Selected`}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
