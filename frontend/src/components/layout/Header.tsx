import { useState, type MouseEvent } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearCredentials } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { useGetUnreadCountQuery } from '../../features/notifications/notificationApi';
import { tokenStorage } from '../../utils/tokenStorage';
import { SIDEBAR_WIDTH } from './Sidebar';
import { API_BASE_URL } from '../../utils/constants';

export default function Header() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.count ?? 0;

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
      color="inherit"
      elevation={0}
      sx={{
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        ml: `${SIDEBAR_WIDTH}px`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important', px: 3 }}>

        {/* Left: greeting */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
            {user?.fullName ?? 'Welcome'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.roles.join(', ')}
          </Typography>
        </Box>

        {/* Right: actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

          {/* Notification Bell */}
          <IconButton
            size="small"
            onClick={() => navigate('/notifications')}
            sx={{
              width: 36, height: 36,
              bgcolor: 'rgba(0,0,0,0.04)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' },
            }}
          >
            <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="error" max={99}>
              <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          {/* Divider */}
          <Box sx={{ width: 1, height: 28, bgcolor: 'divider', mx: 1 }} />

          {/* Avatar */}
          <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
            <Avatar
              src={avatarSrc}
              sx={{
                width: 34, height: 34,
                bgcolor: 'primary.main',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '2px solid rgba(26,115,232,0.2)',
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
                mt: 1,
                minWidth: 200,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{user?.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => { handleMenuClose(); navigate('/profile'); }}
            sx={{ py: 1.2, fontSize: '0.875rem' }}
          >
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleLogout}
            sx={{ py: 1.2, fontSize: '0.875rem', color: 'error.main' }}
          >
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
