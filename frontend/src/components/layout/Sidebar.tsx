import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutlined';
import ShieldIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoneyOutlined';
import MoneyOffIcon from '@mui/icons-material/MoneyOffOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined';
import FactoryIcon from '@mui/icons-material/FactoryOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import LocalShippingIcon from '@mui/icons-material/LocalShippingOutlined';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';
import ReceiptIcon from '@mui/icons-material/ReceiptOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceOutlined';
import BarChartIcon from '@mui/icons-material/BarChartOutlined';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Perms } from '../../utils/permissions';

export const SIDEBAR_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  section?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon />, permission: Perms.Dashboard.View },

  { label: 'Income', path: '/income', icon: <AttachMoneyIcon />, permission: Perms.Income.View, section: 'Finance' },
  { label: 'Expense', path: '/expense', icon: <MoneyOffIcon />, permission: Perms.Expense.View },
  { label: 'Tax Management', path: '/tax', icon: <ReceiptIcon />, permission: Perms.Tax.View },
  { label: 'Accounts', path: '/accounts', icon: <AccountBalanceIcon />, permission: Perms.Accounts.View },

  { label: 'Labour', path: '/labour', icon: <GroupIcon />, permission: Perms.Labour.View, section: 'Workforce' },
  { label: 'Employees', path: '/employees', icon: <BadgeIcon />, permission: Perms.Employees.View },

  { label: 'Machinery', path: '/machinery', icon: <PrecisionManufacturingIcon />, permission: Perms.Machinery.View, section: 'Assets' },
  { label: 'Vehicles', path: '/vehicles', icon: <DirectionsCarIcon />, permission: Perms.Vehicles.View },
  { label: 'Plant & Equipment', path: '/plants', icon: <FactoryIcon />, permission: Perms.Plants.View },

  { label: 'Customers', path: '/customers', icon: <PersonIcon />, permission: Perms.Customers.View, section: 'Procurement' },
  { label: 'Suppliers', path: '/suppliers', icon: <LocalShippingIcon />, permission: Perms.Suppliers.View },
  { label: 'Inventory', path: '/inventory', icon: <InventoryIcon />, permission: Perms.Inventory.View },

  { label: 'Reports', path: '/reports', icon: <BarChartIcon />, permission: Perms.Reports.View, section: 'System' },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon />, permission: Perms.Notifications.View },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon />, permission: Perms.Settings.View },
  { label: 'User Management', path: '/users', icon: <PeopleIcon />, permission: Perms.Users.View },
  { label: 'Role Management', path: '/roles', icon: <ShieldIcon />, permission: Perms.Roles.View },
  { label: 'Audit Logs', path: '/audit-logs', icon: <HistoryIcon />, permission: Perms.AuditLogs.View },
];

export default function Sidebar() {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const visibleItems = navItems.filter((item) => !item.permission || permissions.includes(item.permission));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          border: 'none',
          background: 'linear-gradient(180deg, #0a2540 0%, #0d2d4a 100%)',
          color: 'white',
        },
      }}
    >
      {/* Logo Area */}
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="ConstructPro"
          sx={{ height: 44, width: 'auto', filter: 'brightness(0) invert(1)' }}
        />
      </Box>

      {/* Nav Items */}
      <List sx={{ pt: 1.5, pb: 2, overflowY: 'auto', flex: 1, px: 1.5 }}>
        {visibleItems.map((item) => (
          <Box key={item.path}>
            {item.section && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  px: 1.5,
                  pt: 2,
                  pb: 0.5,
                  color: 'rgba(255,255,255,0.35)',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {item.section}
              </Typography>
            )}
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              sx={{
                borderRadius: 2,
                mb: 0.25,
                px: 1.5,
                py: 0.85,
                color: 'rgba(255,255,255,0.65)',
                '& .MuiListItemIcon-root': {
                  color: 'rgba(255,255,255,0.5)',
                  minWidth: 36,
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.07)',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
                '&.active': {
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  '& .MuiListItemIcon-root': { color: '#64b5f6' },
                  '& .MuiListItemText-primary': { fontWeight: 700 },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    variant: 'body2',
                    sx: { fontWeight: 500, fontSize: '0.875rem' },
                  },
                }}
              />
            </ListItemButton>
          </Box>
        ))}
      </List>

      {/* Bottom branding */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
          Powered by AbyteSol
        </Typography>
      </Box>
    </Drawer>
  );
}
