import { useState, useRef } from 'react';
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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import {
  useGetLabourByIdQuery,
  useGetLabourAttendanceQuery,
  useUpsertAttendanceMutation,
  useGetLabourAdvancesQuery,
  useGetLabourPendingAdvancesQuery,
  useAddLabourAdvanceMutation,
  useDeleteLabourAdvanceMutation,
  useGetLabourLedgerQuery,
  useGetLabourWagePaymentsQuery,
  useSettleLabourWagesMutation,
  useMarkLabourWageAsPaidMutation,
  useDeleteLabourWagePaymentMutation,
} from './labourApi';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-GB');

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function LabourAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const slipRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const [tab, setTab] = useState(0);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [localPresent, setLocalPresent] = useState<Record<string, boolean>>({});
  const [localOT, setLocalOT] = useState<Record<string, string>>({});

  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advReason, setAdvReason] = useState('');
  const [deleteAdvId, setDeleteAdvId] = useState<string | null>(null);
  const [slipOpen, setSlipOpen] = useState(false);

  // Wage settlement state
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleRemarks, setSettleRemarks] = useState('');
  const [payWageId, setPayWageId] = useState<string | null>(null);
  const [payWageDate, setPayWageDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteWageId, setDeleteWageId] = useState<string | null>(null);

  const { data: labour, isLoading: labourLoading } = useGetLabourByIdQuery(id ?? '', { skip: !id });
  const { data: attendance, isLoading: attLoading } = useGetLabourAttendanceQuery(
    { id: id!, month, year },
    { skip: !id }
  );
  const { data: advances, isLoading: advLoading } = useGetLabourAdvancesQuery(id ?? '', { skip: !id });
  const { data: pendingData } = useGetLabourPendingAdvancesQuery(id ?? '', { skip: !id });
  const { data: ledger } = useGetLabourLedgerQuery({ id: id!, month, year }, { skip: !id });
  const { data: wagePayments = [] } = useGetLabourWagePaymentsQuery(id ?? '', { skip: !id });
  const [upsertAttendance, { isLoading: saving }] = useUpsertAttendanceMutation();
  const [addAdvance, { isLoading: addingAdv }] = useAddLabourAdvanceMutation();
  const [deleteAdvance] = useDeleteLabourAdvanceMutation();
  const [settleWages, { isLoading: settling }] = useSettleLabourWagesMutation();
  const [markWageAsPaid, { isLoading: payingWage }] = useMarkLabourWageAsPaidMutation();
  const [deleteWagePayment] = useDeleteLabourWagePaymentMutation();

  const pendingTotal = pendingData?.total ?? 0;
  const pendingCount = pendingData?.advances.length ?? 0;

  const days = getDaysInMonth(year, month);

  const getAttForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance?.find((a) => a.date.startsWith(dateStr));
  };

  const isPresent = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (localPresent[dateStr] !== undefined) return localPresent[dateStr];
    return getAttForDay(day)?.isPresent ?? false;
  };

  const otHours = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (localOT[dateStr] !== undefined) return localOT[dateStr];
    return String(getAttForDay(day)?.overtimeHours ?? 0);
  };

  const handleSave = async () => {
    if (!id || !labour) return;
    const entries = Object.keys(localPresent);
    if (entries.length === 0) {
      dispatch(showSnackbar({ message: 'No changes to save', severity: 'info' }));
      return;
    }
    try {
      for (const dateStr of entries) {
        await upsertAttendance({
          labourId: id,
          date: dateStr,
          isPresent: localPresent[dateStr],
          overtimeHours: parseFloat(localOT[dateStr] ?? '0') || 0,
        }).unwrap();
      }
      setLocalPresent({});
      setLocalOT({});
      dispatch(showSnackbar({ message: 'Attendance saved', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save attendance', severity: 'error' }));
    }
  };

  const handleAddAdvance = async () => {
    if (!id) return;
    try {
      await addAdvance({ id, data: { amount: parseFloat(advAmount), date: advDate, reason: advReason || undefined } }).unwrap();
      dispatch(showSnackbar({ message: 'Advance added', severity: 'success' }));
      setAdvanceOpen(false);
      setAdvAmount('');
      setAdvReason('');
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
      const msg = err?.data?.message ?? 'Failed to delete advance';
      dispatch(showSnackbar({ message: msg, severity: 'error' }));
    }
    setDeleteAdvId(null);
  };

  const handlePrintSlip = () => {
    const printContent = slipRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Wage Slip</title><style>
        body { font-family: Arial, sans-serif; font-size: 13px; margin: 20px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
        th { background: #f0f0f0; }
        .header { text-align: center; margin-bottom: 16px; }
        .header h2 { margin: 0; font-size: 18px; }
        .header p { margin: 2px 0; color: #555; font-size: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; margin-bottom: 12px; }
        .info-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #ddd; }
        .info-label { color: #555; }
        .net { font-size: 15px; font-weight: bold; }
        .section-title { margin: 12px 0 4px; font-weight: bold; font-size: 13px; border-bottom: 2px solid #333; padding-bottom: 2px; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; }
        .sig-line { border-top: 1px solid #000; width: 160px; text-align: center; padding-top: 4px; font-size: 11px; }
        @media print { body { margin: 10px; } }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const summary = ledger?.summary;

  if (labourLoading) return <Loader />;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Labour', to: '/labour' }, { label: labour?.name ?? '…' }, { label: 'Attendance & Wages' }]} />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <Tooltip title="Back to Labour">
          <IconButton onClick={() => navigate('/labour')} aria-label="Back to Labour">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{labour?.name} — Attendance & Wages</Typography>
          <Typography variant="body2" color="text.secondary">
            {labour?.trade ?? 'Labour'} | Daily Wage: {fmt(labour?.dailyWage ?? 0)}
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} Pending Advance${pendingCount > 1 ? 's' : ''}: ${fmt(pendingTotal)}`}
                color="warning"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => setSlipOpen(true)}>
          Wage Slip
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Month</InputLabel>
          <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Save Attendance
        </Button>
      </Stack>

      {/* Month Summary */}
      {summary && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Days Present</Typography>
              <Typography variant="h6">{summary.presentDays}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Wages Earned</Typography>
              <Typography variant="h6" color="success.main">{fmt(summary.wagesEarned)}</Typography>
            </Box>
            {summary.overtimePay > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">OT Pay</Typography>
                <Typography variant="h6" color="info.main">{fmt(summary.overtimePay)}</Typography>
              </Box>
            )}
            {summary.totalAdvances > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Advance Deduction</Typography>
                <Typography variant="h6" color="error.main">-{fmt(summary.totalAdvances)}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Net Payable</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: summary.netPayable < 0 ? 'error.main' : 'primary.main' }}>
                {fmt(summary.netPayable)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Tabs */}
      <Paper variant="outlined">
        <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row">
            <Button
              variant={tab === 0 ? 'text' : 'text'}
              sx={{ borderBottom: tab === 0 ? 2 : 0, borderColor: 'primary.main', borderRadius: 0, mr: 2, pb: 1, color: tab === 0 ? 'primary.main' : 'text.secondary' }}
              onClick={() => setTab(0)}
            >
              Attendance
            </Button>
            <Button
              sx={{ borderBottom: tab === 1 ? 2 : 0, borderColor: 'primary.main', borderRadius: 0, mr: 2, pb: 1, color: tab === 1 ? 'primary.main' : 'text.secondary' }}
              onClick={() => setTab(1)}
            >
              Advances{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
            </Button>
            <Button
              sx={{ borderBottom: tab === 2 ? 2 : 0, borderColor: 'primary.main', borderRadius: 0, pb: 1, color: tab === 2 ? 'primary.main' : 'text.secondary' }}
              onClick={() => setTab(2)}
            >
              Wages
            </Button>
          </Stack>
          {tab === 1 && (
            <Button size="small" startIcon={<AddIcon />} onClick={() => setAdvanceOpen(true)}>
              Add Advance
            </Button>
          )}
          {tab === 2 && (
            <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => { setSettleRemarks(''); setSettleOpen(true); }}>
              Settle Wages
            </Button>
          )}
        </Stack>

        <Box sx={{ p: 2 }}>
          {/* Attendance Tab */}
          {tab === 0 && (
            <TableContainer>
              {attLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Present</TableCell>
                      <TableCell>OT Hours</TableCell>
                      <TableCell align="right">Daily Pay</TableCell>
                      <TableCell align="right">OT Pay</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
                      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const att = getAttForDay(day);
                      const present = isPresent(day);
                      const ot = parseFloat(otHours(day)) || 0;
                      const dailyPay = present ? (labour?.dailyWage ?? 0) : 0;
                      const otPay = att?.overtimePay ?? (present ? ot * (labour?.overtimeRatePerHour ?? 0) : 0);
                      const total = att?.totalPay ?? (dailyPay + otPay);
                      return (
                        <TableRow key={day} hover>
                          <TableCell>{day}</TableCell>
                          <TableCell>{new Date(dateStr).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short' })}</TableCell>
                          <TableCell>
                            <Switch
                              size="small"
                              checked={present}
                              onChange={(e) => setLocalPresent((prev) => ({ ...prev, [dateStr]: e.target.checked }))}
                            />
                          </TableCell>
                          <TableCell sx={{ width: 100 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={otHours(day)}
                              onChange={(e) => setLocalOT((prev) => ({ ...prev, [dateStr]: e.target.value }))}
                              disabled={!present}
                              sx={{ width: 80 }}
                              slotProps={{ input: { inputProps: { min: 0, step: 0.5 } } }}
                            />
                          </TableCell>
                          <TableCell align="right">{present ? fmt(dailyPay) : '-'}</TableCell>
                          <TableCell align="right">{ot > 0 ? fmt(otPay) : '-'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{present ? fmt(total) : '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          )}

          {/* Advances Tab */}
          {tab === 1 && (
            <>
              {pendingCount > 0 && (
                <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                  <strong>{pendingCount} pending advance{pendingCount > 1 ? 's' : ''} ({fmt(pendingTotal)})</strong> will be deducted from net payable.
                </Alert>
              )}
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
                            <Chip
                              label={adv.isDeducted ? 'Deducted' : 'Pending'}
                              color={adv.isDeducted ? 'default' : 'warning'}
                              size="small"
                            />
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
          {/* Wages Tab */}
          {tab === 2 && (
            <>
              {pendingCount > 0 && (
                <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                  <strong>{pendingCount} pending advance{pendingCount > 1 ? 's' : ''} ({fmt(pendingTotal)})</strong> will be automatically deducted when you settle wages.
                </Alert>
              )}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Days</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Wages</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">OT Pay</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Advances</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Net Payable</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Paid Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wagePayments.map((wp) => (
                      <TableRow key={wp.id} hover>
                        <TableCell>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][wp.month - 1]} {wp.year}</TableCell>
                        <TableCell align="right">{wp.daysPresent}</TableCell>
                        <TableCell align="right">{fmt(wp.wagesEarned)}</TableCell>
                        <TableCell align="right">{wp.overtimePay > 0 ? fmt(wp.overtimePay) : '—'}</TableCell>
                        <TableCell align="right" sx={{ color: wp.advanceDeductions > 0 ? 'error.main' : 'text.secondary' }}>
                          {wp.advanceDeductions > 0 ? `-${fmt(wp.advanceDeductions)}` : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{fmt(wp.netPayable)}</TableCell>
                        <TableCell>
                          <Chip label={wp.status} size="small" color={wp.status === 'Paid' ? 'success' : 'warning'} />
                        </TableCell>
                        <TableCell>{wp.paidDate ? fmtDate(wp.paidDate) : '—'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            {wp.status === 'Generated' && (
                              <Tooltip title="Mark as Paid">
                                <IconButton size="small" color="success" onClick={() => { setPayWageId(wp.id); setPayWageDate(new Date().toISOString().split('T')[0]); }}>
                                  <PrintIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => setDeleteWageId(wp.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {wagePayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9}>
                          <EmptyState message="No wage settlements yet" actionLabel="Settle Wages" onAction={() => { setSettleRemarks(''); setSettleOpen(true); }} />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Paper>

      {/* Add Advance Dialog */}
      <Dialog open={advanceOpen} onClose={() => setAdvanceOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Advance</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Amount"
              type="number"
              value={advAmount}
              onChange={(e) => setAdvAmount(e.target.value)}
              fullWidth
              required
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
            />
            <TextField
              label="Date"
              type="date"
              value={advDate}
              onChange={(e) => setAdvDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Reason"
              value={advReason}
              onChange={(e) => setAdvReason(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdvanceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddAdvance} disabled={!advAmount || addingAdv}>
            {addingAdv ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteAdvId)}
        title="Delete Advance"
        message="Are you sure you want to delete this advance?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteAdvance}
        onCancel={() => setDeleteAdvId(null)}
      />

      {/* Wage Slip Dialog */}
      <Dialog open={slipOpen} onClose={() => setSlipOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Wage Slip — {months[month - 1]} {year}
        </DialogTitle>
        <DialogContent dividers>
          <div ref={slipRef}>
            <div className="header" style={{ textAlign: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>WAGE SLIP</h2>
              <p style={{ margin: '4px 0', color: '#555', fontSize: 12 }}>
                {months[month - 1]} {year}
              </p>
              <Divider sx={{ my: 1 }} />
            </div>

            {/* Worker Info */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555', width: '40%' }}>Worker Name</td>
                  <td style={{ padding: '4px 0', fontWeight: 600 }}>{labour?.name}</td>
                  <td style={{ padding: '4px 0', color: '#555', width: '20%' }}>Code</td>
                  <td style={{ padding: '4px 0' }}>{labour?.code ?? '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555' }}>Trade</td>
                  <td style={{ padding: '4px 0' }}>{labour?.trade ?? '-'}</td>
                  <td style={{ padding: '4px 0', color: '#555' }}>Daily Wage</td>
                  <td style={{ padding: '4px 0' }}>{fmt(labour?.dailyWage ?? 0)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#555' }}>Phone</td>
                  <td style={{ padding: '4px 0' }}>{labour?.phoneNumber ?? '-'}</td>
                  <td style={{ padding: '4px 0', color: '#555' }}>OT Rate/hr</td>
                  <td style={{ padding: '4px 0' }}>{fmt(labour?.overtimeRatePerHour ?? 0)}</td>
                </tr>
              </tbody>
            </table>

            <Divider sx={{ my: 1.5 }} />

            {/* Earnings */}
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
                    Daily Wages ({summary?.presentDays ?? 0} days × {fmt(labour?.dailyWage ?? 0)})
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12 }}>
                    {fmt(summary?.wagesEarned ?? 0)}
                  </td>
                </tr>
                {(summary?.overtimePay ?? 0) > 0 && (
                  <tr>
                    <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontSize: 12 }}>
                      Overtime ({summary?.totalOvertimeHours ?? 0} hrs × {fmt(labour?.overtimeRatePerHour ?? 0)})
                    </td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12 }}>
                      {fmt(summary?.overtimePay ?? 0)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Deductions */}
            {(summary?.totalAdvances ?? 0) > 0 && (
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
                      <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontSize: 12 }}>Advance Recovery</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', border: '1px solid #ddd', fontSize: 12, color: '#d32f2f' }}>
                        -{fmt(summary?.totalAdvances ?? 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* Net Payable */}
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'primary.50', mt: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Net Payable</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: (summary?.netPayable ?? 0) < 0 ? 'error.main' : 'primary.main' }}>
                  {fmt(summary?.netPayable ?? 0)}
                </Typography>
              </Stack>
            </Paper>

            <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Divider sx={{ width: 150, mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary">Worker Signature</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Divider sx={{ width: 150, mb: 0.5 }} />
                <Typography variant="caption" color="text.secondary">Authorized Signature</Typography>
              </Box>
            </Stack>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlipOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrintSlip}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
      {/* Settle Wages Dialog */}
      <Dialog open={settleOpen} onClose={() => setSettleOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!id) return;
          try {
            await settleWages({ id, data: { month, year, remarks: settleRemarks || undefined } }).unwrap();
            dispatch(showSnackbar({ message: 'Wages settled successfully', severity: 'success' }));
            setSettleOpen(false);
            setTab(2);
          } catch (err: any) {
            dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed to settle wages', severity: 'error' }));
          }
        }}>
          <DialogTitle>Settle Wages — {months[month - 1]} {year}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {ledger && (
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Days Present</Typography>
                      <Typography variant="body2">{ledger.summary.presentDays}</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Wages Earned</Typography>
                      <Typography variant="body2">{fmt(ledger.summary.wagesEarned)}</Typography>
                    </Stack>
                    {ledger.summary.overtimePay > 0 && (
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="info.main">+ OT Pay</Typography>
                        <Typography variant="body2" color="info.main">{fmt(ledger.summary.overtimePay)}</Typography>
                      </Stack>
                    )}
                    {ledger.summary.totalAdvances > 0 && (
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="error.main">− Advances</Typography>
                        <Typography variant="body2" color="error.main">{fmt(ledger.summary.totalAdvances)}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 0.5, mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Payable</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: ledger.summary.netPayable < 0 ? 'error.main' : 'primary.main' }}>
                        {fmt(ledger.summary.netPayable)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              {pendingCount > 0 && (
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  <strong>{pendingCount} advance{pendingCount > 1 ? 's' : ''} ({fmt(pendingTotal)})</strong> will be marked as deducted.
                </Alert>
              )}
              <TextField label="Remarks" value={settleRemarks} onChange={(e) => setSettleRemarks(e.target.value)} fullWidth multiline rows={2} size="small" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettleOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={settling}>
              {settling ? <CircularProgress size={18} /> : 'Settle Wages'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Mark Wage as Paid Dialog */}
      <Dialog open={Boolean(payWageId)} onClose={() => setPayWageId(null)} maxWidth="xs" fullWidth>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!id || !payWageId) return;
          try {
            await markWageAsPaid({ id, paymentId: payWageId, data: { paidDate: payWageDate } }).unwrap();
            dispatch(showSnackbar({ message: 'Wages marked as paid', severity: 'success' }));
            setPayWageId(null);
          } catch (err: any) {
            dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
          }
        }}>
          <DialogTitle>Mark Wages as Paid</DialogTitle>
          <DialogContent dividers>
            <TextField label="Payment Date" type="date" value={payWageDate} onChange={e => setPayWageDate(e.target.value)}
              fullWidth required slotProps={{ inputLabel: { shrink: true } }} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayWageId(null)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={payingWage}>
              {payingWage ? <CircularProgress size={18} /> : 'Mark as Paid'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteWageId)}
        title="Delete Wage Settlement"
        message="This will delete the wage settlement. If it was Generated (not Paid), pending advances will be restored."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!id || !deleteWageId) return;
          try {
            await deleteWagePayment({ id, paymentId: deleteWageId }).unwrap();
            dispatch(showSnackbar({ message: 'Wage settlement deleted', severity: 'success' }));
          } catch {
            dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' }));
          }
          setDeleteWageId(null);
        }}
        onCancel={() => setDeleteWageId(null)}
      />
    </Box>
  );
}
