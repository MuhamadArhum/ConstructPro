import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { useLoginMutation } from './authApi';
import { setCredentials } from './authSlice';
import type { ApiError } from '../../types/common.types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await login({ email, password, rememberMe: false }).unwrap();
      dispatch(setCredentials(response));
      navigate('/', { replace: true });
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.detail ?? apiError.data?.title ?? 'Invalid credentials. Please try again.');
    }
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            width: 52, height: 52, borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
            boxShadow: '0 4px 14px rgba(21,101,192,0.35)',
          }}
        >
          <LockOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Sign in to continue to ConstructPro ERP
        </Typography>
      </Box>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoFocus
            autoComplete="email"
            disabled={isLoading}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            disabled={isLoading}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword
                        ? <VisibilityOffOutlinedIcon fontSize="small" />
                        : <VisibilityOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            fullWidth
            sx={{
              py: 1.4,
              mt: 0.5,
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(21,101,192,0.3)',
              '&:hover': { boxShadow: '0 6px 16px rgba(21,101,192,0.4)' },
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </Button>
        </Stack>
      </form>

      <Divider sx={{ my: 3 }} />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
        © {new Date().getFullYear()} ConstructPro ERP · All rights reserved
      </Typography>
    </>
  );
}
