import { Skeleton, TableCell, TableRow } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  cols: number;
}

export default function TableSkeleton({ rows = 6, cols }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c} sx={{ py: '14px' }}>
              <Skeleton
                variant="text"
                sx={{
                  bgcolor: 'rgba(211,205,186,0.45)',
                  borderRadius: '3px',
                  height: c === 0 ? 18 : 14,
                  width: c === 0 ? '70%' : `${50 + Math.sin(r * cols + c) * 30}%`,
                }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
