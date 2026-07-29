import { Box, Stack, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AppLogo from '../common/AppLogo';

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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#ECE8DB' }}>

      {/* Left branding panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          width: '46%',
          minWidth: 400,
          background: '#081B30',
          borderRight: '1px solid rgba(154,198,232,0.18)',
          p: 8,
          color: '#9AC6E8',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Blueprint grid decoration */}
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(154,198,232,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(154,198,232,0.04) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Brand mark */}
          <Box sx={{ mb: 6 }}>
            <AppLogo size="md" variant="dark" />
          </Box>

          {/* Headline */}
          <Typography
            sx={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '2rem',
              fontWeight: 600,
              lineHeight: 1.2,
              mb: 2,
              letterSpacing: '0.02em',
              color: '#F5F2E8',
              textTransform: 'uppercase',
            }}
          >
            Run your construction business smarter.
          </Typography>
          <Typography
            sx={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.95rem',
              color: 'rgba(154,198,232,0.75)',
              mb: 5,
              lineHeight: 1.75,
              maxWidth: 340,
            }}
          >
            ConstructPro brings finance, workforce, assets, and inventory into one powerful platform — built for builders.
          </Typography>

          {/* Feature list */}
          <Stack spacing={1.75}>
            {FEATURES.map((f) => (
              <Stack key={f} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 6, height: 6,
                    background: '#E85D1F',
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: '0.875rem',
                    color: 'rgba(154,198,232,0.85)',
                    fontWeight: 500,
                  }}
                >
                  {f}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Typography
            sx={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              opacity: 0.3,
              display: 'block',
              mt: 7,
              color: '#9AC6E8',
            }}
          >
            © {new Date().getFullYear()} CONSTRUCTPRO · POWERED BY ABYTESOL
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
        <Box
          sx={{
            p: { xs: 3, sm: '36px 40px' },
            width: '100%',
            maxWidth: 420,
            borderRadius: '4px',
            border: '1px solid #D3CDBA',
            backgroundColor: '#F5F2E8',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
