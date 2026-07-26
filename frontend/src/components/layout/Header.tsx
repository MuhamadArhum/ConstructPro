import { useState, type MouseEvent } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  ListItemIcon,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearCredentials } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { tokenStorage } from '../../utils/tokenStorage';
import { SIDEBAR_WIDTH } from './Sidebar';
import { API_BASE_URL } from '../../utils/constants';

export default function Header() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

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
    ? user.fullName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
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
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.fullName ?? 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.roles.join(', ')}
            </Typography>
          </Box>
          <IconButton onClick={handleMenuOpen} size="small">
            <Avatar src={avatarSrc} sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
              {initials}
            </Avatar>
          </IconButton>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          slotProps={{ paper: { sx: { minWidth: 180 } } }}
        >
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            My Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
