import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffOutlinedIcon from '@mui/icons-material/MoneyOffOutlined';
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined';
import Loader from '../../components/common/Loader';
import { useGetDashboardStatsQuery } from './dashboardApi';

const pkr = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

const shortPkr = (n: number) => {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `PKR ${(n / 1_000).toFixed(0)}K`;
  return pkr(n);
};

function BarChart({ data }: { data: { month: string; income: number; expense: number; profit: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end', height: 160, px: 0.5 }}>
        {data.map((d) => (
          <Box key={d.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-end', height: 140, width: '100%', justifyContent: 'center' }}>
              <Box
                title={`Income: ${pkr(d.income)}`}
                sx={{
                  width: 10,
                  height: `${(d.income / max) * 100}%`,
                  minHeight: 4,
                  background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)',
                  borderRadius: '4px 4px 0 0',
                }}
              />
              <Box
                title={`Expense: ${pkr(d.expense)}`}
                sx={{
                  width: 10,
                  height: `${(d.expense / max) * 100}%`,
                  minHeight: 4,
                  background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)',
                  borderRadius: '4px 4px 0 0',
                }}
              />
              <Box
                title={`Profit: ${pkr(d.profit)}`}
                sx={{
                  width: 10,
                  height: `${(Math.max(d.profit, 0) / max) * 100}%`,
                  minHeight: 4,
                  background: d.profit >= 0
                    ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)'
                    : 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)',
                  borderRadius: '4px 4px 0 0',
                }}
              />
            </Stack>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600 }}>
              {d.month.slice(0, 3)}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={2.5} sx={{ mt: 2 }}>
        {[
          { color: '#22c55e', label: 'Income' },
          { color: '#ef4444', label: 'Expense' },
          { color: '#3b82f6', label: 'Profit' },
        ].map((item) => (
          <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500 }}>
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function DashboardPage() {
  const { data: s, isLoading } = useGetDashboardStatsQuery();

  if (isLoading || !s) return <Loader />;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const profitRatio = s.totalIncomeThisMonth > 0
    ? Math.round((s.profitLossThisMonth / s.totalIncomeThisMonth) * 100)
    : 0;

  const expenseRatio = s.totalIncomeThisMonth > 0
    ? Math.min(Math.round((s.totalExpenseThisMonth / s.totalIncomeThisMonth) * 100), 100)
    : 0;

  return (
    <Box sx={{ pb: 3 }}>

      {/* ── Page Header ─────────────────────────────── */}
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0a2540 0%, #1565c0 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, mb: 0.25 }}>
            {greeting} 👋
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', opacity: 0.65 }}>{dateStr}</Typography>
        </Box>
      </Box>

      {/* ── KPI Cards ───────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>

        {/* Income */}
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid rgba(34,197,94,0.2)', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ bgcolor: '#22c55e', borderRadius: 2, p: 0.9, display: 'flex' }}>
                  <AttachMoneyIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Chip label="Income" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#15803d', fontWeight: 700, fontSize: '0.68rem' }} />
              </Stack>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', lineHeight: 1, mb: 0.5 }}>
                {shortPkr(s.totalIncomeThisMonth)}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#166534', opacity: 0.7 }}>This month</Typography>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(34,197,94,0.2)' }} />
              <Typography sx={{ fontSize: '0.72rem', color: '#166534', opacity: 0.6 }}>
                All time: <strong>{shortPkr(s.totalIncomeAllTime)}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Expense */}
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid rgba(239,68,68,0.2)', background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)' }}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ bgcolor: '#ef4444', borderRadius: 2, p: 0.9, display: 'flex' }}>
                  <MoneyOffOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Chip label="Expense" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#b91c1c', fontWeight: 700, fontSize: '0.68rem' }} />
              </Stack>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#b91c1c', lineHeight: 1, mb: 0.5 }}>
                {shortPkr(s.totalExpenseThisMonth)}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#991b1b', opacity: 0.7 }}>This month</Typography>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(239,68,68,0.2)' }} />
              <Typography sx={{ fontSize: '0.72rem', color: '#991b1b', opacity: 0.6 }}>
                All time: <strong>{shortPkr(s.totalExpenseAllTime)}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Profit / Loss */}
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          {(() => {
            const isProfit = s.profitLossThisMonth >= 0;
            return (
              <Card sx={{ borderRadius: 3, border: `1px solid ${isProfit ? 'rgba(59,130,246,0.2)' : 'rgba(249,115,22,0.2)'}`, background: isProfit ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' }}>
                <CardContent>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ bgcolor: isProfit ? '#3b82f6' : '#f97316', borderRadius: 2, p: 0.9, display: 'flex' }}>
                      <AccountBalanceWalletOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Chip
                      icon={isProfit ? <TrendingUpIcon sx={{ fontSize: '14px !important' }} /> : <TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
                      label={isProfit ? 'Profit' : 'Loss'}
                      size="small"
                      sx={{ bgcolor: isProfit ? 'rgba(59,130,246,0.12)' : 'rgba(249,115,22,0.12)', color: isProfit ? '#1d4ed8' : '#c2410c', fontWeight: 700, fontSize: '0.68rem' }}
                    />
                  </Stack>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: isProfit ? '#1d4ed8' : '#c2410c', lineHeight: 1, mb: 0.5 }}>
                    {shortPkr(Math.abs(s.profitLossThisMonth))}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', opacity: 0.7, color: isProfit ? '#1e3a8a' : '#7c2d12' }}>This month</Typography>
                  <Divider sx={{ my: 1.5, borderColor: isProfit ? 'rgba(59,130,246,0.2)' : 'rgba(249,115,22,0.2)' }} />
                  <Typography sx={{ fontSize: '0.72rem', opacity: 0.6, color: isProfit ? '#1e3a8a' : '#7c2d12' }}>
                    All time: <strong>{shortPkr(Math.abs(s.profitLossAllTime))}</strong>
                  </Typography>
                </CardContent>
              </Card>
            );
          })()}
        </Grid>

        {/* Pending */}
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <Card sx={{ borderRadius: 3, border: '1px solid rgba(168,85,247,0.2)', background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)' }}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ bgcolor: '#a855f7', borderRadius: 2, p: 0.9, display: 'flex' }}>
                  <HourglassTopOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Chip label="Pending" size="small" sx={{ bgcolor: 'rgba(168,85,247,0.12)', color: '#7e22ce', fontWeight: 700, fontSize: '0.68rem' }} />
              </Stack>
              <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#7e22ce', lineHeight: 1, mb: 0.5 }}>
                {shortPkr(s.pendingPayments)}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#6b21a8', opacity: 0.7 }}>Awaiting collection</Typography>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(168,85,247,0.2)' }} />
              <Typography sx={{ fontSize: '0.72rem', color: '#6b21a8', opacity: 0.6 }}>
                Unpaid invoices & dues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 2: Progress + Resource Cards ───────── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>

        {/* Monthly performance progress */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.07)', height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Monthly Performance</Typography>
            <Typography variant="caption" color="text.secondary">Income vs Expense ratio this month</Typography>

            <Stack spacing={2.5} sx={{ mt: 3 }}>
              <Box>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#15803d' }}>Income</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>{shortPkr(s.totalIncomeThisMonth)}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(34,197,94,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#22c55e', borderRadius: 4 } }} />
              </Box>

              <Box>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#b91c1c' }}>Expense</Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#b91c1c' }}>{shortPkr(s.totalExpenseThisMonth)}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={expenseRatio} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(239,68,68,0.12)', '& .MuiLinearProgress-bar': { bgcolor: '#ef4444', borderRadius: 4 } }} />
              </Box>

              <Box>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: s.profitLossThisMonth >= 0 ? '#1d4ed8' : '#c2410c' }}>
                    {s.profitLossThisMonth >= 0 ? 'Profit Margin' : 'Loss'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: s.profitLossThisMonth >= 0 ? '#1d4ed8' : '#c2410c' }}>
                    {profitRatio}%
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.max(profitRatio, 0)} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(59,130,246,0.12)', '& .MuiLinearProgress-bar': { bgcolor: s.profitLossThisMonth >= 0 ? '#3b82f6' : '#f97316', borderRadius: 4 } }} />
              </Box>
            </Stack>

            <Divider sx={{ my: 2.5 }} />

            <Grid container spacing={1.5}>
              {[
                { label: 'Labour', value: s.activeLabourCount, icon: <GroupsOutlinedIcon sx={{ fontSize: 18 }} />, color: '#2563eb', bg: '#eff6ff' },
                { label: 'Employees', value: s.activeEmployeeCount, icon: <BadgeOutlinedIcon sx={{ fontSize: 18 }} />, color: '#059669', bg: '#ecfdf5' },
                { label: 'Machinery', value: s.activeMachineryCount, icon: <BuildOutlinedIcon sx={{ fontSize: 18 }} />, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Maintenance', value: s.maintenanceDueCount, icon: <WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />, color: s.maintenanceDueCount > 0 ? '#dc2626' : '#6b7280', bg: s.maintenanceDueCount > 0 ? '#fef2f2' : '#f9fafb' },
              ].map((c) => (
                <Grid key={c.label} size={{ xs: 6 }}>
                  <Box sx={{ bgcolor: c.bg, borderRadius: 2, p: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: c.color }}>{c.icon}</Box>
                    <Box>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 500 }}>{c.label}</Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Bar Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.07)', height: '100%' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>6-Month Overview</Typography>
                <Typography variant="caption" color="text.secondary">Income, expense & profit trend</Typography>
              </Box>
              <Chip
                icon={<TrendingFlatIcon sx={{ fontSize: '14px !important' }} />}
                label="Last 6 months"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 24 }}
              />
            </Stack>
            {s.monthlyChart.length > 0
              ? <BarChart data={s.monthlyChart} />
              : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}><Typography color="text.secondary" variant="body2">No data yet</Typography></Box>
            }
          </Paper>
        </Grid>
      </Grid>

      {/* ── Recent Transactions ─────────────────────── */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.07)' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Transactions</Typography>
            <Typography variant="caption" color="text.secondary">Latest financial activity</Typography>
          </Box>
        </Stack>

        {s.recentTransactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No transactions yet
          </Typography>
        ) : (
          <Grid container spacing={1}>
            {s.recentTransactions.slice(0, 10).map((tx, i) => (
              <Grid key={tx.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.06)',
                    bgcolor: i % 2 === 0 ? 'rgba(0,0,0,0.01)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                  }}
                >
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: tx.type === 'Income' ? '#dcfce7' : '#fee2e2',
                      color: tx.type === 'Income' ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {tx.type === 'Income'
                      ? <TrendingUpIcon sx={{ fontSize: 18 }} />
                      : <TrendingDownIcon sx={{ fontSize: 18 }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>
                      {tx.description || tx.category}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {tx.category} · {new Date(tx.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
                      color: tx.type === 'Income' ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {tx.type === 'Income' ? '+' : '-'}{shortPkr(tx.amount)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

    </Box>
  );
}
