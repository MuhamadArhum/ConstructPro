import { useState, type FormEvent } from 'react';
import {
  Alert, Box, Button, Divider, IconButton, InputAdornment,
  Stack, TextField, Typography,
} from '@mui/material';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from './authApi';
import type { ApiError } from '../../types/common.types';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';
  const hasValidParams = Boolean(email && token);

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    if (!hasValidParams) { setError('Invalid or expired reset link.'); return; }
    try {
      await resetPassword({ email, token, newPassword }).unwrap();
      setDone(true);
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.detail ?? apiError.data?.title ?? 'Failed to reset password. The link may have expired.');
    }
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            width: 52, height: 52, borderRadius: '50%',
            bgcolor: done ? 'success.main' : 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
            boxShadow: done
              ? '0 4px 14px rgba(46,125,50,0.35)'
              : '0 4px 14px rgba(21,101,192,0.35)',
          }}
        >
          {done
            ? <CheckCircleOutlinedIcon sx={{ color: 'white', fontSize: 24 }} />
            : <LockResetOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {done ? 'Password reset!' : 'Set new password'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {done ? 'You can now sign in with your new password.' : 'Must be at least 8 characters'}
        </Typography>
      </Box>

      {!done ? (
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {!hasValidParams && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Invalid or missing reset token. Please request a new reset link.
              </Alert>
            )}
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            <TextField
              label="New Password"
              type={showPw ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required fullWidth autoFocus
              disabled={isLoading || !hasValidParams}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small" tabIndex={-1}>
                        {showPw
                          ? <VisibilityOffOutlinedIcon fontSize="small" />
                          : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Confirm Password"
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required fullWidth
              disabled={isLoading || !hasValidParams}
              error={confirm.length > 0 && newPassword !== confirm}
              helperText={confirm.length > 0 && newPassword !== confirm ? 'Passwords do not match' : ''}
            />
            <Button
              type="submit" variant="contained" size="large"
              disabled={isLoading || !hasValidParams} fullWidth
              sx={{ py: 1.4, fontWeight: 600 }}
            >
              {isLoading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </Stack>
        </form>
      ) : (
        <Button
          component={RouterLink} to="/login"
          variant="contained" size="large" fullWidth
          sx={{ py: 1.4, fontWeight: 600 }}
        >
          Sign In
        </Button>
      )}

      <Divider sx={{ my: 3 }} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          component={RouterLink} to="/login" variant="body2" color="primary"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          ← Back to sign in
        </Typography>
      </Box>
    </>
  );
}
