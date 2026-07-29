import { createTheme, alpha } from '@mui/material/styles';

const PRIMARY = '#1a73e8';
const PRIMARY_DARK = '#1557b0';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: PRIMARY,
      dark: PRIMARY_DARK,
      light: '#4d90ef',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00897b',
    },
    success: { main: '#2e7d32', light: '#e8f5e9' },
    error:   { main: '#c62828', light: '#ffebee' },
    warning: { main: '#e65100', light: '#fff3e0' },
    background: {
      default: '#f0f4f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f1923',
      secondary: '#64748b',
    },
    divider: 'rgba(0,0,0,0.08)',
  },

  typography: {
    fontFamily: ['Inter', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.4px' },
    h2: { fontSize: '1.4rem',  fontWeight: 700, letterSpacing: '-0.3px' },
    h3: { fontSize: '1.2rem',  fontWeight: 600 },
    h4: { fontSize: '1.1rem',  fontWeight: 600 },
    h5: { fontSize: '1rem',    fontWeight: 600 },
    h6: { fontSize: '0.9rem',  fontWeight: 600 },
    subtitle1: { fontWeight: 600, fontSize: '0.95rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.82rem', color: '#64748b' },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.82rem' },
    caption: { fontSize: '0.75rem', color: '#64748b' },
    button: { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem' },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 8px rgba(0,0,0,0.07)',
    '0 4px 16px rgba(0,0,0,0.08)',
    '0 6px 24px rgba(0,0,0,0.09)',
    '0 8px 32px rgba(0,0,0,0.10)',
    ...Array(19).fill('none'),
  ] as any,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f0f4f8' },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
        },
        outlined: {
          border: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.09)',
          },
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
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '7px 18px',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(26,115,232,0.25)',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(26,115,232,0.35)',
          },
        },
        outlined: {
          borderColor: 'rgba(0,0,0,0.15)',
          '&:hover': { borderColor: PRIMARY, backgroundColor: alpha(PRIMARY, 0.04) },
        },
      },
    },

    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
            '&:hover fieldset': { borderColor: PRIMARY },
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 8 },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
        notchedOutline: { borderColor: 'rgba(0,0,0,0.15)' },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.72rem',
          height: 24,
          borderRadius: 6,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8fafc',
            color: '#64748b',
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: '10px 14px',
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: '#f8fafc',
          },
          '& .MuiTableCell-body': {
            fontSize: '0.85rem',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            padding: '10px 14px',
            color: '#0f1923',
          },
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },

    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '0.82rem' },
        selectLabel: { fontSize: '0.82rem' },
        displayedRows: { fontSize: '0.82rem' },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1.05rem', fontWeight: 700, paddingBottom: 8 },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          backgroundColor: '#0f1923',
          padding: '5px 10px',
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(0,0,0,0.07)' },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },

    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
    },
  },
});
