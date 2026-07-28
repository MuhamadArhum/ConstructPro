import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
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
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import Loader from '../../components/common/Loader';
import { useGetDashboardStatsQuery } from './dashboardApi';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

const STAT_CARDS = (stats: {
  totalIncomeThisMonth: number;
  totalIncomeAllTime: number;
  totalExpenseThisMonth: number;
  totalExpenseAllTime: number;
  profitLossThisMonth: number;
  profitLossAllTime: number;
  pendingPayments: number;
}) => [
  {
    label: 'Income This Month',
    value: fmt(stats.totalIncomeThisMonth),
    sub: `All time: ${fmt(stats.totalIncomeAllTime)}`,
    icon: <AttachMoneyIcon sx={{ fontSize: 22 }} />,
    bg: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
    chip: 'Income',
    chipColor: '#a5d6a7',
  },
  {
    label: 'Expense This Month',
    value: fmt(stats.totalExpenseThisMonth),
    sub: `All time: ${fmt(stats.totalExpenseAllTime)}`,
    icon: <MoneyOffIcon sx={{ fontSize: 22 }} />,
    bg: 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)',
    chip: 'Expense',
    chipColor: '#ef9a9a',
  },
  {
    label: 'Profit / Loss',
    value: fmt(stats.profitLossThisMonth),
    sub: `All time: ${fmt(stats.profitLossAllTime)}`,
    icon: <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />,
    bg: stats.profitLossThisMonth >= 0
      ? 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)'
      : 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
    chip: stats.profitLossThisMonth >= 0 ? 'Profit' : 'Loss',
    chipColor: stats.profitLossThisMonth >= 0 ? '#90caf9' : '#ffcc80',
  },
  {
    label: 'Pending Payments',
    value: fmt(stats.pendingPayments),
    sub: 'Awaiting collection',
    icon: <HourglassEmptyIcon sx={{ fontSize: 22 }} />,
    bg: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)',
    chip: 'Pending',
    chipColor: '#ce93d8',
  },
];

function BarChart({ data }: { data: { month: string; income: number; expense: number; profit: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', minWidth: 360, height: 180, px: 1 }}>
        {data.map((d) => (
          <Box key={d.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-end', height: 150, width: '100%', justifyContent: 'center' }}>
              <Box
                title={`Income: ${fmt(d.income)}`}
                sx={{ width: 12, height: `${(d.income / max) * 100}%`, minHeight: 3, bgcolor: '#4caf50', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}
              />
              <Box
                title={`Expense: ${fmt(d.expense)}`}
                sx={{ width: 12, height: `${(d.expense / max) * 100}%`, minHeight: 3, bgcolor: '#f44336', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}
              />
              <Box
                title={`Profit: ${fmt(d.profit)}`}
                sx={{ width: 12, height: `${Math.max(d.profit, 0) / max * 100}%`, minHeight: 3, bgcolor: d.profit >= 0 ? '#1976d2' : '#ff9800', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}
              />
            </Stack>
            <Typography variant="caption" noWrap sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
              {d.month.slice(0, 3)}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={2.5} sx={{ mt: 2, px: 1 }}>
        {[
          { color: '#4caf50', label: 'Income' },
          { color: '#f44336', label: 'Expense' },
          { color: '#1976d2', label: 'Profit' },
        ].map((item) => (
          <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, bgcolor: item.color, borderRadius: 0.5 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStatsQuery();

  if (isLoading || !stats) return <Loader />;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <Box>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
          {greeting} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {now.toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {STAT_CARDS(stats).map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              elevation={0}
              sx={{
                background: card.bg,
                color: 'white',
                borderRadius: 3,
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
              <Box sx={{ position: 'absolute', bottom: -30, right: 20, width: 70, height: 70, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
              <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 1 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 1.5, p: 0.8, display: 'flex' }}>
                    {card.icon}
                  </Box>
                  <Chip label={card.chip} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: card.chipColor, fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.5px' }}>
                  {card.value}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', opacity: 0.65 }}>
                  {card.label}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', opacity: 0.55, mt: 0.5 }}>
                  {card.sub}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Count Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Active Labour', value: stats.activeLabourCount, icon: <EngineeringIcon sx={{ fontSize: 28 }} />, color: '#1976d2', bg: '#e3f2fd' },
          { label: 'Employees', value: stats.activeEmployeeCount, icon: <PeopleIcon sx={{ fontSize: 28 }} />, color: '#388e3c', bg: '#e8f5e9' },
          { label: 'Machinery', value: stats.activeMachineryCount, icon: <PrecisionManufacturingIcon sx={{ fontSize: 28 }} />, color: '#7b1fa2', bg: '#f3e5f5' },
          { label: 'Maintenance Due', value: stats.maintenanceDueCount, icon: <WarningAmberIcon sx={{ fontSize: 28 }} />, color: stats.maintenanceDueCount > 0 ? '#d32f2f' : '#616161', bg: stats.maintenanceDueCount > 0 ? '#ffebee' : '#f5f5f5' },
        ].map((c) => (
          <Grid key={c.label} size={{ xs: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: c.bg, color: c.color, borderRadius: 2, p: 1.2, display: 'flex', flexShrink: 0 }}>
                {c.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{c.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Chart + Transactions */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Monthly Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">Last 6 months performance</Typography>
              </Box>
            </Stack>
            {stats.monthlyChart.length > 0 ? (
              <BarChart data={stats.monthlyChart} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'text.secondary' }}>
                <Typography variant="body2">No data yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              Recent Transactions
            </Typography>
            <Typography variant="caption" color="text.secondary">Latest financial activity</Typography>

            <List dense disablePadding sx={{ mt: 2 }}>
              {stats.recentTransactions.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No transactions yet
                </Typography>
              )}
              {stats.recentTransactions.map((tx, i) => (
                <Box key={tx.id}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <Box
                      sx={{
                        mr: 1.5,
                        width: 34,
                        height: 34,
                        borderRadius: 1.5,
                        bgcolor: tx.type === 'Income' ? '#e8f5e9' : '#ffebee',
                        color: tx.type === 'Income' ? '#2e7d32' : '#c62828',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {tx.type === 'Income'
                        ? <TrendingUpIcon sx={{ fontSize: 18 }} />
                        : <TrendingDownIcon sx={{ fontSize: 18 }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600, maxWidth: 110, color: 'text.primary' }}>
                          {tx.description || tx.category}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, color: tx.type === 'Income' ? '#2e7d32' : '#c62828', ml: 1, flexShrink: 0 }}
                        >
                          {tx.type === 'Income' ? '+' : '-'}{fmt(tx.amount)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">{tx.category}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(tx.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                        </Typography>
                      </Stack>
                    </Box>
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
