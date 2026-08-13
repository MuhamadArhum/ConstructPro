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
  Link,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { useLoginMutation } from './authApi';
import { setCredentials } from './authSlice';
import type { ApiError } from '../../types/common.types';
import AppLogo from '../../components/common/AppLogo';

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
      const apiError = err as { status?: number; data?: ApiError };
      if (!apiError.status) {
        setError('Server is not responding. Please wait a moment and try again.');
      } else if (apiError.status === 401 || apiError.status === 400) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(apiError.data?.detail ?? apiError.data?.title ?? 'Login failed. Please try again.');
      }
    }
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <AppLogo size="lg" variant="light" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          Sign in to your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome back! Enter your credentials to continue.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5, display: 'block' }}>
              Email Address
            </Typography>
            <TextField
              placeholder="you@company.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              autoComplete="email"
              disabled={isLoading}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>

          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Password
              </Typography>
              <Link component={RouterLink} to="/forgot-password" variant="caption" underline="hover" sx={{ color: 'primary.main', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </Stack>
            <TextField
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              disabled={isLoading}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                          ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                          : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            fullWidth
            sx={{
              py: 1.3,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
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
        © {new Date().getFullYear()} ConstructPro · Powered by{' '}
        <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>AbyteSol</Box>
      </Typography>
    </>
  );
}
