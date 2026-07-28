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
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Perms } from '../../utils/permissions';

export const SIDEBAR_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  dividerBefore?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon />, permission: Perms.Dashboard.View },

  { label: 'Income', path: '/income', icon: <AttachMoneyIcon />, permission: Perms.Income.View, dividerBefore: true },
  { label: 'Expense', path: '/expense', icon: <MoneyOffIcon />, permission: Perms.Expense.View },

  { label: 'Labour', path: '/labour', icon: <GroupIcon />, permission: Perms.Labour.View, dividerBefore: true },
  { label: 'Employees', path: '/employees', icon: <BadgeIcon />, permission: Perms.Employees.View },

  { label: 'Machinery', path: '/machinery', icon: <PrecisionManufacturingIcon />, permission: Perms.Machinery.View, dividerBefore: true },
  { label: 'Vehicles', path: '/vehicles', icon: <DirectionsCarIcon />, permission: Perms.Vehicles.View },
  { label: 'Plant & Equipment', path: '/plants', icon: <FactoryIcon />, permission: Perms.Plants.View },

  { label: 'Customers', path: '/customers', icon: <PersonIcon />, permission: Perms.Customers.View, dividerBefore: true },
  { label: 'Suppliers', path: '/suppliers', icon: <LocalShippingIcon />, permission: Perms.Suppliers.View },
  { label: 'Inventory', path: '/inventory', icon: <InventoryIcon />, permission: Perms.Inventory.View },

  { label: 'Tax Management', path: '/tax', icon: <ReceiptIcon />, permission: Perms.Tax.View, dividerBefore: true },
  { label: 'Accounts', path: '/accounts', icon: <AccountBalanceIcon />, permission: Perms.Accounts.View },

  { label: 'Reports', path: '/reports', icon: <BarChartIcon />, permission: Perms.Reports.View, dividerBefore: true },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon />, permission: Perms.Notifications.View },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon />, permission: Perms.Settings.View },

  { label: 'User Management', path: '/users', icon: <PeopleIcon />, permission: Perms.Users.View, dividerBefore: true },
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
        [`& .MuiDrawer-paper`]: { width: SIDEBAR_WIDTH, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider', overflowX: 'hidden' },
      }}
    >
      <Toolbar sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="ConstructPro" style={{ height: 36, width: 'auto' }} />
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 1, overflowY: 'auto', flex: 1 }}>
        {visibleItems.map((item) => (
          <Box key={item.path}>
            {item.dividerBefore && <Divider sx={{ my: 0.5, mx: 1 }} />}
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              sx={{
                mx: 1, borderRadius: 1.5, mb: 0.5,
                '&.active': {
                  backgroundColor: 'primary.main', color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body2', sx: { fontWeight: 500 } } }} />
            </ListItemButton>
          </Box>
        ))}
      </List>
    </Drawer>
  );
}
