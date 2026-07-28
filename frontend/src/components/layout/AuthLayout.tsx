import { Box, Paper, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const FEATURES = [
  'Finance & Expense Tracking',
  'Labour & Employee Management',
  'Machinery & Asset Control',
  'Inventory & Stock Alerts',
  'Real-time Reports & Dashboard',
  'Role-based Access & Audit Logs',
];

export default function AuthLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f4ff' }}>

      {/* Left branding panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          width: '46%',
          minWidth: 400,
          background: 'linear-gradient(160deg, #0a2540 0%, #1565c0 60%, #1976d2 100%)',
          p: 8,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <Box sx={{ position: 'absolute', top: -120, right: -120, width: 420, height: 420, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ position: 'absolute', top: '35%', right: -40, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <Box
            component="img"
            src="/logo.png"
            alt="ConstructPro"
            sx={{ height: 48, width: 'auto', mb: 5, filter: 'brightness(0) invert(1)' }}
          />

          {/* Headline */}
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, lineHeight: 1.25, mb: 1.5, letterSpacing: '-0.5px' }}>
            Run your construction business smarter.
          </Typography>
          <Typography sx={{ fontSize: '0.97rem', opacity: 0.72, mb: 5, lineHeight: 1.75, maxWidth: 340 }}>
            ConstructPro brings finance, workforce, assets, and inventory into one powerful platform — built for builders.
          </Typography>

          {/* Feature list */}
          <Stack spacing={1.8}>
            {FEATURES.map((f) => (
              <Stack key={f} direction="row" spacing={1.5} alignItems="center">
                <CheckCircleOutlineIcon sx={{ fontSize: 18, opacity: 0.85, color: '#64b5f6' }} />
                <Typography sx={{ fontSize: '0.88rem', opacity: 0.9, fontWeight: 500 }}>{f}</Typography>
              </Stack>
            ))}
          </Stack>

          <Typography variant="caption" sx={{ opacity: 0.35, display: 'block', mt: 7 }}>
            © {new Date().getFullYear()} ConstructPro · Powered by AbyteSol
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
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            width: '100%',
            maxWidth: 420,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(0,0,0,0.09)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
}
