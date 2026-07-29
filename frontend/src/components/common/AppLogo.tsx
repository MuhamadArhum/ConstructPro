import { Box, Typography } from '@mui/material';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** dark = orange dot + cream text (on dark bg), light = orange dot + blueprint text (on light bg) */
  variant?: 'dark' | 'light';
}

const cfg = {
  sm: { dot: 10, font: '16px', gap: '10px', weight: 600, tracking: '0.04em' },
  md: { dot: 13, font: '20px', gap: '11px', weight: 700, tracking: '0.06em' },
  lg: { dot: 16, font: '24px', gap: '13px', weight: 700, tracking: '0.06em' },
};

const textColor = {
  dark: '#F5F2E8',
  light: '#0E2A47',
};

export default function AppLogo({ size = 'sm', variant = 'dark' }: AppLogoProps) {
  const s = cfg[size];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: s.gap, userSelect: 'none' }}>
      <Box
        sx={{
          width: s.dot,
          height: s.dot,
          backgroundColor: '#E85D1F',
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: s.font,
          fontWeight: s.weight,
          letterSpacing: s.tracking,
          color: textColor[variant],
          lineHeight: 1,
        }}
      >
        CONSTRUCTPRO
      </Typography>
    </Box>
  );
}
