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
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, useMediaQuery, useTheme } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { Perms } from '../../utils/permissions';
import AppLogo from '../common/AppLogo';

export const SIDEBAR_WIDTH = 230;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
  section?: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" />, permission: Perms.Dashboard.View },

  { label: 'Income',        path: '/income',   icon: <AttachMoneyIcon fontSize="small" />, permission: Perms.Income.View,   section: 'Finance' },
  { label: 'Expense',       path: '/expense',  icon: <MoneyOffIcon fontSize="small" />,    permission: Perms.Expense.View   },
  { label: 'Tax',           path: '/tax',      icon: <ReceiptIcon fontSize="small" />,     permission: Perms.Tax.View       },
  { label: 'Accounts',      path: '/accounts', icon: <AccountBalanceIcon fontSize="small" />, permission: Perms.Accounts.View },

  { label: 'Labour',        path: '/labour',    icon: <GroupIcon fontSize="small" />,    permission: Perms.Labour.View,    section: 'Workforce' },
  { label: 'Employees',     path: '/employees', icon: <BadgeIcon fontSize="small" />,    permission: Perms.Employees.View  },

  { label: 'Machinery',         path: '/machinery', icon: <PrecisionManufacturingIcon fontSize="small" />, permission: Perms.Machinery.View, section: 'Assets' },
  { label: 'Vehicles',          path: '/vehicles',  icon: <DirectionsCarIcon fontSize="small" />,          permission: Perms.Vehicles.View  },
  { label: 'Plant & Equipment', path: '/plants',    icon: <FactoryIcon fontSize="small" />,                permission: Perms.Plants.View    },

  { label: 'Customers',  path: '/customers',  icon: <PersonIcon fontSize="small" />,        permission: Perms.Customers.View,  section: 'Procurement' },
  { label: 'Suppliers',  path: '/suppliers',  icon: <LocalShippingIcon fontSize="small" />, permission: Perms.Suppliers.View   },
  { label: 'Inventory',  path: '/inventory',  icon: <InventoryIcon fontSize="small" />,     permission: Perms.Inventory.View   },

  { label: 'Reports',         path: '/reports',       icon: <BarChartIcon fontSize="small" />,      permission: Perms.Reports.View,       section: 'System' },
  { label: 'Notifications',   path: '/notifications', icon: <NotificationsIcon fontSize="small" />, permission: Perms.Notifications.View  },
  { label: 'Settings',        path: '/settings',      icon: <SettingsIcon fontSize="small" />,      permission: Perms.Settings.View       },
  { label: 'User Management', path: '/users',         icon: <PeopleIcon fontSize="small" />,        permission: Perms.Users.View          },
  { label: 'Role Management', path: '/roles',         icon: <ShieldIcon fontSize="small" />,        permission: Perms.Roles.View          },
  { label: 'Audit Logs',      path: '/audit-logs',    icon: <HistoryIcon fontSize="small" />,       permission: Perms.AuditLogs.View      },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const drawerSx = {
  width: SIDEBAR_WIDTH,
  boxSizing: 'border-box' as const,
  overflowX: 'hidden' as const,
  border: 'none',
  borderRight: '1px solid rgba(154,198,232,0.18)',
  background: '#081B30',
  color: '#9AC6E8',
};

function DrawerContent({ onClose }: { onClose: () => void }) {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const visibleItems = navItems.filter((item) => !item.permission || permissions.includes(item.permission));

  return (
    <>
      <Box sx={{ px: 2.5, py: '22px', borderBottom: '1px solid rgba(154,198,232,0.18)' }}>
        <AppLogo size="sm" variant="dark" />
      </Box>

      <List sx={{ pt: '18px', pb: 2, overflowY: 'auto', flex: 1, px: '12px' }}>
        {visibleItems.map((item) => (
          <Box key={item.path}>
            {item.section && (
              <Typography
                sx={{
                  display: 'block',
                  px: '12px', pt: '14px', pb: '8px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10.5px', letterSpacing: '0.10em',
                  opacity: 0.5, textTransform: 'uppercase', color: '#C9D4DE',
                }}
              >
                {item.section}
              </Typography>
            )}
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              sx={{
                borderRadius: '4px', mb: '2px', px: '12px', py: '10px',
                color: '#9AC6E8', borderLeft: '2px solid transparent',
                transition: 'background .15s, opacity .15s',
                '& .MuiListItemIcon-root': { color: '#C9D4DE', minWidth: 32 },
                '& .MuiListItemText-primary': { color: '#C9D4DE' },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.07)',
                  '& .MuiListItemIcon-root': { color: '#E8EDF2' },
                  '& .MuiListItemText-primary': { color: '#E8EDF2' },
                },
                '&.active': {
                  bgcolor: 'rgba(232,93,31,0.14)', color: '#ffffff',
                  borderLeft: '2px solid #E85D1F',
                  '& .MuiListItemIcon-root': { color: '#E85D1F' },
                  '& .MuiListItemText-primary': { color: '#ffffff', fontWeight: 600 },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '13.5px', fontWeight: 500,
                      fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1,
                    },
                  },
                }}
              />
              {item.badge != null && (
                <Box sx={{ background: '#E85D1F', color: '#081B30', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 600, px: '6px', py: '1px', borderRadius: '10px', lineHeight: 1.6 }}>
                  {item.badge}
                </Box>
              )}
            </ListItemButton>
          </Box>
        ))}
      </List>

      <Box sx={{ px: '20px', py: '16px', borderTop: '1px solid rgba(154,198,232,0.18)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', opacity: 0.5, color: '#9AC6E8' }}>
        v4.2.0 — REV. 4
      </Box>
    </>
  );
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile: temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { ...drawerSx, width: SIDEBAR_WIDTH },
        }}
      >
        <DrawerContent onClose={onClose} />
      </Drawer>

      {/* Desktop: permanent drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { ...drawerSx, width: SIDEBAR_WIDTH },
        }}
      >
        <DrawerContent onClose={() => {}} />
      </Drawer>
    </Box>
  );
}
