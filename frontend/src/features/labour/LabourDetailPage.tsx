import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import PermissionGate from '../../components/common/PermissionGate';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Perms } from '../../utils/permissions';
import {
  useGetLabourByIdQuery,
  useGetLabourLedgerQuery,
  useGetLabourAdvancesQuery,
  useGetLabourProjectsQuery,
  useAssignLabourToProjectMutation,
  useRemoveLabourProjectMutation,
} from './labourApi';
import { useGetProjectsQuery } from '../projects/projectApi';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

const now = new Date();

export default function LabourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: labour, isLoading } = useGetLabourByIdQuery(id ?? '', { skip: !id });
  const { data: ledger } = useGetLabourLedgerQuery(
    { id: id!, month, year },
    { skip: !id }
  );
  const { data: advances } = useGetLabourAdvancesQuery(id ?? '', { skip: !id });
  const { data: projects } = useGetLabourProjectsQuery(id ?? '', { skip: !id });
  const { data: allProjects } = useGetProjectsQuery({ pageSize: 1000 });

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [removeProjectId, setRemoveProjectId] = useState<string | null>(null);

  const [assignLabour] = useAssignLabourToProjectMutation();
  const [removeLabour] = useRemoveLabourProjectMutation();

  const handleAssign = async () => {
    if (!id || !selectedProjectId) return;
    try {
      await assignLabour({ id, data: { projectId: selectedProjectId } }).unwrap();
      dispatch(showSnackbar({ message: 'Labour assigned to project', severity: 'success' }));
      setAssignOpen(false);
      setSelectedProjectId('');
    } catch (err: any) {
      const msg = err?.data?.message ?? 'Failed to assign labour';
      dispatch(showSnackbar({ message: msg, severity: 'error' }));
    }
  };

  const handleRemove = async () => {
    if (!id || !removeProjectId) return;
    try {
      await removeLabour({ labourId: id, projectId: removeProjectId }).unwrap();
      dispatch(showSnackbar({ message: 'Assignment removed', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to remove assignment', severity: 'error' }));
    } finally {
      setRemoveProjectId(null);
    }
  };

  if (isLoading || !labour) return <Loader />;

  const recentAdvances = (advances ?? []).slice(0, 5);
  const assignedProjectIds = new Set((projects ?? []).map((p) => p.projectId));
  const availableProjects = (allProjects?.data ?? []).filter((p) => !assignedProjectIds.has(p.id));

  return (
    <Box>
      <AppBreadcrumbs
        crumbs={[
          { label: 'Labour', to: '/labour' },
          { label: labour.name },
        ]}
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{labour.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {labour.code ? `${labour.code} · ` : ''}{labour.trade ?? 'Labour'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <PermissionGate permission={Perms.Labour.Edit}>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/labour/${id}/edit`)}>
              Edit
            </Button>
          </PermissionGate>
          <Button variant="outlined" startIcon={<EventNoteIcon />} onClick={() => navigate(`/labour/${id}/attendance`)}>
            Attendance
          </Button>
          <Button variant="outlined" startIcon={<MonetizationOnIcon />} onClick={() => navigate(`/labour/${id}/payroll`)}>
            Payroll
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Profile</Typography>
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={labour.isActive ? 'Active' : 'Inactive'}
                  color={labour.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Stack>
              <Divider />
              {[
                { label: 'Code', value: labour.code ?? '—' },
                { label: 'Trade', value: labour.trade ?? '—' },
                { label: 'Phone', value: labour.phoneNumber ?? '—' },
                { label: 'CNIC', value: labour.cnic ?? '—' },
                { label: 'Address', value: labour.address ?? '—' },
                { label: 'Daily Wage', value: fmt(labour.dailyWage) },
                { label: 'OT Rate/hr', value: fmt(labour.overtimeRatePerHour) },
                { label: 'Join Date', value: new Date(labour.joinDate).toLocaleDateString() },
              ].map(({ label, value }) => (
                <Stack key={label} direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Current Month Summary */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Current Month Summary ({new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })})
            </Typography>
            {ledger ? (
              <Grid container spacing={2}>
                {[
                  { label: 'Present Days', value: ledger.summary.presentDays, color: '#1976d2' },
                  { label: 'Wages Earned', value: fmt(ledger.summary.wagesEarned), color: '#2e7d32' },
                  { label: 'OT Pay', value: fmt(ledger.summary.overtimePay), color: '#ed6c02' },
                  { label: 'Advances', value: fmt(ledger.summary.totalAdvances), color: '#d32f2f' },
                  { label: 'Net Payable', value: fmt(ledger.summary.netPayable), color: '#1a3c5e' },
                ].map(({ label, value, color }) => (
                  <Grid size={{ xs: 6, sm: 4 }} key={label}>
                    <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color }}>{value}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary">No attendance data for this month.</Typography>
            )}
          </Paper>

          {/* Recent Advances */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Advances (Last 5)</Typography>
            {recentAdvances.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentAdvances.map((adv) => (
                      <TableRow key={adv.id} hover>
                        <TableCell>{new Date(adv.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>
                          {fmt(adv.amount)}
                        </TableCell>
                        <TableCell>{adv.reason ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No advances recorded.</Typography>
            )}
          </Paper>
        </Grid>

        {/* Project Assignments */}
        <Grid size={{ xs: 12 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Project Assignments</Typography>
              <PermissionGate permission={Perms.Labour.Edit}>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setAssignOpen(true)}>
                  Assign to Project
                </Button>
              </PermissionGate>
            </Stack>
            {(projects ?? []).length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project Code</TableCell>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assigned At</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(projects ?? []).map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{p.projectCode ?? '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{p.projectName}</TableCell>
                        <TableCell>
                          <Chip label={p.projectStatus} size="small" />
                        </TableCell>
                        <TableCell>{new Date(p.assignedAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <PermissionGate permission={Perms.Labour.Edit}>
                            <Tooltip title="Remove Assignment">
                              <IconButton size="small" color="error" onClick={() => setRemoveProjectId(p.projectId)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </PermissionGate>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">Not assigned to any projects.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Assign to Project Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign to Project</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Project</InputLabel>
              <Select
                label="Project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {availableProjects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.code ? `${p.code} — ` : ''}{p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!selectedProjectId}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removeProjectId)}
        title="Remove Assignment"
        message="Are you sure you want to remove this labour from the project?"
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
        onCancel={() => setRemoveProjectId(null)}
      />
    </Box>
  );
}
