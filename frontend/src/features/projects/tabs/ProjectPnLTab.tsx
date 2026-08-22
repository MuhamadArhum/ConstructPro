import {
  Box, Card, CardContent, FormControl, Grid, InputLabel, LinearProgress,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { fmt } from './utils';

interface Props {
  project: any;
  pnlData: any;
  pnlMonth: number | undefined;
  pnlYear: number | undefined;
  setPnlMonth: (v: number | undefined) => void;
  setPnlYear: (v: number | undefined) => void;
  budgetUsedPct: number;
  remaining: number;
}

export default function ProjectPnLTab({
  project,
  pnlData,
  pnlMonth,
  pnlYear,
  setPnlMonth,
  setPnlYear,
  budgetUsedPct,
  remaining,
}: Props) {
  const MONTHS_LIST = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const pnlIncome = (pnlData as any)?.totalIncome ?? 0;
  const pnlDirectExpenses = (pnlData as any)?.totalDirectExpenses ?? 0;
  const pnlLabourCost = (pnlData as any)?.totalLabourCost ?? 0;
  const pnlSalaryCost = (pnlData as any)?.totalSalaryCost ?? 0;
  const pnlTotalCosts = pnlDirectExpenses + pnlLabourCost + pnlSalaryCost;
  const pnlGrossProfit = pnlIncome - pnlTotalCosts;
  const isProfit = pnlGrossProfit >= 0;

  return (
    <>
      {/* ── Project Summary Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Budget</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{fmt(project.budget)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: budgetUsedPct >= 80 ? 'warning.main' : undefined }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Spent</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: budgetUsedPct >= 100 ? 'error.main' : budgetUsedPct >= 80 ? 'warning.main' : 'text.primary' }}>
                {fmt(project.spent)}
              </Typography>
              {project.budget > 0 && (
                <LinearProgress variant="determinate" value={Math.min(budgetUsedPct, 100)} color={budgetUsedPct >= 100 ? 'error' : budgetUsedPct >= 80 ? 'warning' : 'primary'} sx={{ mt: 0.5, height: 4, borderRadius: 2 }} />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Remaining</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: remaining >= 0 ? 'success.main' : 'error.main' }}>{fmt(remaining)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Progress</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LinearProgress variant="determinate" value={project.progress} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{project.progress}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Income</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(pnlIncome)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Direct Expenses</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(pnlDirectExpenses)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: 'warning.light' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Labour + Salary Cost</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark' }}>{fmt(pnlLabourCost + pnlSalaryCost)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: isProfit ? 'success.main' : 'error.main', bgcolor: isProfit ? 'success.50' : 'error.50' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Gross {isProfit ? 'Profit' : 'Loss'}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isProfit ? 'success.main' : 'error.main' }}>
                {isProfit ? '+' : ''}{fmt(pnlGrossProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Month/Year filter */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Filter by Period:</Typography>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Month</InputLabel>
          <Select
            label="Month"
            value={pnlMonth ? String(pnlMonth) : ''}
            onChange={(e) => { const v = e.target.value as string; setPnlMonth(v === '' ? undefined : Number(v)); }}
          >
            <MenuItem value="">All Months</MenuItem>
            {MONTHS_LIST.map((m, i) => (
              <MenuItem key={i + 1} value={String(i + 1)}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select
            label="Year"
            value={pnlYear ? String(pnlYear) : ''}
            onChange={(e) => { const v = e.target.value as string; setPnlYear(v === '' ? undefined : Number(v)); }}
          >
            <MenuItem value="">All Years</MenuItem>
            {years.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {/* P&L breakdown table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow sx={{ bgcolor: 'success.50' }}>
              <TableCell sx={{ fontWeight: 600, color: 'success.dark' }}>Total Income</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(pnlIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Direct Expenses</TableCell>
              <TableCell align="right" sx={{ color: 'error.main' }}>({fmt(pnlDirectExpenses)})</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Labour Wages</TableCell>
              <TableCell align="right" sx={{ color: 'error.main' }}>({fmt(pnlLabourCost)})</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Employee Salaries</TableCell>
              <TableCell align="right" sx={{ color: 'error.main' }}>({fmt(pnlSalaryCost)})</TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Total Costs</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>({fmt(pnlTotalCosts)})</TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: isProfit ? 'success.50' : 'error.50' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '1rem', color: isProfit ? 'success.dark' : 'error.dark' }}>
                Gross {isProfit ? 'Profit' : 'Loss'}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: isProfit ? 'success.main' : 'error.main' }}>
                {isProfit ? '+' : ''}{fmt(pnlGrossProfit)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
