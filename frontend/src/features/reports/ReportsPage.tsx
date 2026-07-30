import { useState } from 'react';
import { Box, Card, CardContent, CircularProgress, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useGetIncomeExpenseReportQuery, useGetInventoryReportQuery, useGetLabourReportQuery, useGetTaxReportQuery } from './reportsApi';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const query = { fromDate: fromDate || undefined, toDate: toDate || undefined };

  const { data: ieReport, isLoading: loadingIE } = useGetIncomeExpenseReportQuery(query);
  const { data: labourReport, isLoading: loadingLabour } = useGetLabourReportQuery(query);
  const { data: inventoryReport, isLoading: loadingInventory } = useGetInventoryReportQuery();
  const { data: taxReport, isLoading: loadingTax } = useGetTaxReportQuery(query);

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>Reports</Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Filter by date range:</Typography>
          <TextField label="From Date" type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="To Date" type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
      </Paper>

      {/* Income & Expense Report */}
      <Typography variant="h6" sx={{ mb: 1 }}>Income & Expense Summary</Typography>
      {loadingIE ? <CircularProgress /> : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Total Income', value: ieReport?.totalIncome ?? 0, color: 'success.main' },
              { label: 'Total Expense', value: ieReport?.totalExpense ?? 0, color: 'error.main' },
              { label: 'Net Profit', value: ieReport?.netProfit ?? 0, color: (ieReport?.netProfit ?? 0) >= 0 ? 'success.main' : 'error.main' },
            ].map((c) => (
              <Grid key={c.label} size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: c.color }}>{fmt(c.value)}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
          {ieReport?.monthly && ieReport.monthly.length > 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>Month</TableCell><TableCell align="right">Income</TableCell><TableCell align="right">Expense</TableCell><TableCell align="right">Profit</TableCell></TableRow></TableHead>
                <TableBody>
                  {ieReport.monthly.map((m) => (
                    <TableRow key={`${m.year}-${m.month}`} hover>
                      <TableCell>{m.monthName}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>{fmt(m.income)}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(m.expense)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: m.profit >= 0 ? 'success.main' : 'error.main' }}>{fmt(m.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Labour Report */}
      <Typography variant="h6" sx={{ mb: 1 }}>Labour Summary</Typography>
      {loadingLabour ? <CircularProgress /> : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Labour', value: labourReport?.totalLabour ?? 0, isCount: true },
            { label: 'Total Wages Paid', value: labourReport?.totalWagesPaid ?? 0 },
            { label: 'Total Advances', value: labourReport?.totalAdvancesPaid ?? 0 },
            { label: 'Total Overtime', value: labourReport?.totalOvertimePaid ?? 0 },
          ].map((c) => (
            <Grid key={c.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined"><CardContent>
                <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{c.isCount ? c.value : fmt(c.value)}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Inventory Report */}
      <Typography variant="h6" sx={{ mb: 1 }}>Inventory Summary</Typography>
      {loadingInventory ? <CircularProgress /> : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              { label: 'Total Items', value: inventoryReport?.totalItems ?? 0, isCount: true },
              { label: 'Low Stock Items', value: inventoryReport?.lowStockItems ?? 0, isCount: true, color: 'error.main' },
              { label: 'Total Stock Value', value: inventoryReport?.totalStockValue ?? 0 },
            ].map((c) => (
              <Grid key={c.label} size={{ xs: 12, sm: 4 }}>
                <Card variant="outlined"><CardContent>
                  <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: c.color }}>{c.isCount ? c.value : fmt(c.value)}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
          {(inventoryReport?.lowStockList?.length ?? 0) > 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Current Stock</TableCell><TableCell align="right">Threshold</TableCell><TableCell>Unit</TableCell></TableRow></TableHead>
                <TableBody>
                  {inventoryReport?.lowStockList.map((item) => (
                    <TableRow key={item.name} hover>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{item.currentStock}</TableCell>
                      <TableCell align="right">{item.threshold}</TableCell>
                      <TableCell>{item.unit ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Tax Report */}
      <Typography variant="h6" sx={{ mb: 1 }}>Tax Summary</Typography>
      {loadingTax ? <CircularProgress /> : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Tax', value: taxReport?.totalTax ?? 0 },
            { label: 'Total Paid', value: taxReport?.totalPaid ?? 0, color: 'success.main' },
            { label: 'Total Pending', value: taxReport?.totalPending ?? 0, color: 'warning.main' },
          ].map((c) => (
            <Grid key={c.label} size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined"><CardContent>
                <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: c.color }}>{fmt(c.value)}</Typography>
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
