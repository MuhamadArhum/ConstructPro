import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useKeepAlive } from '../../hooks/useKeepAlive';

export default function MainLayout() {
  useKeepAlive();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#ECE8DB' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <Toolbar sx={{ minHeight: '64px !important' }} />
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: '28px 32px 60px' } }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}
