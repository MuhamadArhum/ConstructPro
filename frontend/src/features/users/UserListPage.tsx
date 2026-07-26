import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/BlockOutlined';
import KeyIcon from '@mui/icons-material/KeyOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, InputAdornment, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGate from '../../components/common/PermissionGate';
import { useAdminResetPasswordMutation, useDeactivateUserMutation, useGetUsersQuery } from './usersApi';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { Perms } from '../../utils/permissions';
import { API_BASE_URL } from '../../utils/constants';
import type { ApiError } from '../../types/common.types';

export default function UserListPage() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useGetUsersQuery({
    pageNumber: 1,
    pageSize: 50,
    search: search || undefined,
  });
  const [deactivateUser] = useDeactivateUserMutation();
  const [adminResetPassword, { isLoading: isResettingPw }] = useAdminResetPasswordMutation();

  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  const handleConfirmDeactivate = async () => {
    if (!pendingDeactivateId) return;
    try {
      await deactivateUser(pendingDeactivateId).unwrap();
      dispatch(showSnackbar({ message: 'User deactivated successfully.', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to deactivate user.', severity: 'error' }));
    } finally {
      setPendingDeactivateId(null);
    }
  };

  const openResetDialog = (userId: string) => {
    setResetPwUserId(userId);
    setNewPassword('');
    setPwError(null);
  };

  const handleResetPassword = async () => {
    if (!resetPwUserId) return;
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    try {
      await adminResetPassword({ id: resetPwUserId, body: { newPassword } }).unwrap();
      dispatch(showSnackbar({ message: 'Password reset successfully.', severity: 'success' }));
      setResetPwUserId(null);
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setPwError(apiError.data?.title ?? 'Failed to reset password.');
    }
  };

  const getAvatarSrc = (path: string | null | undefined) =>
    path ? `${API_BASE_URL.replace('/api', '')}${path}` : undefined;

  const getInitials = (name: string) =>
    name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">User Management</Typography>
        <PermissionGate permission={Perms.Users.Create}>
          <Button component={RouterLink} to="/users/new" variant="contained" startIcon={<AddIcon />}>
            Add User
          </Button>
        </PermissionGate>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {isLoading && <Loader />}
      {isError && <Alert severity="error">Failed to load users.</Alert>}

      {data && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={getAvatarSrc(user.profilePicturePath)}
                        sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}
                      >
                        {getInitials(user.fullName)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.fullName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                      {user.roles.map((role) => (
                        <Chip key={role} label={role} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <PermissionGate permission={Perms.Users.Edit}>
                      <Tooltip title="Edit user">
                        <IconButton
                          component={RouterLink}
                          to={`/users/${user.id}/edit`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset password">
                        <IconButton size="small" onClick={() => openResetDialog(user.id)}>
                          <KeyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </PermissionGate>
                    <PermissionGate permission={Perms.Users.Delete}>
                      <Tooltip title={user.isActive ? 'Deactivate user' : 'Already inactive'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={!user.isActive}
                            onClick={() => setPendingDeactivateId(user.id)}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {search ? 'No users match your search.' : 'No users found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeactivateId)}
        title="Deactivate user"
        message="This user will no longer be able to sign in. You can re-activate them later by editing their profile."
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setPendingDeactivateId(null)}
      />

      <Dialog
        open={Boolean(resetPwUserId)}
        onClose={() => setResetPwUserId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {pwError && <Alert severity="error" sx={{ borderRadius: 2 }}>{pwError}</Alert>}
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              autoFocus
              helperText="Minimum 8 characters"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetPwUserId(null)} disabled={isResettingPw}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={isResettingPw}>
            {isResettingPw ? 'Resetting…' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
