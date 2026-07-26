import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { useForgotPasswordMutation } from './authApi';
import type { ApiError } from '../../types/common.types';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await forgotPassword({ email }).unwrap();
      setSubmitted(true);
      if (res.devResetUrl) setDevUrl(res.devResetUrl);
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.title ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            width: 52, height: 52, borderRadius: '50%',
            bgcolor: submitted ? 'success.main' : 'primary.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2, transition: 'background-color 0.3s',
            boxShadow: submitted
              ? '0 4px 14px rgba(46,125,50,0.35)'
              : '0 4px 14px rgba(21,101,192,0.35)',
          }}
        >
          {submitted
            ? <CheckCircleOutlinedIcon sx={{ color: 'white', fontSize: 24 }} />
            : <EmailOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {submitted ? 'Check your email' : 'Forgot password?'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {submitted
            ? `We sent a reset link to ${email}`
            : "Enter your email and we'll send you a reset link"}
        </Typography>
      </Box>

      {!submitted ? (
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
            <TextField
              label="Email Address" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required fullWidth autoFocus autoComplete="email" disabled={isLoading}
            />
            <Button
              type="submit" variant="contained" size="large"
              disabled={isLoading} fullWidth sx={{ py: 1.4, fontWeight: 600 }}
            >
              {isLoading ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </Stack>
        </form>
      ) : (
        <Stack spacing={2}>
          {devUrl && (
            <Alert severity="info" sx={{ borderRadius: 2, wordBreak: 'break-all' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Dev mode — use this link to reset:
              </Typography>
              <Typography component="a" href={devUrl} variant="caption" sx={{ color: 'inherit' }}>
                {devUrl}
              </Typography>
            </Alert>
          )}
          <Button variant="outlined" fullWidth onClick={() => { setSubmitted(false); setDevUrl(null); }}>
            Resend email
          </Button>
        </Stack>
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
