import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ShieldIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import {
  Alert, Avatar, Box, Button, Chip, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tooltip, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGate from '../../components/common/PermissionGate';
import { useDeleteRoleMutation, useGetRolesQuery } from './rolesApi';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { Perms } from '../../utils/permissions';

export default function RoleListPage() {
  const { data: roles, isLoading, isError } = useGetRolesQuery();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const dispatch = useAppDispatch();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const pendingRole = roles?.find((r) => r.id === pendingDeleteId);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteRole(pendingDeleteId).unwrap();
      dispatch(showSnackbar({ message: 'Role deleted successfully.', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete role.', severity: 'error' }));
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">Role Management</Typography>
        <PermissionGate permission={Perms.Roles.Create}>
          <Button
            component={RouterLink} to="/roles/new"
            variant="contained" startIcon={<AddIcon />}
          >
            New Role
          </Button>
        </PermissionGate>
      </Box>

      {isLoading && <Loader />}
      {isError && <Alert severity="error">Failed to load roles.</Alert>}

      {roles && (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                        <ShieldIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {role.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${role.permissionCodes.length} permission${role.permissionCodes.length !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={role.isSystemRole ? 'System' : 'Custom'}
                      color={role.isSystemRole ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <PermissionGate permission={Perms.Roles.Edit}>
                      <Tooltip title="Edit permissions">
                        <IconButton
                          component={RouterLink}
                          to={`/roles/${role.id}/edit`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </PermissionGate>
                    <PermissionGate permission={Perms.Roles.Delete}>
                      <Tooltip title={role.isSystemRole ? 'System roles cannot be deleted' : 'Delete role'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={role.isSystemRole || isDeleting}
                            onClick={() => setPendingDeleteId(role.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </PermissionGate>
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No roles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete role"
        message={`"${pendingRole?.name ?? 'This role'}" will be permanently deleted. Users assigned this role will lose associated permissions.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </>
  );
}
