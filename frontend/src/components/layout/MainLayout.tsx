import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <Toolbar sx={{ minHeight: '60px !important' }} />
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, maxWidth: 1400 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}
