import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 2, px: 3, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        © {new Date().getFullYear()} BuildERP. All rights reserved.
      </Typography>
    </Box>
  );
}
