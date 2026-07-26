import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import EngineeringIcon from '@mui/icons-material/EngineeringOutlined';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Loader from '../../components/common/Loader';
import { useGetDashboardStatsQuery } from './dashboardApi';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

function StatCard({ label, value, color, subtitle }: { label: string; value: string; color: string; subtitle?: string }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

function CountCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ color: color ?? 'primary.main', display: 'flex' }}>{icon}</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: color ?? 'text.primary', lineHeight: 1 }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function BarChart({ data }: { data: { month: string; income: number; expense: number; profit: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', minWidth: 360, height: 160, px: 1 }}>
        {data.map((d) => (
          <Box key={d.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-end', height: 130, width: '100%', justifyContent: 'center' }}>
              <Box title={`Income: ${fmt(d.income)}`} sx={{ width: 10, height: `${(d.income / max) * 100}%`, minHeight: 2, bgcolor: 'success.main', borderRadius: 0.5 }} />
              <Box title={`Expense: ${fmt(d.expense)}`} sx={{ width: 10, height: `${(d.expense / max) * 100}%`, minHeight: 2, bgcolor: 'error.main', borderRadius: 0.5 }} />
              <Box title={`Profit: ${fmt(d.profit)}`} sx={{ width: 10, height: `${Math.max(d.profit, 0) / max * 100}%`, minHeight: 2, bgcolor: d.profit >= 0 ? 'primary.main' : 'warning.main', borderRadius: 0.5 }} />
            </Stack>
            <Typography variant="caption" noWrap sx={{ fontSize: 10 }}>{d.month.slice(0, 3)}</Typography>
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 1, px: 1 }}>
        {[{ color: 'success.main', label: 'Income' }, { color: 'error.main', label: 'Expense' }, { color: 'primary.main', label: 'Profit' }].map((item) => (
          <Stack key={item.label} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, bgcolor: item.color, borderRadius: 0.5 }} />
            <Typography variant="caption">{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStatsQuery();

  if (isLoading || !stats) return <Loader />;

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>Dashboard</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Income — This Month" value={fmt(stats.totalIncomeThisMonth)} color="success.main" subtitle={`All time: ${fmt(stats.totalIncomeAllTime)}`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Expense — This Month" value={fmt(stats.totalExpenseThisMonth)} color="error.main" subtitle={`All time: ${fmt(stats.totalExpenseAllTime)}`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Profit / Loss — This Month" value={fmt(stats.profitLossThisMonth)} color={stats.profitLossThisMonth >= 0 ? 'success.main' : 'error.main'} subtitle={`All time: ${fmt(stats.profitLossAllTime)}`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Pending Payments" value={fmt(stats.pendingPayments)} color="warning.main" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <CountCard label="Active Labour" value={stats.activeLabourCount} icon={<EngineeringIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <CountCard label="Active Employees" value={stats.activeEmployeeCount} icon={<PeopleIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <CountCard label="Active Machinery" value={stats.activeMachineryCount} icon={<PrecisionManufacturingIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <CountCard label="Maintenance Due" value={stats.maintenanceDueCount} icon={<WarningAmberIcon />} color={stats.maintenanceDueCount > 0 ? 'error.main' : 'text.secondary'} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Monthly Overview (Last 6 Months)</Typography>
            {stats.monthlyChart.length > 0 ? (
              <BarChart data={stats.monthlyChart} />
            ) : (
              <Typography color="text.secondary" variant="body2">No data yet</Typography>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Recent Transactions</Typography>
            <List dense disablePadding>
              {stats.recentTransactions.map((tx, i) => (
                <Box key={tx.id}>
                  {i > 0 && <Divider />}
                  <ListItem disablePadding sx={{ py: 0.75 }}>
                    <Box sx={{ mr: 1, color: tx.type === 'Income' ? 'success.main' : 'error.main', display: 'flex' }}>
                      {tx.type === 'Income' ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                    </Box>
                    <ListItemText
                      primary={
                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>{tx.description || tx.category}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tx.type === 'Income' ? 'success.main' : 'error.main' }}>{fmt(tx.amount)}</Typography>
                        </Stack>
                      }
                      secondary={
                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">{tx.category}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(tx.date).toLocaleDateString()}</Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                </Box>
              ))}
              {!stats.recentTransactions.length && (
                <Typography variant="body2" color="text.secondary">No transactions yet</Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
