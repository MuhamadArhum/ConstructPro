import { useEffect, useState } from 'react';
import { Box, CircularProgress, Fade, Typography } from '@mui/material';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';

interface LoaderProps {
  minHeight?: string | number;
}

export default function Loader({ minHeight = '220px' }: LoaderProps) {
  const [showSlow, setShowSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSlow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight,
        gap: 2,
      }}
    >
      <CircularProgress size={36} thickness={4} />

      <Fade in={showSlow} timeout={600}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mb: 0.5 }}>
            <CloudOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Server is starting up…
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', opacity: 0.7 }}>
            Free tier servers sleep when idle. Please wait a moment.
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
