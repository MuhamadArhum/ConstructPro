import { useState, useRef, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import PaymentIcon from '@mui/icons-material/Payment';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import {
  useGetEmployeeByIdQuery,
  useGetSalaryHistoryQuery,
  useProcessSalaryMutation,
  useMarkSalaryAsPaidMutation,
  useUpdateSalaryMutation,
  useDeleteSalaryMutation,
  useGetAdvancesQuery,
  useAddAdvanceMutation,
  useDeleteAdvanceMutation,
  useGetPendingAdvancesQuery,
  useLazyGetEmployeeAttendanceQuery,
} from './employeesApi';
import type { SalaryPaymentDto } from '../../types/employee.types';
import { fmtAmount } from '../../utils/formatNumber';

const fmt = fmtAmount;
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-GB');
const today = () => new Date().toISOString().split('T')[0];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SalaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const now = new Date();
  const slipRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState(0);

  // Generate salary dialog
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [basicSalary, setBasicSalary] = useState('');
  const [bonus, setBonus] = useState('0');
  const [manualDeductions, setManualDeductions] = useState('0');
  const [daysPresent, setDaysPresent] = useState('');
  const [totalDays, setTotalDays] = useState('30');
  const [remarks, setRemarks] = useState('');

  // Edit salary dialog
  const [editSalary, setEditSalary] = useState<SalaryPaymentDto | null>(null);
  const [editBasic, setEditBasic] = useState('');
  const [editBonus, setEditBonus] = useState('');
  const [editDeductions, setEditDeductions] = useState('');
  const [editDaysPresent, setEditDaysPresent] = useState('');
  const [editTotalDays, setEditTotalDays] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  // Mark as paid dialog
  const [paySlip, setPaySlip] = useState<SalaryPaymentDto | null>(null);
  const [paidDate, setPaidDate] = useState(today());

  // Delete salary
  const [deleteSalaryId, setDeleteSalaryId] = useState<string | null>(null);

  // Advance state
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(today());
  const [advReason, setAdvReason] = useState('');
  const [deleteAdvId, setDeleteAdvId] = useState<string | null>(null);

  // Slip
  const [selectedSlip, setSelectedSlip] = useState<SalaryPaymentDto | null>(null);

  const { data: employee, isLoading: empLoading } = useGetEmployeeByIdQuery(id ?? '', { skip: !id });
  const { data: salaryHistory, isLoading: histLoading } = useGetSalaryHistoryQuery(id ?? '', { skip: !id });
  const { data: advances, isLoading: advLoading } = useGetAdvancesQuery(id ?? '', { skip: !id });
  const { data: pendingData } = useGetPendingAdvancesQuery(id ?? '', { skip: !id });

  const [processSalary, { isLoading: processing }] = useProcessSalaryMutation();
  const [markAsPaid, { isLoading: paying }] = useMarkSalaryAsPaidMutation();
  const [updateSalary, { isLoading: updating }] = useUpdateSalaryMutation();
  const [deleteSalary] = useDeleteSalaryMutation();
  const [addAdvance, { isLoading: addingAdv }] = useAddAdvanceMutation();
  const [deleteAdvance] = useDeleteAdvanceMutation();

  const pendingTotal = pendingData?.total ?? 0;
  const pendingCount = pendingData?.advances.length ?? 0;

  const [fetchAttendance] = useLazyGetEmployeeAttendanceQuery();

  const handleOpenGenerate = async () => {
    setBasicSalary(String(employee?.basicSalary ?? ''));
    setBonus('0'); setManualDeductions('0');
    setDaysPresent(''); setTotalDays('30'); setRemarks('');
    setSalaryOpen(true);
    if (id) {
      const result = await fetchAttendance({ id, month: selMonth, year: selYear }, false);
      const present = (result.data ?? []).filter((r: any) => r.isPresent).length;
      if (present > 0) setDaysPresent(String(present));
    }
  };

  const handleGenerate = async () => {
    if (!id) return;
    try {
      await processSalary({
        id,
        data: {
          month: selMonth, year: selYear,
          basicSalary: parseFloat(basicSalary),
          bonus: parseFloat(bonus) || 0,
          deductions: parseFloat(manualDeductions) || 0,
          daysPresent: parseInt(daysPresent),
          totalDays: parseInt(totalDays),
          remarks: remarks || undefined,
        },
      }).unwrap();
      dispatch(showSnackbar({ message: 'Salary generated successfully', severity: 'success' }));
      setSalaryOpen(false);
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed to generate salary', severity: 'error' }));
    }
  };

  const handleOpenEdit = (row: SalaryPaymentDto) => {
    setEditSalary(row);
    setEditBasic(String(row.basicSalary));
    setEditBonus(String(row.bonus));
    setEditDeductions(String(row.manualDeductions ?? row.deductions));
    setEditDaysPresent(String(row.daysPresent));
    setEditTotalDays(String(row.totalDays));
    setEditRemarks(row.remarks ?? '');
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !editSalary) return;
    try {
      await updateSalary({
        id,
        salaryId: editSalary.id,
        data: {
          basicSalary: parseFloat(editBasic),
          bonus: parseFloat(editBonus) || 0,
          deductions: parseFloat(editDeductions) || 0,
          daysPresent: parseInt(editDaysPresent),
          totalDays: parseInt(editTotalDays),
          remarks: editRemarks || undefined,
        },
      }).unwrap();
      dispatch(showSnackbar({ message: 'Salary updated', severity: 'success' }));
      setEditSalary(null);
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed to update salary', severity: 'error' }));
    }
  };

  const handleMarkPaid = async () => {
    if (!id || !paySlip) return;
    try {
      await markAsPaid({ id, salaryId: paySlip.id, data: { paidDate } }).unwrap();
      dispatch(showSnackbar({ message: 'Salary marked as paid', severity: 'success' }));
      setPaySlip(null);
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed to mark as paid', severity: 'error' }));
    }
  };

  const handleDeleteSalary = async () => {
    if (!id || !deleteSalaryId) return;
    try {
      await deleteSalary({ id, salaryId: deleteSalaryId }).unwrap();
      dispatch(showSnackbar({ message: 'Salary record deleted', severity: 'success' }));
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed to delete salary', severity: 'error' }));
    }
    setDeleteSalaryId(null);
  };

  const handleAddAdvance = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await addAdvance({ id, data: { amount: parseFloat(advAmount), date: advDate, reason: advReason || undefined } }).unwrap();
      dispatch(showSnackbar({ message: 'Advance added', severity: 'success' }));
      setAdvanceOpen(false);
      setAdvAmount(''); setAdvDate(today()); setAdvReason('');
    } catch {
      dispatch(showSnackbar({ message: 'Failed to add advance', severity: 'error' }));
    }
  };

  const handleDeleteAdvance = async () => {
    if (!id || !deleteAdvId) return;
    try {
      await deleteAdvance({ id, advanceId: deleteAdvId }).unwrap();
      dispatch(showSnackbar({ message: 'Advance deleted', severity: 'success' }));
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed to delete advance', severity: 'error' }));
    }
    setDeleteAdvId(null);
  };

  const handlePrintSlip = () => {
    const content = slipRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`<html><head><title>Salary Slip</title><style>
      body{font-family:Arial,sans-serif;font-size:13px;margin:20px;color:#000}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}
      th{background:#f0f0f0}
      @media print{body{margin:10px}}
    </style></head><body>${content.innerHTML}</body></html>`);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  // Salary dialog preview
  const earnedPreview = (() => {
    const bs = parseFloat(basicSalary) || 0;
    const td = parseInt(totalDays) || 30;
    const dp = parseInt(daysPresent) || 0;
    return td > 0 ? (bs / td) * dp : 0;
  })();
  const netPreview = earnedPreview + (parseFloat(bonus) || 0) - pendingTotal - (parseFloat(manualDeductions) || 0);

  // Edit dialog preview
  const editEarned = (() => {
    const bs = parseFloat(editBasic) || 0;
    const td = parseInt(editTotalDays) || 30;
    const dp = parseInt(editDaysPresent) || 0;
    return td > 0 ? (bs / td) * dp : 0;
  })();
  const editAdvanceDeductions = editSalary?.advanceDeductions ?? 0;
  const editNet = editEarned + (parseFloat(editBonus) || 0) - editAdvanceDeductions - (parseFloat(editDeductions) || 0);

  if (empLoading) return <Loader />;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Employees', to: '/employees' }, { label: employee?.fullName ?? '…' }, { label: 'Salary & Advances' }]} />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/employees')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{employee?.fullName} — Salary & Advances</Typography>
          <Typography variant="body2" color="text.secondary">
            {employee?.designation ?? 'Employee'} | Basic: {fmt(employee?.basicSalary ?? 0)}
            {pendingCount > 0 && (
              <Chip label={`${pendingCount} Pending Advance${pendingCount > 1 ? 's' : ''}: ${fmt(pendingTotal)}`} color="warning" size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenGenerate}>
          Generate Salary
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Salary History" />
          <Tab label={`Advances${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}`} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* ── Salary History ── */}
          {tab === 0 && (
            <TableContainer>
              {histLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month / Year</TableCell>
                      <TableCell align="right">Basic Rate</TableCell>
                      <TableCell align="right">Bonus</TableCell>
                      <TableCell align="right">Deductions</TableCell>
                      <TableCell align="right">Net Salary</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Generated Date</TableCell>
                      <TableCell>Paid Date</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salaryHistory?.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{monthNames[row.month - 1]} {row.year}</TableCell>
                        <TableCell align="right">{fmt(row.basicSalary)}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>{fmt(row.bonus)}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(row.deductions)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(row.netSalary)}</TableCell>
                        <TableCell>{row.daysPresent}/{row.totalDays}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            color={row.status === 'Paid' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{fmtDate(row.generatedAt)}</TableCell>
                        <TableCell>{row.paidDate ? fmtDate(row.paidDate) : <Typography variant="caption" color="text.disabled">Not paid</Typography>}</TableCell>
                        <TableCell>{row.remarks ?? '-'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            {row.status === 'Generated' && (
                              <Tooltip title="Mark as Paid">
                                <IconButton size="small" color="success" onClick={() => { setPaySlip(row); setPaidDate(today()); }}>
                                  <PaymentIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Edit">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Print Slip">
                              <IconButton size="small" onClick={() => setSelectedSlip(row)}>
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => setDeleteSalaryId(row.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!salaryHistory?.length && (
                      <TableRow>
                        <TableCell colSpan={11}>
                          <EmptyState message="No salary records yet" actionLabel="Generate Salary" onAction={handleOpenGenerate} />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          )}

          {/* ── Advances ── */}
          {tab === 1 && (
            <>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {pendingCount > 0 && (
                  <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                    Pending: {fmt(pendingTotal)} (will be auto-deducted on next salary)
                  </Typography>
                )}
                <Box sx={{ flex: 1 }} />
                <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setAdvanceOpen(true)}>
                  Add Advance
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                {advLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Deducted At</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {advances?.map((adv) => (
                        <TableRow key={adv.id} hover>
                          <TableCell>{fmtDate(adv.date)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(adv.amount)}</TableCell>
                          <TableCell>{adv.reason ?? '-'}</TableCell>
                          <TableCell>
                            <Chip label={adv.isDeducted ? 'Deducted' : 'Pending'} color={adv.isDeducted ? 'default' : 'warning'} size="small" />
                          </TableCell>
                          <TableCell>{adv.deductedAt ? fmtDate(adv.deductedAt) : '-'}</TableCell>
                          <TableCell align="right">
                            {!adv.isDeducted && (
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => setDeleteAdvId(adv.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!advances?.length && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <EmptyState message="No advances recorded" actionLabel="Add Advance" onAction={() => setAdvanceOpen(true)} />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TableContainer>
            </>
          )}
        </Box>
      </Paper>

      {/* ── Generate Salary Dialog ── */}
      <Dialog open={salaryOpen} onClose={() => setSalaryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Salary</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select label="Month" value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}>
                  {monthNames.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Year" type="number" value={selYear} onChange={(e) => setSelYear(parseInt(e.target.value))} fullWidth />
            </Stack>
            <TextField
              label="Basic Salary Rate" type="number" value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)} required fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
            />
            <Stack direction="row" spacing={2}>
              <TextField label="Days Present" type="number" value={daysPresent} onChange={(e) => setDaysPresent(e.target.value)} required fullWidth />
              <TextField label="Total Working Days" type="number" value={totalDays} onChange={(e) => setTotalDays(e.target.value)} required fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Bonus" type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              <TextField label="Extra Deductions" type="number" value={manualDeductions} onChange={(e) => setManualDeductions(e.target.value)} fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
            </Stack>
            {pendingCount > 0 && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                <strong>{pendingCount} advance{pendingCount > 1 ? 's' : ''} ({fmt(pendingTotal)})</strong> will be automatically deducted.
              </Alert>
            )}
            {daysPresent && basicSalary && (
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Earned ({daysPresent}/{totalDays} days)</Typography>
                    <Typography variant="body2">{fmt(Math.round(earnedPreview))}</Typography>
                  </Stack>
                  {parseFloat(bonus) > 0 && (
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main">+ Bonus</Typography>
                      <Typography variant="body2" color="success.main">{fmt(parseFloat(bonus))}</Typography>
                    </Stack>
                  )}
                  {pendingTotal > 0 && (
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="error.main">− Advances</Typography>
                      <Typography variant="body2" color="error.main">{fmt(pendingTotal)}</Typography>
                    </Stack>
                  )}
                  {parseFloat(manualDeductions) > 0 && (
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="error.main">− Extra Deductions</Typography>
                      <Typography variant="body2" color="error.main">{fmt(parseFloat(manualDeductions))}</Typography>
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
            <TextField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} fullWidth multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSalaryOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerate}
            disabled={processing || !daysPresent || !basicSalary || parseFloat(basicSalary) <= 0 || parseInt(totalDays) <= 0 || isNaN(parseInt(daysPresent))}>
            {processing ? <CircularProgress size={20} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Salary Dialog ── */}
      <Dialog open={Boolean(editSalary)} onClose={() => setEditSalary(null)} maxWidth="sm" fullWidth>
        <form onSubmit={handleEditSave}>
          <DialogTitle>
            Edit Salary — {editSalary ? `${monthNames[editSalary.month - 1]} ${editSalary.year}` : ''}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Basic Salary Rate" type="number" value={editBasic} onChange={(e) => setEditBasic(e.target.value)} required fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              <Stack direction="row" spacing={2}>
                <TextField label="Days Present" type="number" value={editDaysPresent} onChange={(e) => setEditDaysPresent(e.target.value)} required fullWidth />
                <TextField label="Total Days" type="number" value={editTotalDays} onChange={(e) => setEditTotalDays(e.target.value)} required fullWidth />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="Bonus" type="number" value={editBonus} onChange={(e) => setEditBonus(e.target.value)} fullWidth
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
                <TextField label="Extra Deductions" type="number" value={editDeductions} onChange={(e) => setEditDeductions(e.target.value)} fullWidth
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              </Stack>
              {editAdvanceDeductions > 0 && (
                <TextField label="Advance Deductions (locked)" value={fmt(editAdvanceDeductions)} fullWidth disabled size="small"
                  helperText="Advances were deducted when this salary was generated and cannot be changed here." />
              )}
              {editBasic && editDaysPresent && (
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Earned ({editDaysPresent}/{editTotalDays} days)</Typography>
                      <Typography variant="body2">{fmt(Math.round(editEarned))}</Typography>
                    </Stack>
                    {parseFloat(editBonus) > 0 && (
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="success.main">+ Bonus</Typography>
                        <Typography variant="body2" color="success.main">{fmt(parseFloat(editBonus))}</Typography>
                      </Stack>
                    )}
                    {editAdvanceDeductions > 0 && (
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="error.main">− Advances</Typography>
                        <Typography variant="body2" color="error.main">{fmt(editAdvanceDeductions)}</Typography>
                      </Stack>
                    )}
                    {parseFloat(editDeductions) > 0 && (
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="error.main">− Extra Deductions</Typography>
                        <Typography variant="body2" color="error.main">{fmt(parseFloat(editDeductions))}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Salary</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: editNet < 0 ? 'error.main' : 'primary.main' }}>
                        {fmt(Math.round(editNet))}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              <TextField label="Remarks" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} fullWidth multiline rows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSalary(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updating}>
              {updating ? <CircularProgress size={20} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Mark as Paid Dialog ── */}
      <Dialog open={Boolean(paySlip)} onClose={() => setPaySlip(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Mark as Paid</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {paySlip && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                {monthNames[paySlip.month - 1]} {paySlip.year} — Net: <strong>{fmt(paySlip.netSalary)}</strong>
              </Alert>
            )}
            <TextField
              label="Payment Date" type="date" value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              fullWidth required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaySlip(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleMarkPaid} disabled={paying || !paidDate}>
            {paying ? <CircularProgress size={20} /> : 'Confirm Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Advance Dialog ── */}
      <Dialog open={advanceOpen} onClose={() => setAdvanceOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddAdvance}>
          <DialogTitle>Add Advance</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Amount" type="number" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} required fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }} />
              <TextField label="Date" type="date" value={advDate} onChange={(e) => setAdvDate(e.target.value)} required fullWidth
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Reason" value={advReason} onChange={(e) => setAdvReason(e.target.value)} fullWidth multiline rows={2}
                placeholder="e.g. Medical emergency, Personal need..." />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdvanceOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingAdv || !advAmount || parseFloat(advAmount) <= 0}>
              {addingAdv ? <CircularProgress size={20} /> : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Salary Slip Dialog ── */}
      <Dialog open={Boolean(selectedSlip)} onClose={() => setSelectedSlip(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Salary Slip — {selectedSlip ? `${monthNames[selectedSlip.month - 1]} ${selectedSlip.year}` : ''}</DialogTitle>
        <DialogContent dividers>
          <div ref={slipRef}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>SALARY SLIP</h2>
              <p style={{ margin: '4px 0', color: '#555', fontSize: 12 }}>
                {selectedSlip ? `${monthNames[selectedSlip.month - 1]} ${selectedSlip.year}` : ''}
              </p>
            </div>
            <Divider sx={{ mb: 1.5 }} />
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555', width: '35%' }}>Employee Name</td>
                  <td style={{ padding: '4px 0', fontWeight: 600 }}>{employee?.fullName}</td>
                  <td style={{ padding: '4px 0', color: '#555', width: '20%' }}>Code</td>
                  <td style={{ padding: '4px 0' }}>{employee?.code ?? '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555' }}>Designation</td>
                  <td style={{ padding: '4px 0' }}>{employee?.designation ?? '-'}</td>
                  <td style={{ padding: '4px 0', color: '#555' }}>Department</td>
                  <td style={{ padding: '4px 0' }}>{employee?.department ?? '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555' }}>Generated Date</td>
                  <td style={{ padding: '4px 0' }}>{selectedSlip ? fmtDate(selectedSlip.generatedAt) : '-'}</td>
                  <td style={{ padding: '4px 0', color: '#555' }}>Paid Date</td>
                  <td style={{ padding: '4px 0' }}>{selectedSlip?.paidDate ? fmtDate(selectedSlip.paidDate) : 'Not Paid'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555' }}>Status</td>
                  <td style={{ padding: '4px 0', fontWeight: 600, color: selectedSlip?.status === 'Paid' ? '#2e7d32' : '#ed6c02' }}>
                    {selectedSlip?.status}
                  </td>
                  <td style={{ padding: '4px 0', color: '#555' }}>CNIC</td>
                  <td style={{ padding: '4px 0' }}>{employee?.cnic ?? '-'}</td>
                </tr>
              </tbody>
            </table>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Earnings</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #ddd', fontSize: 12 }}>Description</th>
                  <th style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontSize: 12 }}>
                    Basic Salary ({selectedSlip?.daysPresent}/{selectedSlip?.totalDays} days)
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12 }}>
                    {fmt(selectedSlip ? Math.round((selectedSlip.basicSalary / selectedSlip.totalDays) * selectedSlip.daysPresent) : 0)}
                  </td>
                </tr>
                {(selectedSlip?.bonus ?? 0) > 0 && (
                  <tr>
                    <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontSize: 12 }}>Bonus</td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12, color: '#2e7d32' }}>{fmt(selectedSlip?.bonus ?? 0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {(selectedSlip?.deductions ?? 0) > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Deductions</Typography>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '5px 8px', textAlign: 'left', border: '1px solid #ddd', fontSize: 12 }}>Description</th>
                      <th style={{ padding: '5px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontSize: 12 }}>Total Deductions (Advance + Other)</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12, color: '#d32f2f' }}>-{fmt(selectedSlip?.deductions ?? 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', mt: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Net Salary</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(selectedSlip?.netSalary ?? 0)}</Typography>
              </Stack>
            </Paper>
            {selectedSlip?.remarks && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Remarks: {selectedSlip.remarks}</Typography>
            )}
            <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Divider sx={{ width: 150, mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary">Employee Signature</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Divider sx={{ width: 150, mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary">Authorized Signature</Typography>
              </Box>
            </Stack>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSlip(null)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrintSlip}>Print</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteSalaryId)}
        title="Delete Salary Record"
        message="Are you sure? If this salary is in Generated status, its advance deductions will be reversed."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteSalary}
        onCancel={() => setDeleteSalaryId(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteAdvId)}
        title="Delete Advance"
        message="Are you sure you want to delete this advance?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteAdvance}
        onCancel={() => setDeleteAdvId(null)}
      />
    </Box>
  );
}
