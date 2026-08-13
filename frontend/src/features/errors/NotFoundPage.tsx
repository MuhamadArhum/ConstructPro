import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ textAlign: 'center', mt: 12, px: 2 }}>
      <Typography variant="h1" sx={{ fontSize: '5rem', fontWeight: 700, color: 'text.disabled' }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        Page Not Found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The page you are looking for does not exist or you may not have access.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard', { replace: true })}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
