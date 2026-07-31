import { useState, useEffect, type MouseEvent } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearCredentials } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { useGetUnreadCountQuery } from '../../features/notifications/notificationApi';
import { tokenStorage } from '../../utils/tokenStorage';
import { SIDEBAR_WIDTH } from './Sidebar';
import { API_BASE_URL } from '../../utils/constants';

const ROUTE_LABELS: Record<string, string> = {
  '/':              'Dashboard',
  '/income':        'Income',
  '/expense':       'Expense',
  '/tax':           'Tax Management',
  '/accounts':      'Accounts',
  '/labour':        'Labour',
  '/employees':     'Employees',
  '/machinery':     'Machinery',
  '/vehicles':      'Vehicles',
  '/plants':        'Plant & Equipment',
  '/customers':     'Customers',
  '/suppliers':     'Suppliers',
  '/inventory':     'Inventory',
  '/reports':       'Reports',
  '/notifications': 'Notifications',
  '/settings':      'Settings',
  '/users':         'User Management',
  '/roles':         'Role Management',
  '/audit-logs':    'Audit Logs',
  '/profile':       'My Profile',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logout] = useLogoutMutation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { data: unreadData } = useGetUnreadCountQuery(undefined, { skip: !isAuthenticated });
  const unreadCount = unreadData?.count ?? 0;

  const pageTitle = ROUTE_LABELS[location.pathname] ?? 'ConstructPro';

  useEffect(() => {
    document.title = pageTitle === 'ConstructPro' ? 'ConstructPro' : `${pageTitle} | ConstructPro`;
  }, [pageTitle]);

  const now = new Date();
  const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  const subLine = `ALL PROJECTS · WEEK ${week}, ${now.getFullYear()}`;

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await logout({ accessToken: tokenStorage.getAccessToken() ?? '', refreshToken }).unwrap();
      } catch {
        // proceed with local logout even if server call fails
      }
    }
    dispatch(clearCredentials());
    navigate('/login', { replace: true });
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const avatarSrc = user?.profilePicturePath
    ? `${API_BASE_URL.replace('/api', '')}${user.profilePicturePath}`
    : undefined;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
        backgroundColor: '#F5F2E8',
        borderBottom: '1px solid #D3CDBA',
        color: '#14181B',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important', px: { xs: '16px', sm: '32px' } }}>

        {/* Left: hamburger (mobile) + page title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <IconButton
            onClick={onMenuClick}
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: '#0E2A47',
              mr: 0.5,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: { xs: '16px', sm: '20px' },
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: '#0E2A47',
                lineHeight: 1.1,
              }}
            >
              {pageTitle}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11.5px',
                color: '#6B7178',
                mt: '2px',
                lineHeight: 1,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {subLine}
            </Typography>
          </Box>
        </Box>

        {/* Right: notification + avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '10px', sm: '18px' }, flexShrink: 0 }}>

          {/* Notification bell */}
          <Box sx={{ position: 'relative' }}>
            <IconButton
              size="small"
              onClick={() => navigate('/notifications')}
              sx={{
                width: 34, height: 34,
                border: '1px solid #D3CDBA',
                borderRadius: '4px',
                bgcolor: '#fff',
                '&:hover': { bgcolor: 'rgba(14,42,71,0.05)', borderColor: '#0E2A47' },
              }}
            >
              <NotificationsOutlinedIcon sx={{ fontSize: 18, color: '#3B4147' }} />
            </IconButton>
            {unreadCount > 0 && (
              <Box
                sx={{
                  position: 'absolute', top: -3, right: -3,
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: '#E85D1F',
                  border: '1.5px solid #F5F2E8',
                }}
              />
            )}
          </Box>

          {/* Avatar */}
          <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
            <Avatar
              src={avatarSrc}
              sx={{
                width: 34, height: 34,
                bgcolor: '#0E2A47', color: '#F5F2E8',
                fontSize: '12px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 600, borderRadius: '50%',
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                mt: 1, minWidth: 210, borderRadius: '4px',
                border: '1px solid #D3CDBA',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                backgroundColor: '#F5F2E8',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '0.875rem', color: '#0E2A47' }}>
              {user?.fullName}
            </Typography>
            <Typography sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7178', mt: '2px' }}>
              {user?.email}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: '#D3CDBA' }} />
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.2, fontSize: '0.875rem', color: '#14181B' }}>
            <ListItemIcon><PersonIcon fontSize="small" sx={{ color: '#3B4147' }} /></ListItemIcon>
            My Profile
          </MenuItem>
          <Divider sx={{ borderColor: '#D3CDBA' }} />
          <MenuItem onClick={handleLogout} sx={{ py: 1.2, fontSize: '0.875rem', color: '#C23B2E' }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#C23B2E' }} /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
