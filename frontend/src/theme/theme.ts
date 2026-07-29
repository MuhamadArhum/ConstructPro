import { createTheme } from '@mui/material/styles';

// Blueprint design tokens
const BLUEPRINT       = '#0E2A47';
const BLUEPRINT_DEEP  = '#081B30';
const BLUEPRINT_LIGHT = '#1F4A73';
const LINE_CYAN       = '#9AC6E8';
const PAPER           = '#ECE8DB';
const PAPER_LIGHT     = '#F5F2E8';
const INK             = '#14181B';
const INK_SOFT        = '#3B4147';
const STEEL           = '#6B7178';
const SAFETY_ORANGE   = '#E85D1F';
const SAFETY_DEEP     = '#C24A16';
const GREEN_OK        = '#3E8E5A';
const AMBER_WARN      = '#C98A1E';
const RED_RISK        = '#C23B2E';
const RULE            = '#D3CDBA';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: SAFETY_ORANGE,
      dark: SAFETY_DEEP,
      light: '#EE7B45',
      contrastText: '#fff',
    },
    secondary: {
      main: BLUEPRINT,
      dark: BLUEPRINT_DEEP,
      light: BLUEPRINT_LIGHT,
      contrastText: '#fff',
    },
    success:    { main: GREEN_OK,   light: 'rgba(62,142,90,0.12)'  },
    error:      { main: RED_RISK,   light: 'rgba(194,59,46,0.12)'  },
    warning:    { main: AMBER_WARN, light: 'rgba(201,138,30,0.14)' },
    info:       { main: LINE_CYAN },
    background: {
      default: PAPER,
      paper:   PAPER_LIGHT,
    },
    text: {
      primary:   INK,
      secondary: STEEL,
    },
    divider: RULE,
  },

  typography: {
    fontFamily: ["'IBM Plex Sans'", 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h1: {
      fontFamily: "'Oswald', sans-serif",
      fontSize: '1.75rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.02em', color: BLUEPRINT,
    },
    h2: {
      fontFamily: "'Oswald', sans-serif",
      fontSize: '1.4rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.02em', color: BLUEPRINT,
    },
    h3: {
      fontFamily: "'Oswald', sans-serif",
      fontSize: '1.15rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.02em', color: BLUEPRINT,
    },
    h4: {
      fontFamily: "'Oswald', sans-serif",
      fontSize: '1rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.02em', color: BLUEPRINT,
    },
    h5: {
      fontFamily: "'Oswald', sans-serif",
      fontSize: '0.9rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.03em', color: BLUEPRINT,
    },
    h6: {
      fontFamily: "'Oswald', sans-serif",
      fontSize: '0.8rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.03em', color: BLUEPRINT,
    },
    subtitle1: { fontWeight: 600, fontSize: '0.95rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.82rem', color: STEEL },
    body1:     { fontSize: '0.9rem', color: INK },
    body2:     { fontSize: '0.82rem', color: INK_SOFT },
    caption:   { fontSize: '0.72rem', color: STEEL, fontFamily: "'IBM Plex Mono', monospace" },
    button:    { fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.04em', fontFamily: "'IBM Plex Sans', sans-serif" },
  },

  shape: { borderRadius: 4 },

  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06)',
    '0 2px 8px rgba(0,0,0,0.07)',
    '0 4px 16px rgba(0,0,0,0.08)',
    '0 6px 24px rgba(0,0,0,0.09)',
    '0 8px 32px rgba(0,0,0,0.10)',
    ...Array(19).fill('none'),
  ] as any,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: PAPER },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${RULE}`,
          backgroundColor: PAPER_LIGHT,
          color: INK,
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 4,
          backgroundColor: PAPER_LIGHT,
        },
        outlined: {
          border: `1px solid ${RULE}`,
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 4,
          border: `1px solid ${RULE}`,
          backgroundColor: PAPER_LIGHT,
          backgroundImage: 'none',
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': { paddingBottom: '20px' },
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 600,
          padding: '7px 18px',
        },
        contained: {
          backgroundColor: SAFETY_ORANGE,
          '&:hover': { backgroundColor: SAFETY_DEEP },
        },
        outlined: {
          borderColor: RULE,
          color: BLUEPRINT,
          '&:hover': {
            borderColor: SAFETY_ORANGE,
            backgroundColor: 'rgba(232,93,31,0.04)',
          },
        },
        text: {
          color: BLUEPRINT,
          '&:hover': { backgroundColor: 'rgba(14,42,71,0.05)' },
        },
      },
    },

    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: '#fff',
            '& fieldset': { borderColor: RULE },
            '&:hover fieldset': { borderColor: BLUEPRINT },
            '&.Mui-focused fieldset': { borderColor: SAFETY_ORANGE },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: SAFETY_ORANGE },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 4 },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#fff',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: SAFETY_ORANGE },
        },
        notchedOutline: { borderColor: RULE },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          fontSize: '0.68rem',
          height: 22,
          borderRadius: 10,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        },
        colorSuccess: {
          backgroundColor: 'rgba(62,142,90,0.12)',
          color: GREEN_OK,
        },
        colorWarning: {
          backgroundColor: 'rgba(201,138,30,0.14)',
          color: AMBER_WARN,
        },
        colorError: {
          backgroundColor: 'rgba(194,59,46,0.12)',
          color: RED_RISK,
        },
        colorPrimary: {
          backgroundColor: 'rgba(232,93,31,0.12)',
          color: SAFETY_ORANGE,
        },
        colorSecondary: {
          backgroundColor: 'rgba(14,42,71,0.1)',
          color: BLUEPRINT,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: PAPER,
            color: STEEL,
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 500,
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `1px solid ${RULE}`,
            padding: '10px 20px',
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(154,198,232,0.06)',
          },
          '& .MuiTableRow-root:last-child .MuiTableCell-body': {
            borderBottom: 'none',
          },
          '& .MuiTableCell-body': {
            fontSize: '0.85rem',
            borderBottom: `1px solid ${RULE}`,
            padding: '13px 20px',
            color: INK,
          },
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${RULE}`,
          fontSize: '0.8rem',
          fontFamily: "'IBM Plex Mono', monospace",
          color: STEEL,
        },
        selectLabel: { fontSize: '0.8rem' },
        displayedRows: { fontSize: '0.8rem' },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          border: `1px solid ${RULE}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          backgroundColor: PAPER_LIGHT,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: "'Oswald', sans-serif",
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          color: BLUEPRINT,
          paddingBottom: 8,
          borderBottom: `1px solid ${RULE}`,
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 4,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.72rem',
          backgroundColor: BLUEPRINT_DEEP,
          padding: '5px 10px',
          letterSpacing: '0.02em',
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: RULE },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },

    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          fontWeight: 600,
          minWidth: 16,
          height: 16,
          borderRadius: 8,
        },
        colorError: {
          backgroundColor: SAFETY_ORANGE,
          color: '#fff',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 600,
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: STEEL,
          '&.Mui-selected': { color: SAFETY_ORANGE },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: SAFETY_ORANGE, height: 2 },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          fontWeight: 600,
          color: INK_SOFT,
          '&.Mui-focused': { color: SAFETY_ORANGE },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.85rem',
          color: STEEL,
          '&.Mui-focused': { color: SAFETY_ORANGE },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': { color: SAFETY_ORANGE },
          '&.Mui-checked + .MuiSwitch-track': { backgroundColor: SAFETY_ORANGE },
        },
      },
    },

    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: RULE,
          '&.Mui-checked': { color: SAFETY_ORANGE },
        },
      },
    },

    MuiRadio: {
      styleOverrides: {
        root: {
          color: RULE,
          '&.Mui-checked': { color: SAFETY_ORANGE },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 4,
          backgroundColor: RULE,
        },
        bar: { backgroundColor: SAFETY_ORANGE, borderRadius: 4 },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 4,
          border: `1px solid ${RULE}`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          backgroundColor: PAPER_LIGHT,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&:hover': { backgroundColor: 'rgba(232,93,31,0.06)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(232,93,31,0.1)',
            '&:hover': { backgroundColor: 'rgba(232,93,31,0.14)' },
          },
        },
      },
    },
  },
});
