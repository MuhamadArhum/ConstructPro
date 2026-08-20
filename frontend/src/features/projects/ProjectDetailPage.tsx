import { useState, type FormEvent } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PaymentIcon from '@mui/icons-material/Payment';
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
  useUpdateProjectExpenseMutation,
  useDeleteProjectExpenseMutation,
  useAssignLabourMutation,
  useRemoveLabourMutation,
  useAssignMachineryMutation,
  useRemoveMachineryMutation,
  useAssignEmployeeMutation,
  useRemoveEmployeeMutation,
  useGetProjectPayrollQuery,
} from './projectApi';
import {
  useProcessSalaryMutation,
  useMarkSalaryAsPaidMutation,
  useDeleteSalaryMutation,
} from '../employees/employeesApi';
import { useGetLaboursQuery } from '../labour/labourApi';
import { useGetMachineriesQuery } from '../machinery/machineryApi';
import { useGetEmployeesQuery } from '../employees/employeesApi';
import { useGetInvoicesQuery } from '../invoices/invoiceApi';
import { useGetPurchaseOrdersQuery } from '../purchase-orders/purchaseOrderApi';
import ProjectFormDialog from './ProjectFormDialog';
import { PROJECT_STATUS_COLORS } from '../../utils/statusColors';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');
const today = () => new Date().toISOString().split('T')[0];
const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

const EXPENSE_CATEGORIES = ['Materials', 'Labour', 'Employee', 'Machinery', 'Transport', 'Utilities', 'Permits', 'Other'];

const INV_STATUS_COLOR = (s: string): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  if (s === 'Sent') return 'info';
  if (s === 'Paid') return 'success';
  if (s === 'Overdue') return 'error';
  if (s === 'Cancelled') return 'default';
  return 'warning';
};

const PO_STATUS_COLOR = (s: string): 'default' | 'info' | 'success' | 'error' | 'warning' => {
  if (s === 'Sent') return 'info';
  if (s === 'Received') return 'success';
  if (s === 'Cancelled') return 'default';
  return 'warning';
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Milestone state
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [editMilestoneId, setEditMilestoneId] = useState<string | null>(null);
  const [msTitle, setMsTitle] = useState('');
  const [msDescription, setMsDescription] = useState('');
  const [msDueDate, setMsDueDate] = useState(today());

  // Expense state
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(today());
  const [expDescription, setExpDescription] = useState('');
  const [deleteExpId, setDeleteExpId] = useState<string | null>(null);

  // Labour state
  const [labourOpen, setLabourOpen] = useState(false);
  const [selectedLabourId, setSelectedLabourId] = useState('');
  const [removeLabourId, setRemoveLabourId] = useState<string | null>(null);

  // Machinery state
  const [machineryOpen, setMachineryOpen] = useState(false);
  const [selectedMachineryId, setSelectedMachineryId] = useState('');
  const [removeMachineryId, setRemoveMachineryId] = useState<string | null>(null);

  // Employee state
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [removeEmployeeId, setRemoveEmployeeId] = useState<string | null>(null);

  // Payroll state
  const now = new Date();
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [genSalaryEmp, setGenSalaryEmp] = useState<{ employeeId: string; fullName: string; basicSalary: number } | null>(null);
  const [genBonus, setGenBonus] = useState('0');
  const [genDeductions, setGenDeductions] = useState('0');
  const [genDaysPresent, setGenDaysPresent] = useState('26');
  const [genTotalDays, setGenTotalDays] = useState('30');
  const [genRemarks, setGenRemarks] = useState('');
  const [payDialogSalary, setPayDialogSalary] = useState<{ employeeId: string; salaryId: string } | null>(null);
  const [paidDate, setPaidDate] = useState(today());
  const [deleteSalaryInfo, setDeleteSalaryInfo] = useState<{ employeeId: string; salaryId: string } | null>(null);

  const { data: project, isLoading } = useGetProjectQuery(id ?? '', { skip: !id });
  const { data: laboursData } = useGetLaboursQuery({ pageSize: 1000 });
  const { data: machineriesData } = useGetMachineriesQuery({ pageSize: 1000 });
  const { data: employeesData } = useGetEmployeesQuery({ pageSize: 1000, isActive: true });
  const { data: invoicesData } = useGetInvoicesQuery(
    { projectId: id, pageSize: 100 },
    { skip: !id || tab !== 6 },
  );
  const { data: posData } = useGetPurchaseOrdersQuery(
    { projectId: id, pageSize: 100 },
    { skip: !id || tab !== 7 },
  );
  const { data: payrollData, refetch: refetchPayroll } = useGetProjectPayrollQuery(
    { id: id ?? '', month: payrollMonth, year: payrollYear },
    { skip: !id || tab !== 8 },
  );
  const [processSalary, { isLoading: generatingSalary }] = useProcessSalaryMutation();
  const [markSalaryAsPaid, { isLoading: payingSalary }] = useMarkSalaryAsPaidMutation();
  const [deleteSalary] = useDeleteSalaryMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [addMilestone, { isLoading: addingMs }] = useAddMilestoneMutation();
  const [updateMilestone] = useUpdateMilestoneMutation();
  const [deleteMilestone] = useDeleteMilestoneMutation();
  const [addExpense, { isLoading: addingExp }] = useAddProjectExpenseMutation();
  const [updateExpense, { isLoading: updatingExp }] = useUpdateProjectExpenseMutation();
  const [deleteExpense] = useDeleteProjectExpenseMutation();
  const [assignLabour, { isLoading: assigningLabour }] = useAssignLabourMutation();
  const [removeLabour] = useRemoveLabourMutation();
  const [assignMachinery, { isLoading: assigningMachinery }] = useAssignMachineryMutation();
  const [removeMachinery] = useRemoveMachineryMutation();
  const [assignEmployee, { isLoading: assigningEmployee }] = useAssignEmployeeMutation();
  const [removeEmployee] = useRemoveEmployeeMutation();

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

  const openAddMilestone = () => {
    setEditMilestoneId(null);
    setMsTitle(''); setMsDescription(''); setMsDueDate(today());
    setMilestoneOpen(true);
  };

  const openEditMilestone = (ms: { id: string; title: string; description?: string | null; dueDate: string }) => {
    setEditMilestoneId(ms.id);
    setMsTitle(ms.title);
    setMsDescription(ms.description ?? '');
    setMsDueDate(ms.dueDate.split('T')[0]);
    setMilestoneOpen(true);
  };

  const handleSaveMilestone = async (e: FormEvent) => {
    e.preventDefault();
    const data = { title: msTitle, description: msDescription || undefined, dueDate: msDueDate };
    try {
      if (editMilestoneId) {
        await updateMilestone({ id: id!, mid: editMilestoneId, data }).unwrap();
        dispatch(showSnackbar({ message: 'Milestone updated', severity: 'success' }));
      } else {
        await addMilestone({ id: id!, data }).unwrap();
        dispatch(showSnackbar({ message: 'Milestone added', severity: 'success' }));
      }
      setMilestoneOpen(false);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save milestone', severity: 'error' }));
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

  const openAddExpense = () => {
    setEditExpenseId(null);
    setExpCategory(EXPENSE_CATEGORIES[0]);
    setExpAmount('');
    setExpDate(today());
    setExpDescription('');
    setExpenseOpen(true);
  };

  const openEditExpense = (exp: { id: string; category: string; amount: number; date: string; description?: string | null }) => {
    setEditExpenseId(exp.id);
    setExpCategory(exp.category);
    setExpAmount(String(exp.amount));
    setExpDate(exp.date.split('T')[0]);
    setExpDescription(exp.description ?? '');
    setExpenseOpen(true);
  };

  const handleSaveExpense = async (e: FormEvent) => {
    e.preventDefault();
    const data = { category: expCategory, amount: parseFloat(expAmount), date: expDate, description: expDescription || undefined };
    try {
      if (editExpenseId) {
        await updateExpense({ id: id!, expId: editExpenseId, data }).unwrap();
        dispatch(showSnackbar({ message: 'Expense updated', severity: 'success' }));
      } else {
        await addExpense({ id: id!, data }).unwrap();
        dispatch(showSnackbar({ message: 'Expense added', severity: 'success' }));
      }
      setExpenseOpen(false);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save expense', severity: 'error' }));
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

  const handleAssignEmployee = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await assignEmployee({ id: id!, data: { employeeId: selectedEmployeeId } }).unwrap();
      dispatch(showSnackbar({ message: 'Employee assigned', severity: 'success' }));
      setEmployeeOpen(false); setSelectedEmployeeId('');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to assign employee', severity: 'error' }));
    }
  };

  const handleRemoveEmployee = async () => {
    if (!removeEmployeeId) return;
    try {
      await removeEmployee({ id: id!, employeeId: removeEmployeeId }).unwrap();
      dispatch(showSnackbar({ message: 'Employee removed', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to remove employee', severity: 'error' }));
    }
    setRemoveEmployeeId(null);
  };

  if (isLoading) return <Loader />;
  if (!project) return <Typography>Project not found</Typography>;

  const remaining = project.budget - project.spent;
  const budgetUsedPct = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
  const totalExpenses = project.expenses?.reduce((s, e) => s + e.amount, 0) ?? 0;
  const laboursList = laboursData?.items ?? [];
  const machineriesList = machineriesData?.items ?? [];
  const employeesList = employeesData?.items ?? [];
  const overdueMilestones = project.milestones?.filter((m) => !m.isCompleted && isOverdue(m.dueDate)).length ?? 0;

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

      {/* Budget Alert */}
      {project.budget > 0 && budgetUsedPct >= 100 && (
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          Budget exceeded! Spent <strong>{fmt(project.spent)}</strong> of <strong>{fmt(project.budget)}</strong> budget.
        </Alert>
      )}
      {project.budget > 0 && budgetUsedPct >= 80 && budgetUsedPct < 100 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
          Budget warning: <strong>{Math.round(budgetUsedPct)}%</strong> used ({fmt(project.spent)} of {fmt(project.budget)}).
        </Alert>
      )}
      {overdueMilestones > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{overdueMilestones}</strong> milestone{overdueMilestones > 1 ? 's are' : ' is'} overdue.
        </Alert>
      )}

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
          <Card variant="outlined" sx={{ borderColor: budgetUsedPct >= 80 ? 'warning.main' : undefined }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Spent</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: budgetUsedPct >= 100 ? 'error.main' : budgetUsedPct >= 80 ? 'warning.main' : 'text.primary' }}>
                {fmt(project.spent)}
              </Typography>
              {project.budget > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budgetUsedPct, 100)}
                  color={budgetUsedPct >= 100 ? 'error' : budgetUsedPct >= 80 ? 'warning' : 'primary'}
                  sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                />
              )}
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
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label={`Milestones${overdueMilestones > 0 ? ` ⚠ ${overdueMilestones}` : ''}`} />
          <Tab label="Expenses" />
          <Tab label="Labour" />
          <Tab label="Machinery" />
          <Tab label="Employees" />
          <Tab label={`Invoices (${invoicesData?.data.length ?? 0})`} />
          <Tab label={`Purchase Orders (${posData?.data.length ?? 0})`} />
          <Tab label="Payroll" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ── Overview ── */}
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

          {/* ── Milestones ── */}
          {tab === 1 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddMilestone}>
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
                    {project.milestones?.map((ms) => {
                      const overdue = !ms.isCompleted && isOverdue(ms.dueDate);
                      return (
                        <TableRow key={ms.id} hover sx={{ bgcolor: overdue ? 'error.50' : undefined }}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
                              {overdue && <WarningAmberIcon fontSize="small" color="error" />}
                              <span>{ms.title}</span>
                            </Stack>
                          </TableCell>
                          <TableCell>{ms.description ?? '-'}</TableCell>
                          <TableCell sx={{ color: overdue ? 'error.main' : undefined, fontWeight: overdue ? 600 : undefined }}>
                            {fmtDate(ms.dueDate)}
                            {overdue && <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>Overdue</Typography>}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ms.isCompleted ? 'Completed' : overdue ? 'Overdue' : 'Pending'}
                              color={ms.isCompleted ? 'success' : overdue ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={ms.isCompleted ? 'Mark Pending' : 'Mark Complete'}>
                              <IconButton size="small" onClick={() => handleToggleMilestone(ms.id, ms.isCompleted)}>
                                {ms.isCompleted ? <CheckCircleIcon fontSize="small" color="success" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditMilestone(ms)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteMilestone(ms.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!project.milestones?.length && (
                      <TableRow><TableCell colSpan={5}><EmptyState message="No milestones yet" actionLabel="Add Milestone" onAction={openAddMilestone} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* ── Expenses ── */}
          {tab === 2 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2">Total: <strong>{fmt(totalExpenses)}</strong></Typography>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddExpense}>
                  Add Expense
                </Button>
              </Stack>
              {/* Category breakdown */}
              {(project.expenses?.length ?? 0) > 0 && (() => {
                const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
                  cat,
                  total: project.expenses?.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0) ?? 0,
                })).filter((r) => r.total > 0);
                return (
                  <Stack direction="row" sx={{ flexWrap: 'wrap', mb: 2 }} spacing={1}>
                    {byCategory.map(({ cat, total }) => (
                      <Chip key={cat} label={`${cat}: ${fmt(total)}`} size="small" variant="outlined" />
                    ))}
                  </Stack>
                );
              })()}
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
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditExpense(exp)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteExpId(exp.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!project.expenses?.length && (
                      <TableRow><TableCell colSpan={5}><EmptyState message="No expenses yet" actionLabel="Add Expense" onAction={openAddExpense} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* ── Labour ── */}
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

          {/* ── Machinery ── */}
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

          {/* ── Employees ── */}
          {tab === 5 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setEmployeeOpen(true)}>
                  Assign Employee
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Designation</TableCell>
                      <TableCell align="right">Basic Salary</TableCell>
                      <TableCell>Assigned Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.employees?.map((pe) => (
                      <TableRow key={pe.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{pe.employee.fullName}</TableCell>
                        <TableCell>{pe.employee.designation ?? '-'}</TableCell>
                        <TableCell align="right">{fmt(pe.employee.basicSalary)}</TableCell>
                        <TableCell>{fmtDate(pe.assignedAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => setRemoveEmployeeId(pe.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!project.employees?.length && (
                      <TableRow><TableCell colSpan={5}><EmptyState message="No employees assigned yet" actionLabel="Assign Employee" onAction={() => setEmployeeOpen(true)} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* ── Invoices ── */}
          {tab === 6 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {invoicesData?.data.length ? (() => {
                  const invTotal = invoicesData.data.reduce((s, inv) => s + inv.total, 0);
                  const invPaid = invoicesData.data.filter((inv) => inv.status === 'Paid').reduce((s, inv) => s + inv.total, 0);
                  const invOutstanding = invTotal - invPaid;
                  return (
                    <Stack direction="row" spacing={2}>
                      <Typography variant="body2">Billed: <strong>{fmt(invTotal)}</strong></Typography>
                      <Typography variant="body2" color="success.main">Paid: <strong>{fmt(invPaid)}</strong></Typography>
                      <Typography variant="body2" color={invOutstanding > 0 ? 'warning.main' : 'text.secondary'}>Outstanding: <strong>{fmt(invOutstanding)}</strong></Typography>
                    </Stack>
                  );
                })() : <Box />}
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => navigate(`/invoices/new`)}>
                  New Invoice
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Issue Date</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoicesData?.data.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.customer?.name ?? '-'}</TableCell>
                        <TableCell>{fmtDate(inv.issueDate)}</TableCell>
                        <TableCell>{fmtDate(inv.dueDate)}</TableCell>
                        <TableCell align="right">{fmt(inv.total)}</TableCell>
                        <TableCell><Chip label={inv.status} color={INV_STATUS_COLOR(inv.status)} size="small" /></TableCell>
                        <TableCell align="right">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigate(`/invoices/${inv.id}`)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!invoicesData?.data.length && (
                      <TableRow><TableCell colSpan={7}><EmptyState message="No invoices for this project" actionLabel="New Invoice" onAction={() => navigate('/invoices/new')} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* ── Purchase Orders ── */}
          {tab === 7 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {posData?.data.length ? (() => {
                  const poTotal = posData.data.reduce((s, po) => s + po.total, 0);
                  const poReceived = posData.data.filter((po) => po.status === 'Received').reduce((s, po) => s + po.total, 0);
                  const poPending = posData.data.filter((po) => !['Received', 'Cancelled'].includes(po.status)).reduce((s, po) => s + po.total, 0);
                  return (
                    <Stack direction="row" spacing={2}>
                      <Typography variant="body2">Ordered: <strong>{fmt(poTotal)}</strong></Typography>
                      <Typography variant="body2" color="success.main">Received: <strong>{fmt(poReceived)}</strong></Typography>
                      <Typography variant="body2" color={poPending > 0 ? 'warning.main' : 'text.secondary'}>Pending: <strong>{fmt(poPending)}</strong></Typography>
                    </Stack>
                  );
                })() : <Box />}
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => navigate(`/purchase-orders/new`)}>
                  New PO
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>PO #</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Issue Date</TableCell>
                      <TableCell>Expected Delivery</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {posData?.data.map((po) => (
                      <TableRow key={po.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{po.poNumber}</TableCell>
                        <TableCell>{po.supplier?.name ?? '-'}</TableCell>
                        <TableCell>{fmtDate(po.issueDate)}</TableCell>
                        <TableCell>{po.expectedDelivery ? fmtDate(po.expectedDelivery) : '-'}</TableCell>
                        <TableCell align="right">{fmt(po.total)}</TableCell>
                        <TableCell><Chip label={po.status} color={PO_STATUS_COLOR(po.status)} size="small" /></TableCell>
                        <TableCell align="right">
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!posData?.data.length && (
                      <TableRow><TableCell colSpan={7}><EmptyState message="No purchase orders for this project" actionLabel="New PO" onAction={() => navigate('/purchase-orders/new')} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* ── Payroll ── */}
          {tab === 8 && (
            <>
              {/* Month/Year selector */}
              <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1 }}>Payroll Month:</Typography>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Month</InputLabel>
                  <Select label="Month" value={payrollMonth} onChange={(e) => setPayrollMonth(Number(e.target.value))}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                      <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Year</InputLabel>
                  <Select label="Year" value={payrollYear} onChange={(e) => setPayrollYear(Number(e.target.value))}>
                    {[2023, 2024, 2025, 2026, 2027].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>

              {/* ── Employee Salaries ── */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Employee Salaries</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Designation</TableCell>
                      <TableCell align="right">Basic Salary</TableCell>
                      <TableCell align="right">Net Salary</TableCell>
                      <TableCell align="center">Days</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Paid Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrollData?.employees.map((emp) => (
                      <TableRow key={emp.employeeId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{emp.fullName}</TableCell>
                        <TableCell>{emp.designation ?? '-'}</TableCell>
                        <TableCell align="right">{fmt(emp.basicSalary)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {emp.salary ? fmt(emp.salary.netSalary) : '—'}
                        </TableCell>
                        <TableCell align="center">
                          {emp.salary ? `${emp.salary.daysPresent}/${emp.salary.totalDays}` : '—'}
                        </TableCell>
                        <TableCell>
                          {emp.salary ? (
                            <Chip
                              label={emp.salary.status}
                              size="small"
                              color={emp.salary.status === 'Paid' ? 'success' : 'warning'}
                            />
                          ) : (
                            <Chip label="Not Generated" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          {emp.salary?.paidDate ? fmtDate(emp.salary.paidDate) : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            {!emp.salary && (
                              <Tooltip title="Generate Salary">
                                <IconButton size="small" color="primary" onClick={() => {
                                  setGenSalaryEmp({ employeeId: emp.employeeId, fullName: emp.fullName, basicSalary: emp.basicSalary });
                                  setGenBonus('0');
                                  setGenDeductions('0');
                                  setGenDaysPresent('26');
                                  setGenTotalDays('30');
                                  setGenRemarks('');
                                }}>
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {emp.salary?.status === 'Generated' && (
                              <Tooltip title="Mark as Paid">
                                <IconButton size="small" color="success" onClick={() => {
                                  setPayDialogSalary({ employeeId: emp.employeeId, salaryId: emp.salary!.id });
                                  setPaidDate(today());
                                }}>
                                  <PaymentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {emp.salary && (
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() =>
                                  setDeleteSalaryInfo({ employeeId: emp.employeeId, salaryId: emp.salary!.id })
                                }>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!payrollData?.employees.length && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                          No employees assigned to this project
                        </TableCell>
                      </TableRow>
                    )}
                    {(payrollData?.employees.length ?? 0) > 0 && (
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total Employee Cost</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {fmt(payrollData?.employees.reduce((s, e) => s + (e.salary?.netSalary ?? 0), 0) ?? 0)}
                        </TableCell>
                        <TableCell colSpan={4} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* ── Labour Wages ── */}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Labour Wages</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Trade</TableCell>
                      <TableCell align="right">Daily Wage</TableCell>
                      <TableCell align="center">Days Present</TableCell>
                      <TableCell align="right">Wages Earned</TableCell>
                      <TableCell align="right">OT Pay</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payrollData?.labours.map((lab) => (
                      <TableRow key={lab.labourId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{lab.name}</TableCell>
                        <TableCell>{lab.trade ?? '-'}</TableCell>
                        <TableCell align="right">{fmt(lab.dailyWage)}</TableCell>
                        <TableCell align="center">
                          <Chip label={lab.daysPresent} size="small" color={lab.daysPresent > 0 ? 'info' : 'default'} />
                        </TableCell>
                        <TableCell align="right">{fmt(lab.wagesEarned)}</TableCell>
                        <TableCell align="right">{lab.overtimePay > 0 ? fmt(lab.overtimePay) : '—'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>{fmt(lab.totalWages)}</TableCell>
                      </TableRow>
                    ))}
                    {!payrollData?.labours.length && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                          No labour assigned to this project
                        </TableCell>
                      </TableRow>
                    )}
                    {(payrollData?.labours.length ?? 0) > 0 && (
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={6} sx={{ fontWeight: 700 }}>Total Labour Cost</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>
                          {fmt(payrollData?.labours.reduce((s, l) => s + l.totalWages, 0) ?? 0)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Grand Total */}
              {((payrollData?.employees.length ?? 0) > 0 || (payrollData?.labours.length ?? 0) > 0) && (
                <Paper variant="outlined" sx={{ mt: 2, p: 2, borderColor: 'warning.main' }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Grand Total Payroll Cost</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                      {fmt(
                        (payrollData?.employees.reduce((s, e) => s + (e.salary?.netSalary ?? 0), 0) ?? 0) +
                        (payrollData?.labours.reduce((s, l) => s + l.totalWages, 0) ?? 0)
                      )}
                    </Typography>
                  </Stack>
                </Paper>
              )}
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

      {/* Add / Edit Milestone Dialog */}
      <Dialog open={milestoneOpen} onClose={() => setMilestoneOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveMilestone}>
          <DialogTitle>{editMilestoneId ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
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
              {addingMs ? <CircularProgress size={20} /> : editMilestoneId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add / Edit Expense Dialog */}
      <Dialog open={expenseOpen} onClose={() => setExpenseOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveExpense}>
          <DialogTitle>{editExpenseId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
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
            <Button type="submit" variant="contained" disabled={addingExp || updatingExp}>
              {(addingExp || updatingExp) ? <CircularProgress size={20} /> : editExpenseId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign Labour Dialog */}
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

      {/* Assign Machinery Dialog */}
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

      {/* Assign Employee Dialog */}
      <Dialog open={employeeOpen} onClose={() => setEmployeeOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAssignEmployee}>
          <DialogTitle>Assign Employee</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select label="Employee" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} required>
                  {employeesList.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.fullName}{emp.designation ? ` — ${emp.designation}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmployeeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assigningEmployee || !selectedEmployeeId}>
              {assigningEmployee ? <CircularProgress size={20} /> : 'Assign'}
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
      <ConfirmDialog
        open={Boolean(removeEmployeeId)}
        title="Remove Employee"
        message="Are you sure you want to remove this employee from the project?"
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveEmployee}
        onCancel={() => setRemoveEmployeeId(null)}
      />

      {/* Generate Salary Dialog */}
      <Dialog open={Boolean(genSalaryEmp)} onClose={() => setGenSalaryEmp(null)} maxWidth="sm" fullWidth>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!genSalaryEmp) return;
          try {
            await processSalary({
              id: genSalaryEmp.employeeId,
              data: {
                month: payrollMonth,
                year: payrollYear,
                basicSalary: genSalaryEmp.basicSalary,
                bonus: Number(genBonus),
                deductions: Number(genDeductions),
                daysPresent: Number(genDaysPresent),
                totalDays: Number(genTotalDays),
                remarks: genRemarks || undefined,
              },
            }).unwrap();
            dispatch(showSnackbar({ message: 'Salary generated', severity: 'success' }));
            setGenSalaryEmp(null);
            refetchPayroll();
          } catch (err: any) {
            dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed to generate', severity: 'error' }));
          }
        }}>
          <DialogTitle>Generate Salary — {genSalaryEmp?.fullName}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={2}>
                <TextField label="Month" value={String(payrollMonth)} size="small" fullWidth disabled />
                <TextField label="Year" value={String(payrollYear)} size="small" fullWidth disabled />
              </Stack>
              <TextField label="Basic Salary (PKR)" value={String(genSalaryEmp?.basicSalary ?? '')} size="small" fullWidth disabled />
              <Stack direction="row" spacing={2}>
                <TextField label="Days Present" type="number" value={genDaysPresent} onChange={e => setGenDaysPresent(e.target.value)} size="small" required fullWidth />
                <TextField label="Total Days" type="number" value={genTotalDays} onChange={e => setGenTotalDays(e.target.value)} size="small" required fullWidth />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="Bonus (PKR)" type="number" value={genBonus} onChange={e => setGenBonus(e.target.value)} size="small" fullWidth />
                <TextField label="Deductions (PKR)" type="number" value={genDeductions} onChange={e => setGenDeductions(e.target.value)} size="small" fullWidth />
              </Stack>
              <TextField label="Remarks" value={genRemarks} onChange={e => setGenRemarks(e.target.value)} size="small" fullWidth multiline rows={2} />
              <Alert severity="info" sx={{ py: 0 }}>
                Net = (Basic / Total Days × Days Present) + Bonus − Deductions
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenSalaryEmp(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={generatingSalary}>
              {generatingSalary ? <CircularProgress size={18} /> : 'Generate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={Boolean(payDialogSalary)} onClose={() => setPayDialogSalary(null)} maxWidth="xs" fullWidth>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!payDialogSalary) return;
          try {
            await markSalaryAsPaid({ id: payDialogSalary.employeeId, salaryId: payDialogSalary.salaryId, data: { paidDate } }).unwrap();
            dispatch(showSnackbar({ message: 'Salary marked as paid', severity: 'success' }));
            setPayDialogSalary(null);
            refetchPayroll();
          } catch (err: any) {
            dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
          }
        }}>
          <DialogTitle>Mark Salary as Paid</DialogTitle>
          <DialogContent dividers>
            <TextField label="Payment Date" type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} size="small" fullWidth required slotProps={{ inputLabel: { shrink: true } }} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayDialogSalary(null)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={payingSalary}>
              {payingSalary ? <CircularProgress size={18} /> : 'Mark as Paid'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Salary Confirm */}
      <ConfirmDialog
        open={Boolean(deleteSalaryInfo)}
        title="Delete Salary Record"
        message="This will permanently delete this salary record. If not yet paid, any deducted advances will be restored."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteSalaryInfo) return;
          try {
            await deleteSalary({ id: deleteSalaryInfo.employeeId, salaryId: deleteSalaryInfo.salaryId }).unwrap();
            dispatch(showSnackbar({ message: 'Salary deleted', severity: 'success' }));
            refetchPayroll();
          } catch (err: any) {
            dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
          }
          setDeleteSalaryInfo(null);
        }}
        onCancel={() => setDeleteSalaryInfo(null)}
      />
    </Box>
  );
}
