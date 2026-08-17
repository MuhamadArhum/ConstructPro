import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import { useState } from 'react';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useGetNotificationsQuery, useMarkAllAsReadMutation, useMarkAsReadMutation, useGenerateNotificationsMutation } from './notificationApi';
import type { NotificationType } from '../../types/notification.types';
import TableSkeleton from '../../components/common/TableSkeleton';

const typeColors: Record<NotificationType, 'error' | 'warning' | 'info' | 'success' | 'default'> = { System: 'default', Alert: 'info', Info: 'success', Warning: 'warning' };

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const { data, isLoading } = useGetNotificationsQuery({ pageNumber: page + 1, pageSize: rowsPerPage });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: markingAll }] = useMarkAllAsReadMutation();
  const [generate, { isLoading: generating }] = useGenerateNotificationsMutation();

  const handleMarkAsRead = async (id: string) => {
    try { await markAsRead(id).unwrap(); }
    catch { dispatch(showSnackbar({ message: 'Failed to mark as read', severity: 'error' })); }
  };

  const handleMarkAllAsRead = async () => {
    try { await markAllAsRead().unwrap(); dispatch(showSnackbar({ message: 'All marked as read', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed', severity: 'error' })); }
  };

  const handleGenerate = async () => {
    try { await generate().unwrap(); dispatch(showSnackbar({ message: 'Notifications generated', severity: 'success' })); }
    catch { dispatch(showSnackbar({ message: 'Failed to generate', severity: 'error' })); }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Notifications</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleGenerate} disabled={generating}>Generate Alerts</Button>
          <Button variant="contained" onClick={handleMarkAllAsRead} disabled={markingAll}>Mark All as Read</Button>
        </Stack>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? <TableSkeleton cols={6} /> : (
              <>
                {data?.items.map((row) => (
                  <TableRow key={row.id} hover sx={{ opacity: row.isRead ? 0.6 : 1, fontWeight: row.isRead ? 'normal' : 'bold' }}>
                    <TableCell><Chip label={row.typeDisplay} color={typeColors[row.type]} size="small" /></TableCell>
                    <TableCell sx={{ fontWeight: row.isRead ? 400 : 700 }}>{row.title}</TableCell>
                    <TableCell>{row.message}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell><Chip label={row.isRead ? 'Read' : 'Unread'} color={row.isRead ? 'default' : 'primary'} size="small" /></TableCell>
                    <TableCell align="right">
                      {!row.isRead && <Button size="small" onClick={() => handleMarkAsRead(row.id)}>Mark Read</Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {!data?.items.length && <TableRow><TableCell colSpan={6} align="center">No notifications</TableCell></TableRow>}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data?.totalCount ?? 0} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>
    </Box>
  );
}
