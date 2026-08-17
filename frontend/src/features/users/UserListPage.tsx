import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/BlockOutlined';
import KeyIcon from '@mui/icons-material/KeyOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpenOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, InputAdornment, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGate from '../../components/common/PermissionGate';
import { useAdminResetPasswordMutation, useDeactivateUserMutation, useGetUsersQuery, useUnlockAccountMutation } from './usersApi';
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
  const [unlockAccount] = useUnlockAccountMutation();

  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const [resetPwUserId, setResetPwUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUnlock = async (userId: string) => {
    try {
      await unlockAccount(userId).unwrap();
      dispatch(showSnackbar({ message: 'Account unlocked successfully.', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to unlock account.', severity: 'error' }));
    }
  };

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

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(pass);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openResetDialog = (userId: string) => {
    setResetPwUserId(userId);
    setNewPassword('');
    setPwError(null);
    setResetSuccess(null);
    setCopied(false);
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
      setResetSuccess(newPassword);
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
          sx={{ width: { xs: '100%', sm: 300 } }}
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
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                      {user.isLockedOut && (
                        <Chip label="Locked" color="error" size="small" />
                      )}
                    </Stack>
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
                      {user.isLockedOut && (
                        <Tooltip title="Unlock account">
                          <IconButton size="small" color="warning" onClick={() => handleUnlock(user.id)}>
                            <LockOpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
        onClose={() => { if (!resetSuccess) setResetPwUserId(null); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {pwError && <Alert severity="error" sx={{ borderRadius: 2 }}>{pwError}</Alert>}
            {resetSuccess ? (
              <>
                <Alert severity="success">Password reset successfully. Share this password with the user securely.</Alert>
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>
                    {resetSuccess}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                    <IconButton size="small" onClick={handleCopy}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Paper>
              </>
            ) : (
              <>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <TextField
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    autoFocus
                    helperText="Minimum 8 characters"
                  />
                  <Tooltip title="Generate random password">
                    <IconButton onClick={generateTempPassword} sx={{ mt: 1 }}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResetPwUserId(null)}>
            {resetSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!resetSuccess && (
            <Button variant="contained" onClick={handleResetPassword} disabled={isResettingPw}>
              {isResettingPw ? 'Resetting…' : 'Reset Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
