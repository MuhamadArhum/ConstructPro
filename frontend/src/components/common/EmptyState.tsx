import { Box, Button, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  message?: string;
  subMessage?: string;
  icon?: React.ReactElement;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ message = 'No records found', subMessage, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
      <Box sx={{ color: 'text.disabled', mb: 1.5 }}>
        {icon ?? <InboxIcon sx={{ fontSize: 48 }} />}
      </Box>
      <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
        {message}
      </Typography>
      {subMessage && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
          {subMessage}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="outlined" size="small" onClick={onAction} sx={{ mt: subMessage ? 0 : 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
