import { useState } from 'react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  useGetIncomeExpenseReportQuery,
  useGetInventoryReportQuery,
  useGetLabourReportQuery,
  useGetTaxReportQuery,
  useGetCustomerReportQuery,
  useGetSupplierReportQuery,
  useGetEmployeeReportQuery,
  useGetMachineryReportQuery,
  useGetVehicleReportQuery,
} from './reportsApi';
import type {
  IncomeExpenseReportDto,
  LabourReportDto,
  InventoryReportDto,
  TaxReportDto,
  CustomerReportDto,
  SupplierReportDto,
  EmployeeReportDto,
  MachineryReportDto,
  VehicleReportDto,
} from '../../types/reports.types';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB') : '—';
const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};

function downloadCSV(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SummaryCard({
  label,
  value,
  color,
  isCount,
}: {
  label: string;
  value: number;
  color?: string;
  isCount?: boolean;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: color ?? 'text.primary' }}>
          {isCount ? value.toLocaleString() : fmt(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function SectionLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <CircularProgress />
    </Box>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function IncomeExpenseBarChart({ data }: { data: IncomeExpenseReportDto['monthly'] }) {
  if (!data?.length) return null;
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  const barW = 20;
  const gap = 8;
  const groupW = barW * 2 + gap;
  const padding = 40;
  const chartW = data.length * (groupW + 10) + padding;
  const chartH = 220;

  return (
    <Box sx={{ overflowX: 'auto', mb: 2 }}>
      <svg width={chartW} height={chartH} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const x = padding / 2 + i * (groupW + 10);
          const incH = (d.income / maxVal) * 160;
          const expH = (d.expense / maxVal) * 160;
          return (
            <g key={i}>
              <rect x={x} y={180 - incH} width={barW} height={incH} fill="#1976d2">
                <title>Income: PKR {d.income.toLocaleString()}</title>
              </rect>
              <rect x={x + barW + gap} y={180 - expH} width={barW} height={expH} fill="#d32f2f">
                <title>Expense: PKR {d.expense.toLocaleString()}</title>
              </rect>
              <text x={x + barW} y={200} textAnchor="middle" fontSize={10} fill="#666">
                {d.monthName?.slice(0, 3)}
              </text>
            </g>
          );
        })}
        <line x1={padding / 2 - 5} y1={20} x2={padding / 2 - 5} y2={180} stroke="#ccc" />
        <line x1={padding / 2 - 5} y1={180} x2={chartW - 10} y2={180} stroke="#ccc" />
      </svg>
      <Stack direction="row" spacing={2} sx={{ mt: 1, justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#1976d2', borderRadius: 0.5 }} />
          <Typography variant="caption">Income</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#d32f2f', borderRadius: 0.5 }} />
          <Typography variant="caption">Expense</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

// ── Finance Tab ───────────────────────────────────────────────────────────────
function FinanceReport({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };
  const { data, isLoading } = useGetIncomeExpenseReportQuery(query);
  const [view, setView] = useState<'monthly' | 'incomes' | 'expenses' | 'category'>('monthly');

  const handleExport = () => {
    if (!data) return;
    downloadCSV(
      'finance-report.csv',
      ['Month', 'Year', 'Income', 'Expense', 'Profit'],
      (data.monthly ?? []).map((m) => [m.monthName, m.year, m.income, m.expense, m.profit]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={handleExport}>
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard label="Total Income" value={data?.totalIncome ?? 0} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard label="Total Expense" value={data?.totalExpense ?? 0} color="error.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            label="Net Profit"
            value={data?.netProfit ?? 0}
            color={(data?.netProfit ?? 0) >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>

      <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Monthly Breakdown" value="monthly" />
        <Tab label={`Income Transactions (${data?.incomes?.length ?? 0})`} value="incomes" />
        <Tab label={`Expense Transactions (${data?.expenses?.length ?? 0})`} value="expenses" />
        <Tab label="By Category" value="category" />
      </Tabs>

      {view === 'monthly' && (
        <>
          {(data?.monthly?.length ?? 0) > 0 && (
            <IncomeExpenseBarChart data={data?.monthly ?? []} />
          )}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Income (PKR)</TableCell>
                  <TableCell align="right">Expense (PKR)</TableCell>
                  <TableCell align="right">Profit (PKR)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.monthly ?? []).map((m) => (
                  <TableRow key={`${m.year}-${m.month}`} hover>
                    <TableCell>{m.monthName} {m.year}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{m.income.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{m.expense.toLocaleString()}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, color: m.profit >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {m.profit.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!(data?.monthly?.length) && (
                  <TableRow><TableCell colSpan={4} align="center">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {view === 'incomes' && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount (PKR)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.incomes ?? []).map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{fmtDate(r.date)}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.description ?? '—'}</TableCell>
                  <TableCell>{r.reference ?? '—'}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {Number(r.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {!(data?.incomes?.length) && (
                <TableRow><TableCell colSpan={5} align="center">No income records</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {view === 'expenses' && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount (PKR)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.expenses ?? []).map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{fmtDate(r.date)}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.description ?? '—'}</TableCell>
                  <TableCell>{r.reference ?? '—'}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>
                    {Number(r.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {!(data?.expenses?.length) && (
                <TableRow><TableCell colSpan={5} align="center">No expense records</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {view === 'category' && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Total Income (PKR)</TableCell>
                <TableCell align="right">Total Expense (PKR)</TableCell>
                <TableCell align="right">Net (PKR)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.byCategory ?? []).map((c) => (
                <TableRow key={c.category} hover>
                  <TableCell>{c.category}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>{c.totalIncome.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>{c.totalExpense.toLocaleString()}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: (c.totalIncome - c.totalExpense) >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {(c.totalIncome - c.totalExpense).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {!(data?.byCategory?.length) && (
                <TableRow><TableCell colSpan={4} align="center">No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ── Labour Tab ────────────────────────────────────────────────────────────────
function LabourReport({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };
  const { data, isLoading } = useGetLabourReportQuery(query);

  const handleExport = (reportData: LabourReportDto) => {
    downloadCSV(
      'labour-report.csv',
      ['Name', 'Trade', 'Daily Wage', 'Present Days', 'Absent Days', 'Total Wages', 'Total Advances', 'Net Payable'],
      (reportData.labours ?? []).map((l) => [
        l.name, l.trade ?? '', l.dailyWage, l.presentDays, l.absentDays,
        l.totalWages, l.totalAdvances, l.netPayable,
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Labour" value={data?.totalLabour ?? 0} isCount />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Active Labour" value={data?.activeLabour ?? 0} isCount color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Wages" value={data?.totalWages ?? 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Advances" value={data?.totalAdvances ?? 0} color="warning.main" />
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Trade</TableCell>
              <TableCell align="right">Daily Wage</TableCell>
              <TableCell align="right">Present Days</TableCell>
              <TableCell align="right">Absent Days</TableCell>
              <TableCell align="right">Total Wages (PKR)</TableCell>
              <TableCell align="right">Advances (PKR)</TableCell>
              <TableCell align="right">Net Payable (PKR)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.labours ?? []).map((l) => (
              <TableRow key={l.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{l.name}</TableCell>
                <TableCell>{l.trade ?? '—'}</TableCell>
                <TableCell align="right">{l.dailyWage.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>{l.presentDays}</TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>{l.absentDays}</TableCell>
                <TableCell align="right">{l.totalWages.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main' }}>{l.totalAdvances.toLocaleString()}</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: l.netPayable >= 0 ? 'success.main' : 'error.main' }}
                >
                  {l.netPayable.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {!(data?.labours?.length) && (
              <TableRow><TableCell colSpan={8} align="center">No labour records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Inventory Tab ─────────────────────────────────────────────────────────────
function InventoryReport() {
  const { data, isLoading } = useGetInventoryReportQuery();
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const handleExport = (reportData: InventoryReportDto) => {
    const items = showLowStockOnly
      ? (reportData.items ?? []).filter((i) => i.isLowStock)
      : (reportData.items ?? []);
    downloadCSV(
      'inventory-report.csv',
      ['Name', 'Category', 'Unit', 'Current Stock', 'Low Stock Threshold', 'Unit Price', 'Total Value', 'Supplier', 'Location'],
      items.map((i) => [
        i.name, i.category ?? '', i.unit ?? '', i.currentStock,
        i.lowStockThreshold, i.unitPrice, i.totalValue,
        i.supplierName ?? '', i.location ?? '',
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  const items = showLowStockOnly
    ? (data?.items ?? []).filter((i) => i.isLowStock)
    : (data?.items ?? []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Total Items" value={data?.totalItems ?? 0} isCount />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Low Stock Items" value={data?.lowStockItems ?? 0} isCount color="error.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard label="Total Stock Value" value={data?.totalStockValue ?? 0} />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {items.length} of {data?.totalItems ?? 0} items
        </Typography>
        <Button
          size="small"
          variant={showLowStockOnly ? 'contained' : 'outlined'}
          color="error"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          {showLowStockOnly ? 'Show All' : 'Low Stock Only'}
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">Current Stock</TableCell>
              <TableCell align="right">Threshold</TableCell>
              <TableCell align="right">Unit Price (PKR)</TableCell>
              <TableCell align="right">Total Value (PKR)</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{item.name}</TableCell>
                <TableCell>{item.category ?? '—'}</TableCell>
                <TableCell>{item.unit ?? '—'}</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: item.isLowStock ? 'error.main' : 'success.main' }}
                >
                  {item.currentStock.toLocaleString()}
                </TableCell>
                <TableCell align="right">{item.lowStockThreshold.toLocaleString()}</TableCell>
                <TableCell align="right">{item.unitPrice.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{item.totalValue.toLocaleString()}</TableCell>
                <TableCell>{item.supplierName ?? '—'}</TableCell>
                <TableCell>{item.location ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={item.isLowStock ? 'Low Stock' : 'OK'}
                    color={item.isLowStock ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
            {!items.length && (
              <TableRow><TableCell colSpan={10} align="center">No items</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Tax Tab ───────────────────────────────────────────────────────────────────
function TaxReport({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };
  const { data, isLoading } = useGetTaxReportQuery(query);

  const handleExport = (reportData: TaxReportDto) => {
    downloadCSV(
      'tax-report.csv',
      ['Tax Type', 'Period Start', 'Period End', 'Due Date', 'Amount', 'Paid', 'Notes'],
      (reportData.records ?? []).map((r) => [
        r.taxType, fmtDate(r.periodStart), fmtDate(r.periodEnd),
        fmtDate(r.dueDate), r.amount, r.isPaid ? 'Yes' : 'No', r.notes ?? '',
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Tax" value={data?.totalTax ?? 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Paid" value={data?.totalPaid ?? 0} color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Pending" value={data?.totalPending ?? 0} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Overdue" value={data?.overdueTax ?? 0} color="error.main" />
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tax Type</TableCell>
              <TableCell>Period Start</TableCell>
              <TableCell>Period End</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Amount (PKR)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.records ?? []).map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{r.taxType}</TableCell>
                <TableCell>{fmtDate(r.periodStart)}</TableCell>
                <TableCell>{fmtDate(r.periodEnd)}</TableCell>
                <TableCell
                  sx={{
                    color:
                      !r.isPaid && r.dueDate && new Date(r.dueDate) < new Date()
                        ? 'error.main'
                        : 'text.primary',
                    fontWeight:
                      !r.isPaid && r.dueDate && new Date(r.dueDate) < new Date() ? 700 : 400,
                  }}
                >
                  {fmtDate(r.dueDate)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{r.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={r.isPaid ? 'Paid' : 'Pending'}
                    color={r.isPaid ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{r.notes ?? '—'}</TableCell>
              </TableRow>
            ))}
            {!(data?.records?.length) && (
              <TableRow><TableCell colSpan={7} align="center">No tax records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Customers Tab ─────────────────────────────────────────────────────────────
function CustomerReport() {
  const { data, isLoading } = useGetCustomerReportQuery();

  const handleExport = (reportData: CustomerReportDto) => {
    downloadCSV(
      'customer-report.csv',
      ['Name', 'Company', 'Phone', 'Total Billed', 'Total Paid', 'Outstanding'],
      (reportData.customers ?? []).map((c) => [
        c.name, c.companyName ?? '', c.phone ?? '',
        c.totalBilled, c.totalPaid, c.outstandingBalance,
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Customers" value={data?.totalCustomers ?? 0} isCount />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Active" value={data?.activeCustomers ?? 0} isCount color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Billed" value={data?.totalBilled ?? 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Outstanding" value={data?.totalOutstanding ?? 0} color="warning.main" />
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Customer Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Total Billed (PKR)</TableCell>
              <TableCell align="right">Total Paid (PKR)</TableCell>
              <TableCell align="right">Outstanding (PKR)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.customers ?? []).map((c) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                <TableCell>{c.companyName ?? '—'}</TableCell>
                <TableCell>{c.phone ?? '—'}</TableCell>
                <TableCell align="right">{c.totalBilled.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>{c.totalPaid.toLocaleString()}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: c.outstandingBalance > 0 ? 'warning.main' : 'success.main',
                  }}
                >
                  {c.outstandingBalance.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {!(data?.customers?.length) && (
              <TableRow><TableCell colSpan={6} align="center">No customers</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Suppliers Tab ─────────────────────────────────────────────────────────────
function SupplierReport() {
  const { data, isLoading } = useGetSupplierReportQuery();

  const handleExport = (reportData: SupplierReportDto) => {
    downloadCSV(
      'supplier-report.csv',
      ['Name', 'Company', 'Phone', 'Total Purchased', 'Total Paid', 'Outstanding'],
      (reportData.suppliers ?? []).map((s) => [
        s.name, s.companyName ?? '', s.phone ?? '',
        s.totalPurchased, s.totalPaid, s.outstandingBalance,
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Suppliers" value={data?.totalSuppliers ?? 0} isCount />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Active" value={data?.activeSuppliers ?? 0} isCount color="success.main" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Purchased" value={data?.totalPurchased ?? 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <SummaryCard label="Total Outstanding" value={data?.totalOutstanding ?? 0} color="error.main" />
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Supplier Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Total Purchased (PKR)</TableCell>
              <TableCell align="right">Total Paid (PKR)</TableCell>
              <TableCell align="right">Outstanding (PKR)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.suppliers ?? []).map((s) => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{s.name}</TableCell>
                <TableCell>{s.companyName ?? '—'}</TableCell>
                <TableCell>{s.phone ?? '—'}</TableCell>
                <TableCell align="right">{s.totalPurchased.toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>{s.totalPaid.toLocaleString()}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: s.outstandingBalance > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  {s.outstandingBalance.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {!(data?.suppliers?.length) && (
              <TableRow><TableCell colSpan={6} align="center">No suppliers</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Employees Tab ─────────────────────────────────────────────────────────────
function EmployeeReport() {
  const { data, isLoading } = useGetEmployeeReportQuery();

  const handleExport = (reportData: EmployeeReportDto) => {
    downloadCSV(
      'employee-report.csv',
      ['Name', 'Designation', 'Department', 'Basic Salary', 'Salary Paid Count', 'Total Salary Paid', 'Active'],
      (reportData.employees ?? []).map((e) => [
        e.name, e.designation ?? '', e.department ?? '',
        e.salary, e.salaryPaidCount, e.totalSalaryPaid,
        e.isActive ? 'Yes' : 'No',
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Total Employees" value={data?.totalEmployees ?? 0} isCount />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Active" value={data?.activeEmployees ?? 0} isCount color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard label="Total Salary Paid" value={data?.totalSalaryPaid ?? 0} />
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Basic Salary (PKR)</TableCell>
              <TableCell align="right">Salary Payments</TableCell>
              <TableCell align="right">Total Paid (PKR)</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.employees ?? []).map((e) => (
              <TableRow key={e.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{e.name}</TableCell>
                <TableCell>{e.designation ?? '—'}</TableCell>
                <TableCell>{e.department ?? '—'}</TableCell>
                <TableCell align="right">{e.salary.toLocaleString()}</TableCell>
                <TableCell align="right">{e.salaryPaidCount}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{e.totalSalaryPaid.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip
                    label={e.isActive ? 'Active' : 'Inactive'}
                    color={e.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
            {!(data?.employees?.length) && (
              <TableRow><TableCell colSpan={7} align="center">No employees</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Machinery Tab ─────────────────────────────────────────────────────────────
function MachineryReport({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };
  const { data, isLoading } = useGetMachineryReportQuery(query);

  const handleExport = (reportData: MachineryReportDto) => {
    downloadCSV(
      'machinery-report.csv',
      ['Name', 'Model', 'Status', 'Maintenance Count', 'Total Maintenance Cost', 'Last Maintenance'],
      (reportData.machinery ?? []).map((m) => [
        m.name, m.model ?? '', m.status,
        m.maintenanceCount, m.totalMaintenanceCost,
        fmtDate(m.lastMaintenanceDate),
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Total Machinery" value={data?.totalMachinery ?? 0} isCount />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Active" value={data?.activeMachinery ?? 0} isCount color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard label="Total Maintenance Cost" value={data?.totalMaintenanceCost ?? 0} color="warning.main" />
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Maintenance Records</TableCell>
              <TableCell align="right">Total Cost (PKR)</TableCell>
              <TableCell>Last Maintenance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.machinery ?? []).map((m) => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{m.name}</TableCell>
                <TableCell>{m.model ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={m.status}
                    color={m.status === 'Active' ? 'success' : m.status === 'Under Maintenance' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{m.maintenanceCount}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {m.totalMaintenanceCost.toLocaleString()}
                </TableCell>
                <TableCell>{fmtDate(m.lastMaintenanceDate)}</TableCell>
              </TableRow>
            ))}
            {!(data?.machinery?.length) && (
              <TableRow><TableCell colSpan={6} align="center">No machinery records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Vehicles Tab ──────────────────────────────────────────────────────────────
function VehicleReport({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };
  const { data, isLoading } = useGetVehicleReportQuery(query);

  const handleExport = (reportData: VehicleReportDto) => {
    downloadCSV(
      'vehicle-report.csv',
      ['Registration', 'Make/Model', 'Status', 'Maintenance Count', 'Total Maintenance Cost', 'Last Maintenance'],
      (reportData.vehicles ?? []).map((v) => [
        v.name, v.type ?? '', v.status,
        v.maintenanceCount, v.totalMaintenanceCost,
        fmtDate(v.lastMaintenanceDate),
      ]),
    );
  };

  if (isLoading) return <SectionLoader />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={() => data && handleExport(data)}
          disabled={!data}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Total Vehicles" value={data?.totalVehicles ?? 0} isCount />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <SummaryCard label="Active" value={data?.activeVehicles ?? 0} isCount color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard label="Total Maintenance Cost" value={data?.totalMaintenanceCost ?? 0} color="warning.main" />
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Registration No.</TableCell>
              <TableCell>Make / Model</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Maintenance Records</TableCell>
              <TableCell align="right">Total Cost (PKR)</TableCell>
              <TableCell>Last Maintenance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.vehicles ?? []).map((v) => (
              <TableRow key={v.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{v.name}</TableCell>
                <TableCell>{v.type ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={v.status}
                    color={v.status === 'Active' ? 'success' : v.status === 'Under Maintenance' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">{v.maintenanceCount}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {v.totalMaintenanceCost.toLocaleString()}
                </TableCell>
                <TableCell>{fmtDate(v.lastMaintenanceDate)}</TableCell>
              </TableRow>
            ))}
            {!(data?.vehicles?.length) && (
              <TableRow><TableCell colSpan={6} align="center">No vehicle records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { label: 'Finance', value: 'finance' },
  { label: 'Labour', value: 'labour' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Tax', value: 'tax' },
  { label: 'Customers', value: 'customers' },
  { label: 'Suppliers', value: 'suppliers' },
  { label: 'Employees', value: 'employees' },
  { label: 'Machinery', value: 'machinery' },
  { label: 'Vehicles', value: 'vehicles' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('finance');
  const [fromDate, setFromDate] = useState(firstOfMonth());
  const [toDate, setToDate] = useState(today());

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>REPORTS</Typography>

      {/* Global date filter */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            Date Range:
          </Typography>
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          {(fromDate || toDate) && (
            <Button size="small" onClick={() => { setFromDate(''); setToDate(''); }}>
              Clear
            </Button>
          )}
          <Typography variant="caption" color="text.secondary">
            (Applies to Finance, Labour, Tax, Machinery, Vehicles)
          </Typography>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {TABS.map((t) => (
            <Tab key={t.value} label={t.label} value={t.value} />
          ))}
        </Tabs>
        <Box sx={{ p: 3 }}>
          {activeTab === 'finance' && <FinanceReport fromDate={fromDate} toDate={toDate} />}
          {activeTab === 'labour' && <LabourReport fromDate={fromDate} toDate={toDate} />}
          {activeTab === 'inventory' && <InventoryReport />}
          {activeTab === 'tax' && <TaxReport fromDate={fromDate} toDate={toDate} />}
          {activeTab === 'customers' && <CustomerReport />}
          {activeTab === 'suppliers' && <SupplierReport />}
          {activeTab === 'employees' && <EmployeeReport />}
          {activeTab === 'machinery' && <MachineryReport fromDate={fromDate} toDate={toDate} />}
          {activeTab === 'vehicles' && <VehicleReport fromDate={fromDate} toDate={toDate} />}
        </Box>
      </Paper>
    </Box>
  );
}
