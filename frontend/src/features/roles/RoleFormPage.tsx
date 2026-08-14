import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Alert, Box, Button, Checkbox, CircularProgress, Divider,
  FormControlLabel, Paper, Stack, TextField, Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import {
  useAssignPermissionsMutation, useCreateRoleMutation,
  useGetAllPermissionsQuery, useGetRoleByIdQuery,
} from './rolesApi';
import type { PermissionDto } from '../../types/role.types';
import type { ApiError } from '../../types/common.types';

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: allPermissions, isLoading: loadingPerms } = useGetAllPermissionsQuery();
  const { data: existingRole, isLoading: loadingRole } = useGetRoleByIdQuery(id!, { skip: !isEdit });

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [assignPermissions, { isLoading: isAssigning }] = useAssignPermissionsMutation();

  const [name, setName] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingRole) {
      setName(existingRole.name);
      setSelectedCodes(new Set(existingRole.permissionCodes));
    }
  }, [existingRole]);

  const grouped = useMemo(() => {
    if (!allPermissions) return {} as Record<string, PermissionDto[]>;
    return allPermissions.reduce<Record<string, PermissionDto[]>>((acc, perm) => {
      (acc[perm.module] ??= []).push(perm);
      return acc;
    }, {});
  }, [allPermissions]);

  const togglePermission = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleModule = (module: string) => {
    const codes = grouped[module].map((p) => p.code);
    const allSelected = codes.every((c) => selectedCodes.has(c));
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (allSelected) codes.forEach((c) => next.delete(c));
      else codes.forEach((c) => next.add(c));
      return next;
    });
  };

  const getModuleState = (module: string) => {
    const codes = grouped[module].map((p) => p.code);
    const count = codes.filter((c) => selectedCodes.has(c)).length;
    return { checked: count === codes.length, indeterminate: count > 0 && count < codes.length };
  };

  const isSaving = isCreating || isAssigning;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let roleId = id!;
      if (!isEdit) {
        const created = await createRole({ name }).unwrap();
        roleId = created.id;
      }
      await assignPermissions({
        roleId,
        body: { permissionCodes: Array.from(selectedCodes) },
      }).unwrap();
      dispatch(showSnackbar({
        message: isEdit ? 'Role updated successfully.' : 'Role created successfully.',
        severity: 'success',
      }));
      navigate('/roles');
    } catch (err) {
      const apiError = err as { data?: ApiError };
      setError(apiError.data?.title ?? 'Failed to save role.');
    }
  };

  if (loadingPerms || loadingRole) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isSystemRole = existingRole?.isSystemRole ?? false;

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>
        {isEdit ? 'Edit Role' : 'New Role'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Role Details</Typography>
            <TextField
              label="Role Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              disabled={isSystemRole}
              helperText={isSystemRole ? 'System role names cannot be changed.' : ''}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>Permissions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select what this role is allowed to do.
            </Typography>
            <Stack spacing={1.5} divider={<Divider />}>
              {Object.entries(grouped).map(([module, perms]) => {
                const { checked, indeterminate } = getModuleState(module);
                return (
                  <Box key={module}>
                    <FormControlLabel
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {module}
                        </Typography>
                      }
                      control={
                        <Checkbox
                          checked={checked}
                          indeterminate={indeterminate}
                          onChange={() => toggleModule(module)}
                          size="small"
                        />
                      }
                    />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', pl: 3.5 }}>
                      {perms.map((perm) => (
                        <FormControlLabel
                          key={perm.code}
                          label={<Typography variant="body2">{perm.action}</Typography>}
                          control={
                            <Checkbox
                              checked={selectedCodes.has(perm.code)}
                              onChange={() => togglePermission(perm.code)}
                              size="small"
                            />
                          }
                          sx={{ width: 160 }}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => navigate('/roles')} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving} sx={{ minWidth: 140 }}>
              {isSaving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Role'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
}
