import { Box, LinearProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface LoaderProps {
  minHeight?: string | number;
  label?: string;
}

export default function Loader({ minHeight = '300px', label }: LoaderProps) {
  const [showSlow, setShowSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        gap: '20px',
      }}
    >
      {/* Brand mark */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '4px' }}>
        <Box sx={{ width: 7, height: 7, bgcolor: '#E85D1F', flexShrink: 0 }} />
        <Typography
          sx={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.12em',
            color: '#6B7178',
            textTransform: 'uppercase',
          }}
        >
          {label ?? 'Loading'}
        </Typography>
      </Box>

      {/* Linear progress bar */}
      <Box sx={{ width: 160 }}>
        <LinearProgress
          sx={{
            height: 3,
            borderRadius: 2,
            bgcolor: '#D3CDBA',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#E85D1F',
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Slow server notice */}
      {showSlow && (
        <Typography
          sx={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10.5px',
            color: '#6B7178',
            opacity: 0.7,
            textAlign: 'center',
            maxWidth: 240,
            lineHeight: 1.6,
          }}
        >
          Free tier server is waking up.
          <br />
          Please wait a moment…
        </Typography>
      )}
    </Box>
  );
}
