import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { ALL_ROLES, AppRoles, type AppRole } from '../../utils/constants';
import type { ApiError } from '../../types/common.types';
import {
  useCreateUserMutation,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from './usersApi';

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const { data: existingUser, isLoading: isLoadingUser } = useGetUserByIdQuery(id ?? '', {
    skip: !isEditMode,
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>(AppRoles.DataEntryOperator);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingUser) {
      setFullName(existingUser.fullName);
      setEmail(existingUser.email);
      setIsActive(existingUser.isActive);
      if (existingUser.roles[0]) {
        setRole(existingUser.roles[0]);
      }
    }
  }, [existingUser]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      if (isEditMode && id) {
        await updateUser({ id, body: { fullName, role, isActive } }).unwrap();
      } else {
        await createUser({ fullName, email, password, role }).unwrap();
      }
      navigate('/users');
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.title ?? 'Failed to save user.');
    }
  };

  if (isEditMode && isLoadingUser) {
    return <Loader />;
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>
        {isEditMode ? 'Edit User' : 'Add User'}
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              disabled={isEditMode}
            />

            {!isEditMode && (
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                helperText="Minimum 8 characters"
              />
            )}

            <FormControl fullWidth required>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as AppRole)}
              >
                {ALL_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {isEditMode && (
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label="Active"
              />
            )}

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/users')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {isEditMode ? 'Save Changes' : 'Create User'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
