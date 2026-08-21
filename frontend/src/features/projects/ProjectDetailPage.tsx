import { useState, type FormEvent } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton, InputAdornment,
  InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
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
  useGetPendingAdvancesQuery,
} from '../employees/employeesApi';
import {
  useGetLabourAttendanceQuery,
  useBulkUpsertLabourAttendanceMutation,
  useGetLaboursQuery,
} from '../labour/labourApi';
import { useGetMachineriesQuery } from '../machinery/machineryApi';
import {
  useGetEmployeesQuery,
  useGetEmployeeAttendanceQuery,
  useBulkUpsertEmployeeAttendanceMutation,
} from '../employees/employeesApi';
import { useGetInvoicesQuery } from '../invoices/invoiceApi';
import { useGetPurchaseOrdersQuery } from '../purchase-orders/purchaseOrderApi';
import AttendanceSheet from '../../components/AttendanceSheet';
import ProjectFormDialog from './ProjectFormDialog';
import { PROJECT_STATUS_COLORS } from '../../utils/statusColors';
import {
  useAddProjectIncomeMutation,
  useUpdateProjectIncomeMutation,
  useDeleteProjectIncomeMutation,
  useGetProjectPnLQuery,
  useAssignVehicleMutation,
  useRemoveVehicleMutation,
  useAssignPlantMutation,
  useRemovePlantMutation,
} from './projectApi';
import { useGetVehiclesQuery } from '../vehicles/vehicleApi';
import { useGetPlantsQuery } from '../plants/plantApi';
import { useGetExpenseCategoriesQuery, useGetIncomeCategoriesQuery } from '../expense/categoryApi';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');
const today = () => new Date().toISOString().split('T')[0];
const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

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
  const [expCategory, setExpCategory] = useState('Materials');
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

  // Income state
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [editIncomeId, setEditIncomeId] = useState<string | null>(null);
  const [incCategory, setIncCategory] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incDate, setIncDate] = useState(today());
  const [incDescription, setIncDescription] = useState('');
  const [incSource, setIncSource] = useState('');
  const [deleteIncId, setDeleteIncId] = useState<string | null>(null);

  // Vehicle state
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [removeVehicleId, setRemoveVehicleId] = useState<string | null>(null);

  // Plant state
  const [plantOpen, setPlantOpen] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [removePlantId, setRemovePlantId] = useState<string | null>(null);

  // P&L state
  const [pnlMonth, setPnlMonth] = useState<number | undefined>(undefined);
  const [pnlYear, setPnlYear] = useState<number | undefined>(undefined);

  // Resources sub-tab state (0=Machinery, 1=Vehicles, 2=Plants)
  const [resourcesSubTab, setResourcesSubTab] = useState(0);

  // Employee state
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [removeEmployeeId, setRemoveEmployeeId] = useState<string | null>(null);

  // Attendance state
  const [attSubTab, setAttSubTab] = useState(0);        // 0=Labour, 1=Employee
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());
  const [selectedAttLabourId, setSelectedAttLabourId] = useState('');
  const [selectedAttEmployeeId, setSelectedAttEmployeeId] = useState('');

  // Payroll state
  const now = new Date();
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [genSalaryEmp, setGenSalaryEmp] = useState<{ employeeId: string; fullName: string; basicSalary: number } | null>(null);
  const [genBasicSalary, setGenBasicSalary] = useState('');
  const [genBonus, setGenBonus] = useState('0');
  const [genDeductions, setGenDeductions] = useState('0');
  const [genDaysPresent, setGenDaysPresent] = useState('');
  const [genTotalDays, setGenTotalDays] = useState('30');
  const [genRemarks, setGenRemarks] = useState('');
  const [payDialogSalary, setPayDialogSalary] = useState<{ employeeId: string; salaryId: string } | null>(null);
  const [paidDate, setPaidDate] = useState(today());
  const [deleteSalaryInfo, setDeleteSalaryInfo] = useState<{ employeeId: string; salaryId: string } | null>(null);

  const { data: project, isLoading } = useGetProjectQuery(id ?? '', { skip: !id });
  const { data: laboursData } = useGetLaboursQuery({ pageSize: 1000 });
  const { data: machineriesData } = useGetMachineriesQuery({ pageSize: 1000 });
  const { data: employeesData } = useGetEmployeesQuery({ pageSize: 1000, isActive: true });
  const { data: vehiclesData } = useGetVehiclesQuery({ pageSize: 1000 });
  const { data: plantsData } = useGetPlantsQuery({ pageSize: 1000 });
  const { data: expenseCategories = [] } = useGetExpenseCategoriesQuery();
  const { data: incomeCategories = [] } = useGetIncomeCategoriesQuery();
  const { data: pnlData } = useGetProjectPnLQuery(
    { id: id ?? '', month: pnlMonth, year: pnlYear },
    { skip: !id || tab !== 4 },
  );
  const { data: invoicesData } = useGetInvoicesQuery(
    { projectId: id, pageSize: 100 },
    { skip: !id || tab !== 8 },
  );
  const { data: posData } = useGetPurchaseOrdersQuery(
    { projectId: id, pageSize: 100 },
    { skip: !id || tab !== 9 },
  );
  const { data: payrollData, refetch: refetchPayroll } = useGetProjectPayrollQuery(
    { id: id ?? '', month: payrollMonth, year: payrollYear },
    { skip: !id || tab !== 10 },
  );

  const { data: attLabourRecords = [] } = useGetLabourAttendanceQuery(
    { id: selectedAttLabourId, month: attMonth, year: attYear },
    { skip: !selectedAttLabourId || tab !== 11 || attSubTab !== 0 },
  );
  const { data: attEmployeeRecords = [] } = useGetEmployeeAttendanceQuery(
    { id: selectedAttEmployeeId, month: attMonth, year: attYear },
    { skip: !selectedAttEmployeeId || tab !== 11 || attSubTab !== 1 },
  );
  const [bulkUpsertLabourAttendance, { isLoading: savingLabourAtt }] = useBulkUpsertLabourAttendanceMutation();
  const [bulkUpsertEmpAttendance, { isLoading: savingEmpAtt }] = useBulkUpsertEmployeeAttendanceMutation();
  const { data: genPendingData } = useGetPendingAdvancesQuery(
    genSalaryEmp?.employeeId ?? '',
    { skip: !genSalaryEmp },
  );
  const genPendingTotal = genPendingData?.total ?? 0;
  const genPendingCount = genPendingData?.advances.length ?? 0;

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
  const [addIncome, { isLoading: addingInc }] = useAddProjectIncomeMutation();
  const [updateIncome, { isLoading: updatingInc }] = useUpdateProjectIncomeMutation();
  const [deleteIncome] = useDeleteProjectIncomeMutation();
  const [assignVehicle, { isLoading: assigningVehicle }] = useAssignVehicleMutation();
  const [removeVehicle] = useRemoveVehicleMutation();
  const [assignPlant, { isLoading: assigningPlant }] = useAssignPlantMutation();
  const [removePlant] = useRemovePlantMutation();

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
    setExpCategory((expenseCategories as any[])[0]?.name ?? 'Materials');
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

  // Income handlers
  const openAddIncome = () => {
    setEditIncomeId(null);
    setIncCategory((incomeCategories as any[])[0]?.name ?? '');
    setIncAmount('');
    setIncDate(today());
    setIncDescription('');
    setIncSource('');
    setIncomeOpen(true);
  };
  const openEditIncome = (inc: any) => {
    setEditIncomeId(inc.id);
    setIncCategory(inc.category);
    setIncAmount(String(inc.amount));
    setIncDate(inc.date?.split('T')[0] ?? today());
    setIncDescription(inc.description ?? '');
    setIncSource(inc.source ?? '');
    setIncomeOpen(true);
  };
  const handleSaveIncome = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = { category: incCategory, amount: Number(incAmount), date: incDate, description: incDescription || undefined, source: incSource || undefined };
      if (editIncomeId) {
        await updateIncome({ id: id!, incomeId: editIncomeId, data }).unwrap();
        dispatch(showSnackbar({ message: 'Income updated', severity: 'success' }));
      } else {
        await addIncome({ id: id!, data }).unwrap();
        dispatch(showSnackbar({ message: 'Income added', severity: 'success' }));
      }
      setIncomeOpen(false);
    } catch { dispatch(showSnackbar({ message: 'Failed to save income', severity: 'error' })); }
  };
  const handleDeleteIncome = async () => {
    if (!deleteIncId) return;
    try {
      await deleteIncome({ id: id!, incomeId: deleteIncId }).unwrap();
      dispatch(showSnackbar({ message: 'Income deleted', severity: 'success' }));
    } catch { dispatch(showSnackbar({ message: 'Failed to delete income', severity: 'error' })); }
    setDeleteIncId(null);
  };

  // Vehicle handlers
  const handleAssignVehicle = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await assignVehicle({ id: id!, data: { vehicleId: selectedVehicleId } }).unwrap();
      dispatch(showSnackbar({ message: 'Vehicle assigned', severity: 'success' }));
      setVehicleOpen(false); setSelectedVehicleId('');
    } catch { dispatch(showSnackbar({ message: 'Failed to assign vehicle', severity: 'error' })); }
  };
  const handleRemoveVehicle = async () => {
    if (!removeVehicleId) return;
    try {
      await removeVehicle({ id: id!, vehicleId: removeVehicleId }).unwrap();
      dispatch(showSnackbar({ message: 'Vehicle removed', severity: 'success' }));
    } catch { dispatch(showSnackbar({ message: 'Failed to remove vehicle', severity: 'error' })); }
    setRemoveVehicleId(null);
  };

  // Plant handlers
  const handleAssignPlant = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await assignPlant({ id: id!, data: { plantId: selectedPlantId } }).unwrap();
      dispatch(showSnackbar({ message: 'Plant assigned', severity: 'success' }));
      setPlantOpen(false); setSelectedPlantId('');
    } catch { dispatch(showSnackbar({ message: 'Failed to assign plant', severity: 'error' })); }
  };
  const handleRemovePlant = async () => {
    if (!removePlantId) return;
    try {
      await removePlant({ id: id!, plantId: removePlantId }).unwrap();
      dispatch(showSnackbar({ message: 'Plant removed', severity: 'success' }));
    } catch { dispatch(showSnackbar({ message: 'Failed to remove plant', severity: 'error' })); }
    setRemovePlantId(null);
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
  const totalIncome = (project as any).incomes?.reduce((s: number, inc: any) => s + inc.amount, 0) ?? 0;
  const laboursList = laboursData?.items ?? [];
  const machineriesList = machineriesData?.items ?? [];
  const vehiclesList = (vehiclesData as any)?.items ?? [];
  const plantsList = (plantsData as any)?.items ?? [];
  const employeesList = employeesData?.items ?? [];
  const expCategoryNames: string[] = (expenseCategories as any[]).length > 0
    ? (expenseCategories as any[]).map((c: any) => c.name)
    : ['Materials', 'Labour', 'Employee', 'Machinery', 'Transport', 'Utilities', 'Permits', 'Other'];
  const incCategoryNames: string[] = (incomeCategories as any[]).length > 0
    ? (incomeCategories as any[]).map((c: any) => c.name)
    : ['Contract', 'Advance', 'Retention', 'Variation', 'Other'];
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
        <Button variant="outlined" color="info" onClick={() => navigate(`/projects/${id}/boq`)}>BOQ</Button>
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
          <Tab label="Income" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
          <Tab label="P&L" icon={<TrendingDownIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Labour" />
          <Tab label="Resources" icon={<PrecisionManufacturingIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Employees" />
          <Tab label={`Invoices (${invoicesData?.data.length ?? 0})`} />
          <Tab label={`Purchase Orders (${posData?.data.length ?? 0})`} />
          <Tab label="Payroll" />
          <Tab label="Attendance" icon={<EventNoteIcon fontSize="small" />} iconPosition="start" />
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
                const byCategory = expCategoryNames.map((cat) => ({
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

          {/* ── Income ── */}
          {tab === 3 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2">Total: <strong>{fmt(totalIncome)}</strong></Typography>
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddIncome}>
                  Add Income
                </Button>
              </Stack>
              {/* Category breakdown */}
              {((project as any).incomes?.length ?? 0) > 0 && (() => {
                const byCategory = incCategoryNames.map((cat) => ({
                  cat,
                  total: (project as any).incomes?.filter((i: any) => i.category === cat).reduce((s: number, i: any) => s + i.amount, 0) ?? 0,
                })).filter((r) => r.total > 0);
                return (
                  <Stack direction="row" sx={{ flexWrap: 'wrap', mb: 2 }} spacing={1}>
                    {byCategory.map(({ cat, total }) => (
                      <Chip key={cat} label={`${cat}: ${fmt(total)}`} size="small" variant="outlined" color="success" />
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
                      <TableCell>Source</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((project as any).incomes ?? []).map((inc: any) => (
                      <TableRow key={inc.id} hover>
                        <TableCell>{fmtDate(inc.date)}</TableCell>
                        <TableCell>{inc.category}</TableCell>
                        <TableCell>{inc.source ?? '-'}</TableCell>
                        <TableCell>{inc.description ?? '-'}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{fmt(inc.amount)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditIncome(inc)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteIncId(inc.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!((project as any).incomes?.length) && (
                      <TableRow><TableCell colSpan={6}><EmptyState message="No income recorded yet" actionLabel="Add Income" onAction={openAddIncome} /></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* ── P&L ── */}
          {tab === 4 && (() => {
            const MONTHS_LIST = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

            const pnlIncome = (pnlData as any)?.totalIncome ?? 0;
            const pnlDirectExpenses = (pnlData as any)?.totalDirectExpenses ?? 0;
            const pnlLabourCost = (pnlData as any)?.totalLabourCost ?? 0;
            const pnlSalaryCost = (pnlData as any)?.totalSalaryCost ?? 0;
            const pnlTotalCosts = pnlDirectExpenses + pnlLabourCost + pnlSalaryCost;
            const pnlGrossProfit = pnlIncome - pnlTotalCosts;
            const isProfit = pnlGrossProfit >= 0;

            return (
              <>
                {/* Month/Year filter */}
                <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Filter by Period:</Typography>
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                      label="Month"
                      value={pnlMonth ? String(pnlMonth) : ''}
                      onChange={(e) => { const v = e.target.value as string; setPnlMonth(v === '' ? undefined : Number(v)); }}
                    >
                      <MenuItem value="">All Months</MenuItem>
                      {MONTHS_LIST.map((m, i) => (
                        <MenuItem key={i + 1} value={String(i + 1)}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                      label="Year"
                      value={pnlYear ? String(pnlYear) : ''}
                      onChange={(e) => { const v = e.target.value as string; setPnlYear(v === '' ? undefined : Number(v)); }}
                    >
                      <MenuItem value="">All Years</MenuItem>
                      {years.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Total Income</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(pnlIncome)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderColor: 'error.light' }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Direct Expenses</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(pnlDirectExpenses)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderColor: 'warning.light' }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Labour + Salary Cost</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark' }}>{fmt(pnlLabourCost + pnlSalaryCost)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderColor: isProfit ? 'success.main' : 'error.main', bgcolor: isProfit ? 'success.50' : 'error.50' }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Gross {isProfit ? 'Profit' : 'Loss'}</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: isProfit ? 'success.main' : 'error.main' }}>
                          {isProfit ? '+' : ''}{fmt(pnlGrossProfit)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* P&L breakdown table */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={{ bgcolor: 'success.50' }}>
                        <TableCell sx={{ fontWeight: 600, color: 'success.dark' }}>Total Income</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{fmt(pnlIncome)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Direct Expenses</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>({fmt(pnlDirectExpenses)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Labour Wages</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>({fmt(pnlLabourCost)})</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ pl: 4, color: 'text.secondary' }}>Employee Salaries</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>({fmt(pnlSalaryCost)})</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Total Costs</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>({fmt(pnlTotalCosts)})</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: isProfit ? 'success.50' : 'error.50' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1rem', color: isProfit ? 'success.dark' : 'error.dark' }}>
                          Gross {isProfit ? 'Profit' : 'Loss'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: isProfit ? 'success.main' : 'error.main' }}>
                          {isProfit ? '+' : ''}{fmt(pnlGrossProfit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            );
          })()}

          {/* ── Labour ── */}
          {tab === 5 && (
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

          {/* ── Resources (Machinery + Vehicles + Plants) ── */}
          {tab === 6 && (
            <>
              <Tabs value={resourcesSubTab} onChange={(_, v) => setResourcesSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label={`Machinery (${project.machinery?.length ?? 0})`} />
                <Tab label={`Vehicles (${(project as any).vehicles?.length ?? 0})`} />
                <Tab label={`Plants (${(project as any).plants?.length ?? 0})`} />
              </Tabs>

              {/* Machinery sub-tab */}
              {resourcesSubTab === 0 && (
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

              {/* Vehicles sub-tab */}
              {resourcesSubTab === 1 && (
                <>
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                    <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setVehicleOpen(true)}>
                      Assign Vehicle
                    </Button>
                  </Stack>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Registration</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Assigned Date</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {((project as any).vehicles ?? []).map((pv: any) => (
                          <TableRow key={pv.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{pv.vehicle?.name ?? pv.vehicle?.make ?? '-'}</TableCell>
                            <TableCell>{pv.vehicle?.registrationNumber ?? '-'}</TableCell>
                            <TableCell>{pv.vehicle?.status ?? '-'}</TableCell>
                            <TableCell>{fmtDate(pv.assignedAt)}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Remove">
                                <IconButton size="small" color="error" onClick={() => setRemoveVehicleId(pv.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!(project as any).vehicles?.length && (
                          <TableRow><TableCell colSpan={5}><EmptyState message="No vehicles assigned yet" actionLabel="Assign Vehicle" onAction={() => setVehicleOpen(true)} /></TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Plants sub-tab */}
              {resourcesSubTab === 2 && (
                <>
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                    <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setPlantOpen(true)}>
                      Assign Plant
                    </Button>
                  </Stack>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Assigned Date</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {((project as any).plants ?? []).map((pp: any) => (
                          <TableRow key={pp.id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{pp.plant?.name ?? '-'}</TableCell>
                            <TableCell>{pp.plant?.type ?? '-'}</TableCell>
                            <TableCell>{pp.plant?.status ?? '-'}</TableCell>
                            <TableCell>{fmtDate(pp.assignedAt)}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Remove">
                                <IconButton size="small" color="error" onClick={() => setRemovePlantId(pp.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!(project as any).plants?.length && (
                          <TableRow><TableCell colSpan={5}><EmptyState message="No plants assigned yet" actionLabel="Assign Plant" onAction={() => setPlantOpen(true)} /></TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}

          {/* ── Employees ── */}
          {tab === 7 && (
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
          {tab === 8 && (
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
          {tab === 9 && (
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
          {tab === 10 && (
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
                                  setGenBasicSalary(String(emp.basicSalary));
                                  setGenBonus('0');
                                  setGenDeductions('0');
                                  setGenDaysPresent('');
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

          {/* ── Attendance ── */}
          {tab === 11 && (() => {
            const assignedLabours = project.labours ?? [];
            const assignedEmployees = project.employees ?? [];
            const selectedLabour = assignedLabours.find((l) => l.labour?.id === selectedAttLabourId)?.labour;
            const selectedEmployee = assignedEmployees.find((e) => e.employee?.id === selectedAttEmployeeId)?.employee;

            const MONTHS_LIST = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

            return (
              <>
                {/* Month / Year Selector */}
                <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Attendance Month:</Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Month</InputLabel>
                    <Select label="Month" value={attMonth} onChange={(e) => setAttMonth(Number(e.target.value))}>
                      {MONTHS_LIST.map((m, i) => (
                        <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Year</InputLabel>
                    <Select label="Year" value={attYear} onChange={(e) => setAttYear(Number(e.target.value))}>
                      {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>

                {/* Sub-tabs: Labour | Employees */}
                <Tabs value={attSubTab} onChange={(_, v) => setAttSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label={`Labour (${assignedLabours.length})`} />
                  <Tab label={`Employees (${assignedEmployees.length})`} />
                </Tabs>

                {/* ── Labour Attendance ── */}
                {attSubTab === 0 && (
                  <>
                    {assignedLabours.length === 0 ? (
                      <Alert severity="info">No labour assigned to this project. Assign labour from the Labour tab first.</Alert>
                    ) : (
                      <>
                        <FormControl size="small" sx={{ minWidth: 260, mb: 2 }}>
                          <InputLabel>Select Labour</InputLabel>
                          <Select
                            label="Select Labour"
                            value={selectedAttLabourId}
                            onChange={(e) => setSelectedAttLabourId(e.target.value)}
                          >
                            {assignedLabours.map((pl) => (
                              <MenuItem key={pl.labour?.id} value={pl.labour?.id ?? ''}>
                                {pl.labour?.name} {pl.labour?.trade ? `(${pl.labour.trade})` : ''}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {!selectedAttLabourId && (
                          <Alert severity="info">Select a labour worker above to view and mark attendance.</Alert>
                        )}

                        {selectedLabour && (
                          <AttendanceSheet
                            workerId={selectedLabour.id}
                            workerName={selectedLabour.name}
                            dailyRate={selectedLabour.dailyWage ?? 0}
                            overtimeRate={0}
                            showOvertimeHours
                            month={attMonth}
                            year={attYear}
                            existingRecords={attLabourRecords.map((r: any) => ({
                              date: r.date,
                              isPresent: r.isPresent,
                              overtimeHours: r.overtimeHours,
                            }))}
                            saving={savingLabourAtt}
                            onSave={async (records) => {
                              await bulkUpsertLabourAttendance({
                                records: records.map((r) => ({
                                  labourId: r.workerId,
                                  date: r.date,
                                  isPresent: r.isPresent,
                                  overtimeHours: r.overtimeHours,
                                })),
                              }).unwrap();
                              dispatch(showSnackbar({ message: 'Attendance saved', severity: 'success' }));
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* ── Employee Attendance ── */}
                {attSubTab === 1 && (
                  <>
                    {assignedEmployees.length === 0 ? (
                      <Alert severity="info">No employees assigned to this project. Assign employees from the Employees tab first.</Alert>
                    ) : (
                      <>
                        <FormControl size="small" sx={{ minWidth: 260, mb: 2 }}>
                          <InputLabel>Select Employee</InputLabel>
                          <Select
                            label="Select Employee"
                            value={selectedAttEmployeeId}
                            onChange={(e) => setSelectedAttEmployeeId(e.target.value)}
                          >
                            {assignedEmployees.map((pe) => (
                              <MenuItem key={pe.employee?.id} value={pe.employee?.id ?? ''}>
                                {pe.employee?.fullName} {pe.employee?.designation ? `(${pe.employee.designation})` : ''}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {!selectedAttEmployeeId && (
                          <Alert severity="info">Select an employee above to view and mark attendance.</Alert>
                        )}

                        {selectedEmployee && (
                          <AttendanceSheet
                            workerId={selectedEmployee.id}
                            workerName={selectedEmployee.fullName}
                            dailyRate={(selectedEmployee.basicSalary ?? 0) / 30}
                            showOvertimeHours={false}
                            month={attMonth}
                            year={attYear}
                            existingRecords={attEmployeeRecords.map((r: any) => ({
                              date: r.date,
                              isPresent: r.isPresent,
                              overtimeHours: r.overtimeHours ?? 0,
                            }))}
                            saving={savingEmpAtt}
                            onSave={async (records) => {
                              await bulkUpsertEmpAttendance({
                                records: records.map((r) => ({
                                  employeeId: r.workerId,
                                  date: r.date,
                                  isPresent: r.isPresent,
                                  overtimeHours: r.overtimeHours,
                                })),
                              }).unwrap();
                              dispatch(showSnackbar({ message: 'Attendance saved', severity: 'success' }));
                            }}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            );
          })()}
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
                  {expCategoryNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
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

      {/* Add / Edit Income Dialog */}
      <Dialog open={incomeOpen} onClose={() => setIncomeOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveIncome}>
          <DialogTitle>{editIncomeId ? 'Edit Income' : 'Add Income'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" value={incCategory} onChange={(e) => setIncCategory(e.target.value)}>
                  {incCategoryNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Amount"
                type="number"
                value={incAmount}
                onChange={(e) => setIncAmount(e.target.value)}
                required
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
              />
              <TextField
                label="Date"
                type="date"
                value={incDate}
                onChange={(e) => setIncDate(e.target.value)}
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField label="Source" value={incSource} onChange={(e) => setIncSource(e.target.value)} fullWidth placeholder="e.g. Client name, invoice ref" />
              <TextField label="Description" value={incDescription} onChange={(e) => setIncDescription(e.target.value)} fullWidth multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIncomeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingInc || updatingInc}>
              {(addingInc || updatingInc) ? <CircularProgress size={20} /> : editIncomeId ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign Vehicle Dialog */}
      <Dialog open={vehicleOpen} onClose={() => setVehicleOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAssignVehicle}>
          <DialogTitle>Assign Vehicle</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Vehicle</InputLabel>
                <Select label="Vehicle" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} required>
                  {vehiclesList.map((v: any) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.name ?? `${v.make ?? ''} ${v.model ?? ''}`.trim()}{v.registrationNumber ? ` — ${v.registrationNumber}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVehicleOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assigningVehicle || !selectedVehicleId}>
              {assigningVehicle ? <CircularProgress size={20} /> : 'Assign'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Assign Plant Dialog */}
      <Dialog open={plantOpen} onClose={() => setPlantOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAssignPlant}>
          <DialogTitle>Assign Plant</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Plant</InputLabel>
                <Select label="Plant" value={selectedPlantId} onChange={(e) => setSelectedPlantId(e.target.value)} required>
                  {plantsList.map((p: any) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}{p.type ? ` — ${p.type}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlantOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={assigningPlant || !selectedPlantId}>
              {assigningPlant ? <CircularProgress size={20} /> : 'Assign'}
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
        open={Boolean(deleteIncId)}
        title="Delete Income"
        message="Are you sure you want to delete this income record?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteIncome}
        onCancel={() => setDeleteIncId(null)}
      />
      <ConfirmDialog
        open={Boolean(removeVehicleId)}
        title="Remove Vehicle"
        message="Are you sure you want to remove this vehicle from the project?"
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveVehicle}
        onCancel={() => setRemoveVehicleId(null)}
      />
      <ConfirmDialog
        open={Boolean(removePlantId)}
        title="Remove Plant"
        message="Are you sure you want to remove this plant from the project?"
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemovePlant}
        onCancel={() => setRemovePlantId(null)}
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
      {(() => {
        const basicNum = parseFloat(genBasicSalary) || 0;
        const totalDaysNum = parseInt(genTotalDays) || 30;
        const daysNum = parseInt(genDaysPresent) || 0;
        const earnedPreview = basicNum > 0 && totalDaysNum > 0 ? (basicNum / totalDaysNum) * daysNum : 0;
        const netPreview = earnedPreview + (parseFloat(genBonus) || 0) - genPendingTotal - (parseFloat(genDeductions) || 0);
        const canGenerate = !generatingSalary && !!genDaysPresent && basicNum > 0 && totalDaysNum > 0 && !isNaN(daysNum);

        return (
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
                    basicSalary: basicNum,
                    bonus: parseFloat(genBonus) || 0,
                    deductions: (parseFloat(genDeductions) || 0),
                    daysPresent: daysNum,
                    totalDays: totalDaysNum,
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
                  <TextField
                    label="Basic Salary (PKR)" type="number" value={genBasicSalary}
                    onChange={e => setGenBasicSalary(e.target.value)} size="small" fullWidth required
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField label="Days Present" type="number" value={genDaysPresent} onChange={e => setGenDaysPresent(e.target.value)} size="small" required fullWidth />
                    <TextField label="Total Working Days" type="number" value={genTotalDays} onChange={e => setGenTotalDays(e.target.value)} size="small" required fullWidth />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Bonus (PKR)" type="number" value={genBonus} onChange={e => setGenBonus(e.target.value)} size="small" fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
                    />
                    <TextField
                      label="Extra Deductions (PKR)" type="number" value={genDeductions} onChange={e => setGenDeductions(e.target.value)} size="small" fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
                    />
                  </Stack>
                  {genPendingCount > 0 && (
                    <Alert severity="warning" sx={{ py: 0.5 }}>
                      <strong>{genPendingCount} advance{genPendingCount > 1 ? 's' : ''} ({fmt(genPendingTotal)})</strong> will be automatically deducted.
                    </Alert>
                  )}
                  {genDaysPresent && basicNum > 0 && (
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Earned ({genDaysPresent}/{genTotalDays} days)</Typography>
                          <Typography variant="body2">{fmt(Math.round(earnedPreview))}</Typography>
                        </Stack>
                        {(parseFloat(genBonus) || 0) > 0 && (
                          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="success.main">+ Bonus</Typography>
                            <Typography variant="body2" color="success.main">{fmt(parseFloat(genBonus))}</Typography>
                          </Stack>
                        )}
                        {genPendingTotal > 0 && (
                          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="error.main">− Advances</Typography>
                            <Typography variant="body2" color="error.main">{fmt(genPendingTotal)}</Typography>
                          </Stack>
                        )}
                        {(parseFloat(genDeductions) || 0) > 0 && (
                          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="error.main">− Extra Deductions</Typography>
                            <Typography variant="body2" color="error.main">{fmt(parseFloat(genDeductions))}</Typography>
                          </Stack>
                        )}
                        <Stack direction="row" sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Salary</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: netPreview < 0 ? 'error.main' : 'primary.main' }}>
                            {fmt(Math.round(netPreview))}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  )}
                  <TextField label="Remarks" value={genRemarks} onChange={e => setGenRemarks(e.target.value)} size="small" fullWidth multiline rows={2} />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setGenSalaryEmp(null)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={!canGenerate}>
                  {generatingSalary ? <CircularProgress size={18} /> : 'Generate'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        );
      })()}

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
