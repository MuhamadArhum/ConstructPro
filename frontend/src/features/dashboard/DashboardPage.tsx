import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Loader from '../../components/common/Loader';
import { useGetDashboardStatsQuery } from './dashboardApi';

const BP   = '#0E2A47';
const INK  = '#14181B';
const STL  = '#6B7178';
const ORG  = '#E85D1F';
const GRN  = '#3E8E5A';
const AMB  = '#C98A1E';
const RED  = '#C23B2E';
const RULE = '#D3CDBA';
const PL   = '#F5F2E8';
const P    = '#ECE8DB';

const pkr = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

const shortPkr = (n: number) => {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `PKR ${(n / 1_000).toFixed(0)}K`;
  return pkr(n);
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        color: BP,
      }}
    >
      {children}
    </Typography>
  );
}

function MonoLabel({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Typography
      sx={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.04em',
        color: STL,
        textTransform: 'uppercase',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

function KpiCard({
  label, value, sub, trend, trendUp, borderColor,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  borderColor?: string;
}) {
  return (
    <Card
      sx={{
        border: `1px solid ${RULE}`,
        borderTop: `3px solid ${borderColor ?? ORG}`,
        borderRadius: '4px',
        bgcolor: PL,
        backgroundImage: 'none',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '14px' }}>
          <MonoLabel>{label}</MonoLabel>
          {trend && (
            <Box
              sx={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                px: '6px',
                py: '2px',
                borderRadius: '10px',
                bgcolor: trendUp ? 'rgba(62,142,90,0.12)' : 'rgba(194,59,46,0.12)',
                color: trendUp ? GRN : RED,
              }}
            >
              {trend}
            </Box>
          )}
        </Box>
        <Typography
          sx={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '28px',
            fontWeight: 600,
            color: BP,
            lineHeight: 1,
          }}
        >
          {value}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: '12px', color: STL, mt: '4px' }}>{sub}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

function BarChart({ data }: { data: { month: string; income: number; expense: number; profit: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: '18px', mb: '14px' }}>
        {[
          { color: BP,  label: 'Income' },
          { color: ORG, label: 'Expense' },
          { color: GRN, label: 'Profit' },
        ].map((item) => (
          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Box sx={{ width: 9, height: 9, bgcolor: item.color, borderRadius: '2px' }} />
            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: STL }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 160, gap: '2px' }}>
        {data.map((d) => (
          <Box key={d.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 140, width: '100%', justifyContent: 'center', gap: '2px' }}>
              <Box title={`Income: ${pkr(d.income)}`} sx={{ width: 10, height: `${(d.income / max) * 100}%`, minHeight: 4, bgcolor: BP, borderRadius: '3px 3px 0 0' }} />
              <Box title={`Expense: ${pkr(d.expense)}`} sx={{ width: 10, height: `${(d.expense / max) * 100}%`, minHeight: 4, bgcolor: ORG, borderRadius: '3px 3px 0 0' }} />
              <Box title={`Profit: ${pkr(d.profit)}`} sx={{ width: 10, height: `${(Math.max(d.profit, 0) / max) * 100}%`, minHeight: 4, bgcolor: d.profit >= 0 ? GRN : RED, borderRadius: '3px 3px 0 0' }} />
            </Box>
            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: STL }}>
              {d.month.slice(0, 3).toUpperCase()}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ height: 1, bgcolor: RULE, mt: '4px' }} />
    </Box>
  );
}

export default function DashboardPage() {
  const { data: s, isLoading } = useGetDashboardStatsQuery();

  if (isLoading || !s) return <Loader />;

  const profitRatio = s.totalIncomeThisMonth > 0
    ? Math.round((s.profitLossThisMonth / s.totalIncomeThisMonth) * 100)
    : 0;

  const expenseRatio = s.totalIncomeThisMonth > 0
    ? Math.min(Math.round((s.totalExpenseThisMonth / s.totalIncomeThisMonth) * 100), 100)
    : 0;

  const isProfit = s.profitLossThisMonth >= 0;

  return (
    <Box sx={{ pb: 3 }}>

      {/* ── KPI Cards ─────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: '28px' }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Total Income" value={shortPkr(s.totalIncomeThisMonth)} sub="This month" trend="+2.4%" trendUp borderColor={ORG} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Total Expense" value={shortPkr(s.totalExpenseThisMonth)} sub="This month" trend={`${expenseRatio}% of income`} trendUp={false} borderColor={BP} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label={isProfit ? 'Net Profit' : 'Net Loss'} value={shortPkr(Math.abs(s.profitLossThisMonth))} sub="This month" trend={`${Math.abs(profitRatio)}% margin`} trendUp={isProfit} borderColor={isProfit ? GRN : RED} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Pending Payments" value={shortPkr(s.pendingPayments)} sub="Awaiting collection" borderColor={AMB} />
        </Grid>
      </Grid>

      {/* ── Row 2: Performance + Chart ─────────────── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ border: `1px solid ${RULE}`, borderRadius: '4px', bgcolor: PL, overflow: 'hidden', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '16px 20px', borderBottom: `1px solid ${RULE}` }}>
              <SectionTitle>Monthly Performance</SectionTitle>
            </Box>
            <Box sx={{ p: '20px' }}>
              <Stack spacing={2.5}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '6px' }}>
                    <MonoLabel>Income</MonoLabel>
                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: GRN, fontWeight: 600 }}>{shortPkr(s.totalIncomeThisMonth)}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 4, bgcolor: RULE, '& .MuiLinearProgress-bar': { bgcolor: GRN } }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '6px' }}>
                    <MonoLabel>Expense</MonoLabel>
                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: RED, fontWeight: 600 }}>{shortPkr(s.totalExpenseThisMonth)}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={expenseRatio} sx={{ height: 6, borderRadius: 4, bgcolor: RULE, '& .MuiLinearProgress-bar': { bgcolor: RED } }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '6px' }}>
                    <MonoLabel>{isProfit ? 'Profit Margin' : 'Loss'}</MonoLabel>
                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: isProfit ? GRN : RED, fontWeight: 600 }}>{Math.abs(profitRatio)}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.max(Math.abs(profitRatio), 0)} sx={{ height: 6, borderRadius: 4, bgcolor: RULE, '& .MuiLinearProgress-bar': { bgcolor: isProfit ? GRN : RED } }} />
                </Box>
              </Stack>

              <Divider sx={{ my: 2.5, borderColor: RULE }} />

              <Grid container spacing={1.5}>
                {[
                  { label: 'Labour',      value: s.activeLabourCount,    icon: <GroupsOutlinedIcon sx={{ fontSize: 16 }} />,       color: BP  },
                  { label: 'Employees',   value: s.activeEmployeeCount,  icon: <BadgeOutlinedIcon sx={{ fontSize: 16 }} />,        color: GRN },
                  { label: 'Machinery',   value: s.activeMachineryCount, icon: <BuildOutlinedIcon sx={{ fontSize: 16 }} />,        color: ORG },
                  { label: 'Maintenance', value: s.maintenanceDueCount,  icon: <WarningAmberOutlinedIcon sx={{ fontSize: 16 }} />, color: s.maintenanceDueCount > 0 ? RED : STL },
                ].map((c) => (
                  <Grid key={c.label} size={{ xs: 6 }}>
                    <Box sx={{ p: '10px 12px', border: `1px solid ${RULE}`, borderRadius: '4px', bgcolor: P, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: c.color, opacity: 0.8 }}>{c.icon}</Box>
                      <Box>
                        <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '16px', fontWeight: 600, color: c.color, lineHeight: 1 }}>{c.value}</Typography>
                        <Typography sx={{ fontSize: '10px', color: STL, mt: '2px', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ border: `1px solid ${RULE}`, borderRadius: '4px', bgcolor: PL, overflow: 'hidden', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '16px 20px', borderBottom: `1px solid ${RULE}` }}>
              <SectionTitle>6-Month Overview</SectionTitle>
              <Box sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px', color: ORG, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingFlatIcon sx={{ fontSize: 14 }} /> Last 6 months
              </Box>
            </Box>
            <Box sx={{ p: '20px' }}>
              {s.monthlyChart.length > 0
                ? <BarChart data={s.monthlyChart} />
                : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: STL }}>NO DATA YET</Typography>
                  </Box>
              }
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Recent Transactions ─────────────────────── */}
      <Paper elevation={0} sx={{ border: `1px solid ${RULE}`, borderRadius: '4px', bgcolor: PL, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '16px 20px', borderBottom: `1px solid ${RULE}` }}>
          <SectionTitle>Recent Transactions</SectionTitle>
          <MonoLabel>Latest financial activity</MonoLabel>
        </Box>

        {s.recentTransactions.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: STL }}>NO TRANSACTIONS YET</Typography>
          </Box>
        ) : (
          <Grid container spacing={0}>
            {s.recentTransactions.slice(0, 10).map((tx) => (
              <Grid key={tx.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    p: '13px 20px',
                    borderBottom: `1px solid ${RULE}`,
                    borderRight: `1px solid ${RULE}`,
                    '&:hover': { bgcolor: 'rgba(154,198,232,0.06)' },
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: tx.type === 'Income' ? GRN : RED }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: '13px', fontWeight: 600, color: INK, lineHeight: 1.3 }}>
                      {tx.description || tx.category}
                    </Typography>
                    <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', color: STL, mt: '2px' }}>
                      {tx.category} · {new Date(tx.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 600, flexShrink: 0, color: tx.type === 'Income' ? GRN : RED }}>
                    {tx.type === 'Income' ? '+' : '−'}{shortPkr(tx.amount)}
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
