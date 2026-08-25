import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetDashboardQuery } from './dashboardApi';
import type { DashboardActiveProject, DashboardChartPoint, DashboardLowStockAlert, DashboardRecentTransaction } from '../../types/dashboard.types';
import { fmtAmount } from '../../utils/formatNumber';

const fmt = fmtAmount;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}

function KpiCard({ label, value, sub, color, icon }: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.2, color }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.8, mt: 0.5 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, 'info' | 'success' | 'warning' | 'primary' | 'default'> = {
  Planning: 'info',
  Active: 'success',
  'On Hold': 'warning',
  Completed: 'primary',
};

function ProjectsPanel({ projects }: { projects: DashboardActiveProject[] }) {
  return (
    <Paper variant="outlined" sx={{ height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Active Projects
        </Typography>
        <Typography
          component={Link}
          to="/projects"
          variant="caption"
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          View All
        </Typography>
      </Box>
      {projects.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No active projects</Typography>
        </Box>
      ) : (
        <Box>
          {projects.slice(0, 5).map((p) => (
            <Box key={p.id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
                  {p.name}
                </Typography>
                <Chip
                  label={p.status}
                  size="small"
                  color={statusColors[p.status] ?? 'default'}
                  sx={{ fontSize: '10px', height: 20 }}
                />
              </Box>
              {p.clientName && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {p.clientName}
                </Typography>
              )}
              <Box sx={{ mt: 0.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" color="text.secondary">Progress</Typography>
                  <Typography variant="caption" color="text.secondary">{p.progress}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={p.progress} sx={{ height: 5, borderRadius: 3 }} />
              </Box>
              {p.endDate && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Due: {fmtDate(p.endDate)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

function LowStockPanel({ alerts }: { alerts: DashboardLowStockAlert[] }) {
  return (
    <Paper variant="outlined" sx={{ height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Low Stock Alerts
        </Typography>
        <Typography
          component={Link}
          to="/inventory"
          variant="caption"
          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          View Inventory
        </Typography>
      </Box>
      {alerts.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">All stock levels OK</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {alerts.slice(0, 5).map((a) => {
            const isOut = a.currentStock === 0;
            const itemColor = isOut ? 'error.main' : 'warning.main';
            return (
              <ListItem key={a.id} divider sx={{ py: 1.25, px: 2 }}>
                <ListItemText
                  primary={
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{a.name}</Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: itemColor, fontWeight: 600 }}>
                      {a.currentStock}{a.unit ? ` ${a.unit}` : ''} / threshold: {a.lowStockThreshold}{a.unit ? ` ${a.unit}` : ''}
                    </Typography>
                  }
                />
                <WarningAmberIcon sx={{ color: itemColor, fontSize: 18, ml: 1, flexShrink: 0 }} />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}

function TransactionsPanel({ transactions }: { transactions: DashboardRecentTransaction[] }) {
  return (
    <Paper variant="outlined" sx={{ height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Recent Transactions
        </Typography>
      </Box>
      {transactions.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No transactions yet</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {transactions.slice(0, 10).map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <ListItem key={tx.id} divider sx={{ py: 1, px: 2 }}>
                <Box sx={{ mr: 1.5, color: isIncome ? 'success.main' : 'error.main', display: 'flex', alignItems: 'center' }}>
                  {isIncome
                    ? <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                    : <ArrowDownwardIcon sx={{ fontSize: 16 }} />}
                </Box>
                <ListItemText
                  primary={
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                      {tx.category}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">{fmtDate(tx.date)}</Typography>
                  }
                />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: isIncome ? 'success.main' : 'error.main', flexShrink: 0, ml: 1 }}
                >
                  {isIncome ? '+' : '-'}{fmt(tx.amount)}
                </Typography>
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}

function MuiBarChart({ data }: { data: DashboardChartPoint[] }) {
  const allValues = data.flatMap((d) => [d.income, d.expense]);
  const max = Math.max(...allValues, 1);
  const MAX_H = 200;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {[
          { color: 'success.main', label: 'Income' },
          { color: 'error.main', label: 'Expense' },
        ].map((leg) => (
          <Box key={leg.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: leg.color }} />
            <Typography variant="caption" color="text.secondary">{leg.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, overflowX: 'auto', pb: 1 }}>
        {data.map((d) => {
          const incH = Math.max((d.income / max) * MAX_H, d.income > 0 ? 4 : 0);
          const expH = Math.max((d.expense / max) * MAX_H, d.expense > 0 ? 4 : 0);
          return (
            <Box key={`${d.year}-${d.month}`} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', minWidth: 40 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: MAX_H }}>
                <Tooltip title={`Income: ${fmt(d.income)}`} arrow>
                  <Box
                    sx={{
                      width: 16,
                      height: incH,
                      bgcolor: 'success.main',
                      borderRadius: '3px 3px 0 0',
                      opacity: 0.85,
                      cursor: 'default',
                      transition: 'opacity .2s',
                      '&:hover': { opacity: 1 },
                    }}
                  />
                </Tooltip>
                <Tooltip title={`Expense: ${fmt(d.expense)}`} arrow>
                  <Box
                    sx={{
                      width: 16,
                      height: expH,
                      bgcolor: 'error.main',
                      borderRadius: '3px 3px 0 0',
                      opacity: 0.75,
                      cursor: 'default',
                      transition: 'opacity .2s',
                      '&:hover': { opacity: 1 },
                    }}
                  />
                </Tooltip>
              </Box>
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', display: 'block', fontWeight: 600 }}>
                  {d.monthName.slice(0, 3).toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px', display: 'block' }}>
                  {d.year}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1 }} />
    </Box>
  );
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data, isLoading, isError, refetch } = useGetDashboardQuery();

  if (isLoading) {
    return (
      <Box sx={{ pb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={180} height={40} />
          <Skeleton variant="text" width={140} height={24} />
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={18} />
                  <Skeleton variant="text" width="80%" height={32} sx={{ mt: 0.5 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Paper variant="outlined" sx={{ mb: 3, p: 2.5 }}>
          <Skeleton variant="text" width={220} height={22} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
        </Paper>
        <Grid container spacing={2}>
          {[5, 4, 3].map((md, i) => (
            <Grid key={i} size={{ xs: 12, md }}>
              <Paper variant="outlined" sx={{ height: 280 }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Skeleton variant="text" width="50%" height={20} />
                </Box>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Box key={j} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Skeleton variant="text" width="80%" height={18} />
                    <Skeleton variant="text" width="50%" height={14} />
                  </Box>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <Typography variant="h6" color="text.secondary">Failed to load dashboard</Typography>
        <Typography variant="body2" color="text.secondary">The server may still be starting up. Please try again.</Typography>
        <Box>
          <button onClick={() => refetch()} style={{ padding: '8px 20px', cursor: 'pointer', borderRadius: 6, border: '1px solid #ccc', background: '#fff', fontSize: 14 }}>
            Retry
          </button>
        </Box>
      </Box>
    );
  }

  const profit = data.thisMonth.profit;
  const isProfit = profit >= 0;

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dashboard
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {greeting()}, {user.fullName.split(' ')[0]}
            </Typography>
          )}
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={() => refetch()} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Row 1 — KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label="This Month Income"
            value={fmt(data.thisMonth.income)}
            color="success.main"
            icon={<AttachMoneyIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label="This Month Expense"
            value={fmt(data.thisMonth.expense)}
            color="error.main"
            icon={<MoneyOffIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label={isProfit ? 'Net Profit' : 'Net Loss'}
            value={fmt(Math.abs(profit))}
            color={isProfit ? 'success.main' : 'error.main'}
            icon={isProfit ? <TrendingUpIcon /> : <TrendingDownIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label="Active Projects"
            value={String(data.activeProjectsCount)}
            color="info.main"
            icon={<BusinessCenterIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label="Customer Outstanding"
            value={fmt(data.customerOutstanding)}
            color="warning.main"
            icon={<PersonIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label="Supplier Outstanding"
            value={fmt(data.supplierOutstanding)}
            color="error.main"
            icon={<LocalShippingIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label="Unpaid Invoices"
            value={fmt(data.unpaidInvoicesTotal)}
            sub={`${data.unpaidInvoicesCount} invoice${data.unpaidInvoicesCount !== 1 ? 's' : ''}`}
            color="warning.dark"
            icon={<ReceiptIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            label="Pending POs"
            value={String(data.pendingPOCount)}
            color="info.main"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
      </Grid>

      {/* Row 2 — Chart */}
      <Paper variant="outlined" sx={{ mb: 3, p: 2.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 2 }}>
          Income vs Expense — Last 6 Months
        </Typography>
        {data.chart.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No chart data available</Typography>
          </Box>
        ) : (
          <MuiBarChart data={data.chart} />
        )}
      </Paper>

      {/* Row 3 — Three Columns */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <ProjectsPanel projects={data.activeProjects} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <LowStockPanel alerts={data.lowStockAlerts} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <TransactionsPanel transactions={data.recentTransactions} />
        </Grid>
      </Grid>
    </Box>
  );
}
