import { Box, Card, CardContent, Skeleton } from '@mui/material';

interface CardSkeletonProps {
  count?: number;
}

export default function CardSkeleton({ count = 4 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          sx={{
            border: '1px solid #D3CDBA',
            borderTop: '3px solid #D3CDBA',
            borderRadius: '4px',
            bgcolor: '#F5F2E8',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '14px' }}>
              <Skeleton variant="text" width={80} height={14} sx={{ bgcolor: 'rgba(211,205,186,0.6)' }} />
              <Skeleton variant="rounded" width={40} height={18} sx={{ bgcolor: 'rgba(211,205,186,0.6)', borderRadius: '10px' }} />
            </Box>
            <Skeleton variant="text" width={120} height={28} sx={{ bgcolor: 'rgba(211,205,186,0.6)', mb: '6px' }} />
            <Skeleton variant="text" width={90} height={12} sx={{ bgcolor: 'rgba(211,205,186,0.45)' }} />
          </CardContent>
        </Card>
      ))}
    </>
  );
}
