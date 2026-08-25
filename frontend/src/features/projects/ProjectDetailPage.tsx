import { useState, type FormEvent } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import GroupsIcon from '@mui/icons-material/Groups';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
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
  useLazyGetEmployeeAttendanceQuery,
  useBulkUpsertEmployeeAttendanceMutation,
} from '../employees/employeesApi';
import { useGetInvoicesQuery } from '../invoices/invoiceApi';
import { useGetPurchaseOrdersQuery } from '../purchase-orders/purchaseOrderApi';
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
import { fmtAmount } from '../../utils/formatNumber';
import { useGetExpenseCategoriesQuery, useGetIncomeCategoriesQuery } from '../expense/categoryApi';

import { today, isOverdue } from './tabs/utils';
import ProjectOverviewTab from './tabs/ProjectOverviewTab';
import ProjectMilestonesTab from './tabs/ProjectMilestonesTab';
import ProjectExpensesTab from './tabs/ProjectExpensesTab';
import ProjectIncomeTab from './tabs/ProjectIncomeTab';
import ProjectPnLTab from './tabs/ProjectPnLTab';
import ProjectHRTab from './tabs/ProjectHRTab';
import ProjectResourcesTab from './tabs/ProjectResourcesTab';
import ProjectInvoicesTab from './tabs/ProjectInvoicesTab';
import ProjectPurchaseOrdersTab from './tabs/ProjectPurchaseOrdersTab';

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
  const [expTax, setExpTax] = useState('0');
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
  const [incTax, setIncTax] = useState('0');
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

  // HR sub-tab state (0=Labour, 1=Employees, 2=Payroll, 3=Attendance)
  const [hrSubTab, setHrSubTab] = useState(0);

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
    { skip: !id || tab !== 8 },
  );
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
    { skip: !id || tab !== 5 || hrSubTab !== 2 },
  );

  const { data: attLabourRecords = [] } = useGetLabourAttendanceQuery(
    { id: selectedAttLabourId, month: attMonth, year: attYear },
    { skip: !selectedAttLabourId || tab !== 5 || hrSubTab !== 3 || attSubTab !== 0 },
  );
  const { data: attEmployeeRecords = [] } = useGetEmployeeAttendanceQuery(
    { id: selectedAttEmployeeId, month: attMonth, year: attYear },
    { skip: !selectedAttEmployeeId || tab !== 5 || hrSubTab !== 3 || attSubTab !== 1 },
  );
  const [bulkUpsertLabourAttendance, { isLoading: savingLabourAtt }] = useBulkUpsertLabourAttendanceMutation();
  const [bulkUpsertEmpAttendance, { isLoading: savingEmpAtt }] = useBulkUpsertEmployeeAttendanceMutation();
  const { data: genPendingData } = useGetPendingAdvancesQuery(
    genSalaryEmp?.employeeId ?? '',
    { skip: !genSalaryEmp },
  );
  const genPendingTotal = genPendingData?.total ?? 0;

  const [fetchEmpAttendance] = useLazyGetEmployeeAttendanceQuery();

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
    setExpTax('0');
    setExpDate(today());
    setExpDescription('');
    setExpenseOpen(true);
  };

  const openEditExpense = (exp: { id: string; category: string; amount: number; tax: number; date: string; description?: string | null }) => {
    setEditExpenseId(exp.id);
    setExpCategory(exp.category);
    setExpAmount(String(exp.amount));
    setExpTax(String(exp.tax ?? 0));
    setExpDate(exp.date.split('T')[0]);
    setExpDescription(exp.description ?? '');
    setExpenseOpen(true);
  };

  const handleSaveExpense = async (e: FormEvent) => {
    e.preventDefault();
    const data = { category: expCategory, amount: parseFloat(expAmount), tax: parseFloat(expTax) || 0, date: expDate, description: expDescription || undefined };
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
    setIncTax('0');
    setIncDate(today());
    setIncDescription('');
    setIncSource('');
    setIncomeOpen(true);
  };
  const openEditIncome = (inc: any) => {
    setEditIncomeId(inc.id);
    setIncCategory(inc.category);
    setIncAmount(String(inc.amount));
    setIncTax(String(inc.tax ?? 0));
    setIncDate(inc.date?.split('T')[0] ?? today());
    setIncDescription(inc.description ?? '');
    setIncSource(inc.source ?? '');
    setIncomeOpen(true);
  };
  const handleSaveIncome = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = { category: incCategory, amount: Number(incAmount), tax: parseFloat(incTax) || 0, date: incDate, description: incDescription || undefined, source: incSource || undefined };
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
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, color: '#7f1010', '& .MuiAlert-icon': { color: '#7f1010' } }}>
          Budget exceeded! Spent <strong>{fmtAmount(project.spent)}</strong> of <strong>{fmtAmount(project.budget)}</strong> budget.
        </Alert>
      )}
      {project.budget > 0 && budgetUsedPct >= 80 && budgetUsedPct < 100 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2, color: '#7a4a00', '& .MuiAlert-icon': { color: '#7a4a00' } }}>
          Budget warning: <strong>{Math.round(budgetUsedPct)}%</strong> used ({fmtAmount(project.spent)} of {fmtAmount(project.budget)}).
        </Alert>
      )}
      {overdueMilestones > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{overdueMilestones}</strong> milestone{overdueMilestones > 1 ? 's are' : ' is'} overdue.
        </Alert>
      )}

      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label={`Milestones${overdueMilestones > 0 ? ` ⚠ ${overdueMilestones}` : ''}`} />
          <Tab label="Expenses" />
          <Tab label="Income" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Resources" icon={<PrecisionManufacturingIcon fontSize="small" />} iconPosition="start" />
          <Tab label="HR" icon={<GroupsIcon fontSize="small" />} iconPosition="start" />
          <Tab label={`Invoices (${invoicesData?.data.length ?? 0})`} />
          <Tab label={`Purchase Orders (${posData?.data.length ?? 0})`} />
          <Tab label="P&L / Reports" icon={<TrendingDownIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ── Overview ── */}
          {tab === 0 && <ProjectOverviewTab project={project} />}

          {/* ── Milestones ── */}
          {tab === 1 && (
            <ProjectMilestonesTab
              project={project}
              openAddMilestone={openAddMilestone}
              openEditMilestone={openEditMilestone}
              handleToggleMilestone={handleToggleMilestone}
              handleDeleteMilestone={handleDeleteMilestone}
            />
          )}

          {/* ── Expenses ── */}
          {tab === 2 && (
            <ProjectExpensesTab
              project={project}
              totalExpenses={totalExpenses}
              expCategoryNames={expCategoryNames}
              openAddExpense={openAddExpense}
              openEditExpense={openEditExpense}
              setDeleteExpId={setDeleteExpId}
            />
          )}

          {/* ── Income ── */}
          {tab === 3 && (
            <ProjectIncomeTab
              project={project}
              totalIncome={totalIncome}
              incCategoryNames={incCategoryNames}
              openAddIncome={openAddIncome}
              openEditIncome={openEditIncome}
              setDeleteIncId={setDeleteIncId}
            />
          )}

          {/* ── Resources ── */}
          {tab === 4 && (
            <ProjectResourcesTab
              project={project}
              resourcesSubTab={resourcesSubTab}
              setResourcesSubTab={setResourcesSubTab}
              setMachineryOpen={setMachineryOpen}
              setRemoveMachineryId={setRemoveMachineryId}
              setVehicleOpen={setVehicleOpen}
              setRemoveVehicleId={setRemoveVehicleId}
              setPlantOpen={setPlantOpen}
              setRemovePlantId={setRemovePlantId}
            />
          )}

          {/* ── HR ── */}
          {tab === 5 && (
            <ProjectHRTab
              project={project}
              hrSubTab={hrSubTab}
              setHrSubTab={setHrSubTab}
              attSubTab={attSubTab}
              setAttSubTab={setAttSubTab}
              attMonth={attMonth}
              setAttMonth={setAttMonth}
              attYear={attYear}
              setAttYear={setAttYear}
              selectedAttLabourId={selectedAttLabourId}
              setSelectedAttLabourId={setSelectedAttLabourId}
              selectedAttEmployeeId={selectedAttEmployeeId}
              setSelectedAttEmployeeId={setSelectedAttEmployeeId}
              attLabourRecords={attLabourRecords}
              attEmployeeRecords={attEmployeeRecords}
              savingLabourAtt={savingLabourAtt}
              savingEmpAtt={savingEmpAtt}
              bulkUpsertLabourAttendance={bulkUpsertLabourAttendance}
              bulkUpsertEmpAttendance={bulkUpsertEmpAttendance}
              dispatch={dispatch}
              showSnackbar={(args) => showSnackbar({ message: args.message, severity: args.severity as any })}
              payrollData={payrollData}
              payrollMonth={payrollMonth}
              setPayrollMonth={setPayrollMonth}
              payrollYear={payrollYear}
              setPayrollYear={setPayrollYear}
              setLabourOpen={setLabourOpen}
              setRemoveLabourId={setRemoveLabourId}
              setEmployeeOpen={setEmployeeOpen}
              setRemoveEmployeeId={setRemoveEmployeeId}
              setGenSalaryEmp={setGenSalaryEmp}
              setGenBasicSalary={setGenBasicSalary}
              setGenBonus={setGenBonus}
              setGenDeductions={setGenDeductions}
              setGenDaysPresent={setGenDaysPresent}
              setGenTotalDays={setGenTotalDays}
              setGenRemarks={setGenRemarks}
              fetchEmpAttendance={fetchEmpAttendance}
              setPayDialogSalary={setPayDialogSalary}
              setPaidDate={setPaidDate}
              setDeleteSalaryInfo={setDeleteSalaryInfo}
              today={today}
            />
          )}

          {/* ── Invoices ── */}
          {tab === 6 && <ProjectInvoicesTab invoicesData={invoicesData} navigate={navigate} projectId={id ?? ''} />}

          {/* ── Purchase Orders ── */}
          {tab === 7 && <ProjectPurchaseOrdersTab posData={posData} navigate={navigate} />}

          {/* ── P&L / Reports ── */}
          {tab === 8 && (
            <ProjectPnLTab
              project={project}
              pnlData={pnlData}
              pnlMonth={pnlMonth}
              pnlYear={pnlYear}
              setPnlMonth={setPnlMonth}
              setPnlYear={setPnlYear}
              budgetUsedPct={budgetUsedPct}
              remaining={remaining}
            />
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
                label="Tax"
                type="number"
                value={expTax}
                onChange={(e) => setExpTax(e.target.value)}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
                helperText={parseFloat(expAmount) > 0 && parseFloat(expTax) > 0 ? `Total: ${fmtAmount(parseFloat(expAmount) + parseFloat(expTax))}` : ''}
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
                label="Tax"
                type="number"
                value={incTax}
                onChange={(e) => setIncTax(e.target.value)}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
                helperText={parseFloat(incAmount) > 0 && parseFloat(incTax) > 0 ? `Net: ${fmtAmount(parseFloat(incAmount) - parseFloat(incTax))}` : ''}
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
                      <strong>{genPendingCount} advance{genPendingCount > 1 ? 's' : ''} ({fmtAmount(genPendingTotal)})</strong> will be automatically deducted.
                    </Alert>
                  )}
                  {genDaysPresent && basicNum > 0 && (
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Earned ({genDaysPresent}/{genTotalDays} days)</Typography>
                          <Typography variant="body2">{fmtAmount(earnedPreview)}</Typography>
                        </Stack>
                        {(parseFloat(genBonus) || 0) > 0 && (
                          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="success.main">+ Bonus</Typography>
                            <Typography variant="body2" color="success.main">{fmtAmount(parseFloat(genBonus))}</Typography>
                          </Stack>
                        )}
                        {genPendingTotal > 0 && (
                          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="error.main">− Advances</Typography>
                            <Typography variant="body2" color="error.main">{fmtAmount(genPendingTotal)}</Typography>
                          </Stack>
                        )}
                        {(parseFloat(genDeductions) || 0) > 0 && (
                          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="error.main">− Extra Deductions</Typography>
                            <Typography variant="body2" color="error.main">{fmtAmount(parseFloat(genDeductions))}</Typography>
                          </Stack>
                        )}
                        <Stack direction="row" sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Salary</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: netPreview < 0 ? 'error.main' : 'primary.main' }}>
                            {fmtAmount(netPreview)}
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
