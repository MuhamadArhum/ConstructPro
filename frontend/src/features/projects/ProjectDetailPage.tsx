import { useState, type FormEvent } from 'react';
import {
  Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputAdornment,
  InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import {
  useGetProjectQuery,
  useDeleteProjectMutation,
  useAddMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useAddProjectExpenseMutation,
  useDeleteProjectExpenseMutation,
  useAssignLabourMutation,
  useRemoveLabourMutation,
  useAssignMachineryMutation,
  useRemoveMachineryMutation,
} from './projectApi';
import { useGetLaboursQuery } from '../labour/labourApi';
import { useGetMachineriesQuery } from '../machinery/machineryApi';
import ProjectFormDialog from './ProjectFormDialog';
import { PROJECT_STATUS_COLORS } from '../../utils/statusColors';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');
const today = () => new Date().toISOString().split('T')[0];

const EXPENSE_CATEGORIES = ['Materials', 'Labour', 'Machinery', 'Transport', 'Utilities', 'Permits', 'Other'];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDescription, setMsDescription] = useState('');
  const [msDueDate, setMsDueDate] = useState(today());

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(today());
  const [expDescription, setExpDescription] = useState('');
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);

  const [labourOpen, setLabourOpen] = useState(false);
  const [selectedLabourId, setSelectedLabourId] = useState('');
  const [removeLabourId, setRemoveLabourId] = useState<string | null>(null);

  const [machineryOpen, setMachineryOpen] = useState(false);
  const [selectedMachineryId, setSelectedMachineryId] = useState('');
  const [removeMachineryId, setRemoveMachineryId] = useState<string | null>(null);

  const { data: project, isLoading } = useGetProjectQuery(id ?? '', { skip: !id });
  const { data: laboursData } = useGetLaboursQuery({ pageSize: 100 });
  const { data: machineriesData } = useGetMachineriesQuery({ pageSize: 100 });

  const [deleteProject] = useDeleteProjectMutation();
  const [addMilestone, { isLoading: addingMs }] = useAddMilestoneMutation();
  const [updateMilestone] = useUpdateMilestoneMutation();
  const [deleteMilestone] = useDeleteMilestoneMutation();
  const [addExpense, { isLoading: addingExp }] = useAddProjectExpenseMutation();
  const [deleteExpense] = useDeleteProjectExpenseMutation();
  const [assignLabour, { isLoading: assigningLabour }] = useAssignLabourMutation();
  const [removeLabour] = useRemoveLabourMutation();
  const [assignMachinery, { isLoading: assigningMachinery }] = useAssignMachineryMutation();
  const [removeMachinery] = useRemoveMachineryMutation();

  const handleDeleteProject = async () => {
    try {
      await deleteProject(id!).unwrap();
      dispatch(showSnackbar({ message: 'Project deleted', severity: 'success' }));
      navigate('/projects');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete project', severity: 'error' }));
    }
    setDeleteOpen(false);
  };

  const handleAddMilestone = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addMilestone({ id: id!, data: { title: msTitle, description: msDescription || undefined, dueDate: msDueDate } }).unwrap();
      dispatch(showSnackbar({ message: 'Milestone added', severity: 'success' }));
      setMilestoneOpen(false);
      setMsTitle(''); setMsDescription(''); setMsDueDate(today());
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add milestone', severity: 'error' }));
    }
  };

  const handleToggleMilestone = async (msId: string, current: boolean) => {
    try {
      await updateMilestone({ id: id!, mid: msId, data: { isCompleted: !current } }).unwrap();
      dispatch(showSnackbar({ message: 'Milestone updated', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to update milestone', severity: 'error' }));
    }
  };

  const handleDeleteMilestone = async (msId: string) => {
    try {
      await deleteMilestone({ id: id!, mid: msId }).unwrap();
      dispatch(showSnackbar({ message: 'Milestone deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete milestone', severity: 'error' }));
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addExpense({ id: id!, data: { category: expCategory, amount: parseFloat(expAmount), date: expDate, description: expDescription || undefined } }).unwrap();
      dispatch(showSnackbar({ message: 'Expense added', severity: 'success' }));
      setExpenseOpen(false);
      setExpCategory(EXPENSE_CATEGORIES[0]); setExpAmount(''); setExpDate(today()); setExpDescription('');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add expense', severity: 'error' }));
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpId) return;
    try {
      await deleteExpense({ id: id!, expId: deleteExpId }).unwrap();
      dispatch(showSnackbar({ message: 'Expense deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete expense', severity: 'error' }));
    }
    setDeleteExpId(null);
  };

  const handleAssignLabour = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await assignLabour({ id: id!, data: { labourId: selectedLabourId } }).unwrap();
      dispatch(showSnackbar({ message: 'Labour assigned', severity: 'success' }));
      setLabourOpen(false); setSelectedLabourId('');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to assign labour', severity: 'error' }));
    }
  };

  const handleRemoveLabour = async () => {
    if (!removeLabourId) return;
    try {
      await removeLabour({ id: id!, labourId: removeLabourId }).unwrap();
      dispatch(showSnackbar({ message: 'Labour removed', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to remove labour', severity: 'error' }));
    }
    setRemoveLabourId(null);
  };

  const handleAssignMachinery = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await assignMachinery({ id: id!, data: { machineryId: selectedMachineryId } }).unwrap();
      dispatch(showSnackbar({ message: 'Machinery assigned', severity: 'success' }));
      setMachineryOpen(false); setSelectedMachineryId('');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to assign machinery', severity: 'error' }));
    }
  };

  const handleRemoveMachinery = async () => {
    if (!removeMachineryId) return;
    try {
      await removeMachinery({ id: id!, machineryId: removeMachineryId }).unwrap();
      dispatch(showSnackbar({ message: 'Machinery removed', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to remove machinery', severity: 'error' }));
    }
    setRemoveMachineryId(null);
  };

  if (isLoading) return <Loader />;
  if (!project) return <Typography>Project not found</Typography>;

  const remaining = project.budget - project.spent;
  const totalExpenses = project.expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const laboursList = laboursData?.items ?? [];
  const machineriesList = machineriesData?.items ?? [];

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Projects', to: '/projects' }, { label: project.name }]} />
      <Stack direction="row" sx={{ alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Tooltip title="Back to Projects">
          <IconButton onClick={() => navigate('/projects')} aria-label="Back to Projects"><ArrowBackIcon /></IconButton>
        </Tooltip>
        <Typography variant="h1" sx={{ flex: 1 }}>{project.name}</Typography>
        <Chip label={project.status} color={PROJECT_STATUS_COLORS[project.status] ?? 'default'} />
        <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditOpen(true)}>Edit</Button>
        <Button startIcon={<DeleteIcon />} variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>Delete</Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Budget</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{fmt(project.budget)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Spent</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>{fmt(project.spent)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Remaining</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: remaining >= 0 ? 'success.main' : 'error.main' }}>{fmt(remaining)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Progress</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LinearProgress variant="determinate" value={project.progress} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{project.progress}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Overview" />
          <Tab label="Milestones" />
          <Tab label="Expenses" />
          <Tab label="Labour" />
          <Tab label="Machinery" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Client</Typography>
                    <Typography>{project.client ? (project.client.companyName ?? project.client.name) : '-'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Site Address</Typography>
                    <Typography>{project.siteAddress ?? '-'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Manager</Typography>
                    <Typography>{project.managerName ?? '-'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Start Date</Typography>
                    <Typography>{fmtDate(project.startDate)}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">End Date</Typography>
                    <Typography>{project.endDate ? fmtDate(project.endDate) : '-'}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{project.description ?? '-'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{project.notes ?? '-'}</Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setMilestoneOpen(true)}>
                  Add Milestone
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.milestones?.map((ms) => (
                      <TableRow key={ms.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{ms.title}</TableCell>
                        <TableCell>{ms.description ?? '-'}</TableCell>
                        <TableCell>{fmtDate(ms.dueDate)}</TableCell>
                        <TableCell>
                          <Chip
                            label={ms.isCompleted ? 'Completed' : 'Pending'}
                            color={ms.isCompleted ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={ms.isCompleted ? 'Mark Pending' : 'Mark Complete'}>
                            <IconButton size="small" onClick={() => handleToggleMilestone(ms.id, ms.isCompleted)}>
                              {ms.isCompleted ? <CheckCircleIcon fontSize="small" color="success" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteMilestone(ms.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!project.milestones?.length && (
                      <TableRow><TableCell colSpan={5}><EmptyState message="No milestones yet" actionLabel="Add Milestone" onAction={() => setMilestoneOpen(true)} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {tab === 2 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2">Total: <strong>{fmt(totalExpenses)}</strong></Typography>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setExpenseOpen(true)}>
                  Add Expense
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.expenses?.map((exp) => (
                      <TableRow key={exp.id} hover>
                        <TableCell>{fmtDate(exp.date)}</TableCell>
                        <TableCell>{exp.category}</TableCell>
                        <TableCell>{exp.description ?? '-'}</TableCell>
                        <TableCell align="right">{fmt(exp.amount)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteExpId(exp.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!project.expenses?.length && (
                      <TableRow><TableCell colSpan={5}><EmptyState message="No expenses yet" actionLabel="Add Expense" onAction={() => setExpenseOpen(true)} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {tab === 3 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setLabourOpen(true)}>
                  Assign Labour
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Trade</TableCell>
                      <TableCell align="right">Daily Wage</TableCell>
                      <TableCell>Assigned Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.labours?.map((pl) => (
                      <TableRow key={pl.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{pl.labour.name}</TableCell>
                        <TableCell>{pl.labour.trade ?? '-'}</TableCell>
                        <TableCell align="right">{fmt(pl.labour.dailyWage)}</TableCell>
                        <TableCell>{fmtDate(pl.assignedAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => setRemoveLabourId(pl.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!project.labours?.length && (
                      <TableRow><TableCell colSpan={5}><EmptyState message="No labour assigned yet" actionLabel="Assign Labour" onAction={() => setLabourOpen(true)} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {tab === 4 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setMachineryOpen(true)}>
                  Assign Machinery
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assigned Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.machinery?.map((pm) => (
                      <TableRow key={pm.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{pm.machinery.name}</TableCell>
                        <TableCell>{pm.machinery.model ?? '-'}</TableCell>
                        <TableCell>{pm.machinery.status}</TableCell>
                        <TableCell>{fmtDate(pm.assignedAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => setRemoveMachineryId(pm.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!project.machinery?.length && (
                      <TableRow><TableCell colSpan={5}><EmptyState message="No machinery assigned yet" actionLabel="Assign Machinery" onAction={() => setMachineryOpen(true)} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Paper>

      <ProjectFormDialog open={editOpen} onClose={() => setEditOpen(false)} projectId={id} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteOpen(false)}
      />

      <Dialog open={milestoneOpen} onClose={() => setMilestoneOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddMilestone}>
          <DialogTitle>Add Milestone</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Title" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} required fullWidth />
              <TextField label="Description" value={msDescription} onChange={(e) => setMsDescription(e.target.value)} fullWidth multiline rows={2} />
              <TextField
                label="Due Date"
                type="date"
                value={msDueDate}
                onChange={(e) => setMsDueDate(e.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMilestoneOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingMs}>
              {addingMs ? <CircularProgress size={20} /> : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={expenseOpen} onClose={() => setExpenseOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAddExpense}>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
                  {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Amount"
                type="number"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                required
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
              />
              <TextField
                label="Date"
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField label="Description" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} fullWidth multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExpenseOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingExp}>
              {addingExp ? <CircularProgress size={20} /> : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={labourOpen} onClose={() => setLabourOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAssignLabour}>
          <DialogTitle>Assign Labour</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Labour</InputLabel>
                <Select label="Labour" value={selectedLabourId} onChange={(e) => setSelectedLabourId(e.target.value)} required>
                  {laboursList.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.name}{l.trade ? ` — ${l.trade}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLabourOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assigningLabour || !selectedLabourId}>
              {assigningLabour ? <CircularProgress size={20} /> : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={machineryOpen} onClose={() => setMachineryOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAssignMachinery}>
          <DialogTitle>Assign Machinery</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Machinery</InputLabel>
                <Select label="Machinery" value={selectedMachineryId} onChange={(e) => setSelectedMachineryId(e.target.value)} required>
                  {machineriesList.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}{(m as any).model ? ` — ${(m as any).model}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMachineryOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assigningMachinery || !selectedMachineryId}>
              {assigningMachinery ? <CircularProgress size={20} /> : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteExpId)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeleteExpId(null)}
      />

      <ConfirmDialog
        open={Boolean(removeLabourId)}
        title="Remove Labour"
        message="Are you sure you want to remove this labour from the project?"
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveLabour}
        onCancel={() => setRemoveLabourId(null)}
      />

      <ConfirmDialog
        open={Boolean(removeMachineryId)}
        title="Remove Machinery"
        message="Are you sure you want to remove this machinery from the project?"
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveMachinery}
        onCancel={() => setRemoveMachineryId(null)}
      />
    </Box>
  );
}
