import { useState } from 'react';
import {
  Box,
  Button,
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
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentsIcon from '@mui/icons-material/Payments';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useGetAllSalariesQuery } from './employeesApi';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function exportCSV(month: number, year: number, rows: ReturnType<typeof useGetAllSalariesQuery>['data']) {
  if (!rows?.length) return;

  const headers = ['Code', 'Name', 'Designation', 'Department', 'Basic', 'Bonus', 'Deductions', 'Net Salary', 'Days Present', 'Remarks'];
  const csvRows = rows.map((r) => [
    r.employee?.code ?? '',
    r.employee?.fullName ?? '',
    r.employee?.designation ?? '',
    r.employee?.department ?? '',
    r.basicSalary,
    r.bonus,
    r.deductions,
    r.netSalary,
    `${r.daysPresent}/${r.totalDays}`,
    r.remarks ?? '',
  ]);

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `salary-summary-${year}-${String(month).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SalarySummaryPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: salaries, isLoading } = useGetAllSalariesQuery({ month, year });

  const totals = salaries?.reduce(
    (acc, r) => ({
      basic: acc.basic + r.basicSalary,
      bonus: acc.bonus + r.bonus,
      deductions: acc.deductions + r.deductions,
      net: acc.net + r.netSalary,
    }),
    { basic: 0, bonus: 0, deductions: 0, net: 0 },
  );

  return (
    <Box>
      <AppBreadcrumbs
        crumbs={[{ label: 'Employees', to: '/employees' }, { label: 'Salary Summary' }]}
      />

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/employees')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">Salary Summary</Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly salary overview for all employees
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => exportCSV(month, year, salaries)}
          disabled={!salaries?.length}
        >
          Export CSV
        </Button>
      </Stack>

      {/* Month/Year Selector */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Employee Name</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Basic</TableCell>
              <TableCell align="right">Bonus</TableCell>
              <TableCell align="right">Deductions</TableCell>
              <TableCell align="right">Net Salary</TableCell>
              <TableCell>Days Present</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} align="center">Loading…</TableCell>
              </TableRow>
            ) : (
              <>
                {salaries?.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {row.employee?.code ?? '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.employee?.fullName ?? '-'}</TableCell>
                    <TableCell>{row.employee?.designation ?? '-'}</TableCell>
                    <TableCell>{row.employee?.department ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(row.basicSalary)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{fmt(row.bonus)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(row.deductions)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {fmt(row.netSalary)}
                    </TableCell>
                    <TableCell>{row.daysPresent}/{row.totalDays}</TableCell>
                    <TableCell>{row.remarks ?? '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Salary">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/employees/${row.employeeId}/salary`)}
                        >
                          <PaymentsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals Row */}
                {salaries && salaries.length > 0 && totals && (
                  <TableRow sx={{ bgcolor: '#f0f4f8' }}>
                    <TableCell colSpan={4} sx={{ fontWeight: 700 }}>
                      Totals ({salaries.length} employees)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.basic)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(totals.bonus)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(totals.deductions)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(totals.net)}</TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                )}

                {!salaries?.length && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No salary records for {monthNames[month - 1]} {year}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
