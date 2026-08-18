import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
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
  Tooltip,
  Typography,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import TableSkeleton from '../../components/common/TableSkeleton';
import { useGetLabourPayrollSummaryQuery } from './labourApi';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function LabourPayrollSummaryPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: summaryList, isLoading } = useGetLabourPayrollSummaryQuery({ month, year });

  const totals = (summaryList ?? []).reduce(
    (acc, row) => ({
      wagesEarned: acc.wagesEarned + row.wagesEarned,
      overtimePay: acc.overtimePay + row.overtimePay,
      totalAdvances: acc.totalAdvances + row.totalAdvances,
      netPayable: acc.netPayable + row.netPayable,
    }),
    { wagesEarned: 0, overtimePay: 0, totalAdvances: 0, netPayable: 0 }
  );

  const handleExportCsv = () => {
    if (!summaryList || summaryList.length === 0) return;
    const headers = ['Code', 'Name', 'Trade', 'Present Days', 'Wages Earned', 'OT Pay', 'Advances', 'Net Payable'];
    const rows = summaryList.map((r) => [
      r.labourCode ?? '',
      r.name,
      r.trade ?? '',
      r.presentDays,
      r.wagesEarned.toFixed(2),
      r.overtimePay.toFixed(2),
      r.totalAdvances.toFixed(2),
      r.netPayable.toFixed(2),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-${year}-${String(month).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Labour', to: '/labour' }, { label: 'Monthly Payroll' }]} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1 }}>
          <ReceiptLongIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h1">Monthly Payroll Summary</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Month</InputLabel>
            <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {months.map((m, i) => (
                <MenuItem key={i} value={i + 1}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Year</InputLabel>
            <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[year - 1, year, year + 1].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv} disabled={!summaryList?.length}>
            Export CSV
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Trade</TableCell>
              <TableCell align="right">Present Days</TableCell>
              <TableCell align="right">Wages Earned</TableCell>
              <TableCell align="right">OT Pay</TableCell>
              <TableCell align="right">Advances</TableCell>
              <TableCell align="right">Net Payable</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={9} />
            ) : (
              <>
                {(summaryList ?? []).map((row) => (
                  <TableRow key={row.labourId} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.labourCode ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell>{row.trade ?? '—'}</TableCell>
                    <TableCell align="right">{row.presentDays}</TableCell>
                    <TableCell align="right">{fmt(row.wagesEarned)}</TableCell>
                    <TableCell align="right">{fmt(row.overtimePay)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(row.totalAdvances)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(row.netPayable)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Individual Payroll">
                        <span>
                          <Button
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => navigate(`/labour/${row.labourId}/payroll`)}
                          >
                            View
                          </Button>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!summaryList?.length && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No active labour records for this period.</TableCell>
                  </TableRow>
                )}
                {/* Totals Row */}
                {(summaryList ?? []).length > 0 && (
                  <TableRow sx={{ bgcolor: 'action.hover', fontWeight: 700 }}>
                    <TableCell colSpan={4} sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.wagesEarned)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.overtimePay)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(totals.totalAdvances)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(totals.netPayable)}</TableCell>
                    <TableCell />
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
