import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import ConstructionIcon from '@mui/icons-material/Construction';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';

const FEATURES = [
  { icon: <ConstructionIcon fontSize="small" />, text: 'Project & Site Management' },
  { icon: <AccountTreeOutlinedIcon fontSize="small" />, text: 'Financial Tracking & Invoicing' },
  { icon: <EngineeringOutlinedIcon fontSize="small" />, text: 'Workforce & Resource Planning' },
  { icon: <BarChartOutlinedIcon fontSize="small" />, text: 'Real-time Analytics & Reports' },
];

export default function AuthLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left branding panel — hidden on mobile */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          width: '44%',
          minWidth: 380,
          background: 'linear-gradient(150deg, #0d47a1 0%, #1565c0 55%, #1976d2 100%)',
          p: 7,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute', top: -100, right: -100,
            width: 380, height: 380, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute', bottom: -60, left: -60,
            width: 260, height: 260, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute', top: '40%', right: -30,
            width: 140, height: 140, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.04)',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Brand */}
          <Box sx={{ mb: 5 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="ConstructPro"
              sx={{ height: 52, width: 'auto', filter: 'brightness(0) invert(1)' }}
            />
            <Typography
              sx={{ fontSize: '1rem', fontWeight: 400, opacity: 0.75, letterSpacing: 4, textTransform: 'uppercase', mt: 1.5 }}
            >
              ERP Platform
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.18)', mb: 4 }} />

          <Typography variant="body1" sx={{ opacity: 0.88, mb: 5, lineHeight: 1.8, maxWidth: 320 }}>
            The all-in-one enterprise platform built for modern construction companies.
            Manage every aspect of your business from a single workspace.
          </Typography>

          <Stack spacing={2.5}>
            {FEATURES.map(({ icon, text }) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 38, height: 38, borderRadius: 1.5,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  {text}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Typography variant="caption" sx={{ opacity: 0.45, display: 'block', mt: 8 }}>
            © {new Date().getFullYear()} ConstructPro ERP. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          variant="outlined"
          elevation={0}
          sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420, borderRadius: 3 }}
        >
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
}
