import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: '14px',
        px: '32px',
        borderTop: '1px solid #D3CDBA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        sx={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: '#6B7178',
          opacity: 0.7,
        }}
      >
        © {new Date().getFullYear()} CONSTRUCTPRO · ALL RIGHTS RESERVED
      </Typography>
      <Typography
        sx={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: '#6B7178',
          opacity: 0.5,
        }}
      >
        POWERED BY ABYTESOL
      </Typography>
    </Box>
  );
}
