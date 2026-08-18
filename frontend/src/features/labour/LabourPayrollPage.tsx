import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
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
  Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import { useParams } from 'react-router-dom';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useGetLabourLedgerQuery } from './labourApi';
import TableSkeleton from '../../components/common/TableSkeleton';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function LabourPayrollPage() {
  const { id } = useParams<{ id: string }>();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: ledger, isLoading } = useGetLabourLedgerQuery(
    { id: id!, month, year },
    { skip: !id }
  );

  const labour = ledger?.labour;
  const summary = ledger?.summary;

  const handlePrint = () => window.print();

  return (
    <Box>
      <Box className="no-print">
        <AppBreadcrumbs
          crumbs={[
            { label: 'Labour', to: '/labour' },
            { label: labour?.name ?? '…', to: `/labour/${id}` },
            { label: 'Payroll' },
          ]}
        />
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1" id="payroll-heading">
            {labour?.name ?? '…'} — Payroll — {months[month - 1]} {year}
          </Typography>
          {labour && (
            <Typography variant="body2" color="text.secondary">
              {labour.trade ?? 'Labour'} | Daily Wage: {fmt(labour.dailyWage)} | OT Rate: {fmt(labour.overtimeRatePerHour)}/hr
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} className="no-print">
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
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
        </Stack>
      </Stack>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Present Days', value: summary.presentDays, color: '#1976d2' },
            { label: 'Wages Earned', value: fmt(summary.wagesEarned), color: '#2e7d32' },
            { label: 'OT Pay', value: fmt(summary.overtimePay), color: '#ed6c02' },
            { label: 'Total Advances', value: fmt(summary.totalAdvances), color: '#d32f2f' },
            { label: 'Net Payable', value: fmt(summary.netPayable), color: '#1a3c5e' },
          ].map(({ label, value, color }) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={label}>
              <Card variant="outlined" sx={{ textAlign: 'center' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color }}>{value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Attendance Detail Table */}
      <Typography variant="h6" sx={{ mb: 1 }}>Attendance Details</Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Present</TableCell>
                <TableCell align="right">OT Hours</TableCell>
                <TableCell align="right">Daily Pay</TableCell>
                <TableCell align="right">OT Pay</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(ledger?.attendances ?? []).length > 0 ? (
                (ledger?.attendances ?? []).map((a) => {
                  const dailyWage = labour?.dailyWage ?? 0;
                  const otRate = labour?.overtimeRatePerHour ?? 0;
                  const dailyPay = a.isPresent ? dailyWage : 0;
                  const otPay = Number(a.overtimeHours) * otRate;
                  const total = dailyPay + otPay;
                  return (
                    <TableRow key={a.id} hover>
                      <TableCell>{new Date(a.date).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short' })}</TableCell>
                      <TableCell>
                        <Box component="span" sx={{ color: a.isPresent ? 'success.main' : 'error.main', fontWeight: 600 }}>
                          {a.isPresent ? 'Present' : 'Absent'}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{a.overtimeHours}</TableCell>
                      <TableCell align="right">{a.isPresent ? fmt(dailyPay) : '—'}</TableCell>
                      <TableCell align="right">{Number(a.overtimeHours) > 0 ? fmt(otPay) : '—'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{a.isPresent ? fmt(total) : '—'}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No attendance records for this period.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Advances Table */}
      <Typography variant="h6" sx={{ mb: 1 }}>Advances</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(ledger?.advances ?? []).length > 0 ? (
              (ledger?.advances ?? []).map((adv) => (
                <TableRow key={adv.id} hover>
                  <TableCell>{new Date(adv.date).toLocaleDateString()}</TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>{fmt(adv.amount)}</TableCell>
                  <TableCell>{adv.reason ?? '—'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">No advances for this period.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .MuiDrawer-root, nav, header, aside { display: none !important; }
        }
      `}</style>
    </Box>
  );
}
