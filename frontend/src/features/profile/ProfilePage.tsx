import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Avatar, Box, Button, Chip, CircularProgress, Divider,
  IconButton, Paper, Stack, TextField, Typography,
} from '@mui/material';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { updateUser } from '../auth/authSlice';
import { showSnackbar } from '../../app/snackbarSlice';
import { useGetProfileQuery, useUpdateProfileMutation, useUploadProfilePictureMutation } from './profileApi';
import { useChangePasswordMutation } from '../auth/authApi';
import type { ApiError } from '../../types/common.types';

export default function ProfilePage() {
  const user = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [uploadPicture, { isLoading: isUploading }] = useUploadProfilePictureMutation();
  const [changePassword, { isLoading: isChangingPw }] = useChangePasswordMutation();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setPhoneNumber(profile.phoneNumber ?? '');
    }
  }, [profile]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateProfile({ fullName, phoneNumber: phoneNumber || undefined }).unwrap();
      dispatch(updateUser({ fullName: updated.fullName }));
      dispatch(showSnackbar({ message: 'Profile updated successfully.' }));
    } catch (err) {
      const apiError = err as { data?: ApiError };
      dispatch(showSnackbar({ message: apiError.data?.title ?? 'Failed to update profile.', severity: 'error' }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { profilePicturePath } = await uploadPicture(fd as unknown as FormData).unwrap();
      dispatch(updateUser({ profilePicturePath }));
      dispatch(showSnackbar({ message: 'Profile picture updated.' }));
    } catch (err) {
      const apiError = err as { data?: ApiError };
      dispatch(showSnackbar({ message: apiError.data?.title ?? 'Upload failed.', severity: 'error' }));
    }
    e.target.value = '';
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      dispatch(showSnackbar({ message: 'Passwords do not match.', severity: 'error' }));
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      dispatch(showSnackbar({ message: 'Password changed successfully.' }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const apiError = err as { data?: ApiError };
      dispatch(showSnackbar({ message: apiError.data?.detail ?? apiError.data?.title ?? 'Failed to change password.', severity: 'error' }));
    }
  };

  const initials = user?.fullName
    ?.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 680 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>My Profile</Typography>

      {/* Avatar card */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.profilePicturePath ?? undefined}
              sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '1.5rem' }}
            >
              {!user?.profilePicturePath && initials}
            </Avatar>
            <IconButton
              size="small"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              sx={{
                position: 'absolute', bottom: -4, right: -4,
                bgcolor: 'background.paper',
                border: '2px solid', borderColor: 'divider',
                width: 28, height: 28,
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              {isUploading
                ? <CircularProgress size={14} />
                : <CameraAltOutlinedIcon sx={{ fontSize: 14 }} />}
            </IconButton>
            <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{user?.fullName}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {user?.roles.map(r => <Chip key={r} label={r} size="small" />)}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Personal info */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Personal Information</Typography>
        <form onSubmit={handleProfileSave}>
          <Stack spacing={2.5}>
            <TextField
              label="Full Name" value={fullName}
              onChange={e => setFullName(e.target.value)}
              required fullWidth
            />
            <TextField label="Email Address" value={profile?.email ?? ''} fullWidth disabled />
            <TextField
              label="Phone Number" value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              fullWidth placeholder="+1 234 567 890"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={isSaving} sx={{ minWidth: 140 }}>
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* Change password */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Change Password</Typography>
        <form onSubmit={handlePasswordChange}>
          <Stack spacing={2.5}>
            <TextField
              label="Current Password" type="password"
              value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              required fullWidth autoComplete="current-password"
            />
            <Divider />
            <TextField
              label="New Password" type="password"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              required fullWidth autoComplete="new-password"
              helperText="Minimum 8 characters"
            />
            <TextField
              label="Confirm New Password" type="password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              required fullWidth
              error={confirmPassword.length > 0 && newPassword !== confirmPassword}
              helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={isChangingPw} sx={{ minWidth: 160 }}>
                {isChangingPw ? 'Changing…' : 'Change Password'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
