import { useState } from 'react';
import {
  Box,
  Button,
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
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import {
  useGetLabourByIdQuery,
  useGetLabourAttendanceQuery,
  useUpsertAttendanceMutation,
  useGetLabourAdvancesQuery,
  useAddLabourAdvanceMutation,
} from './labourApi';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

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

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [localPresent, setLocalPresent] = useState<Record<string, boolean>>({});
  const [localOT, setLocalOT] = useState<Record<string, string>>({});

  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advReason, setAdvReason] = useState('');

  const { data: labour, isLoading: labourLoading } = useGetLabourByIdQuery(id ?? '', { skip: !id });
  const { data: attendance, isLoading: attLoading } = useGetLabourAttendanceQuery(
    { id: id!, month, year },
    { skip: !id }
  );
  const { data: advances } = useGetLabourAdvancesQuery(id ?? '', { skip: !id });
  const [upsertAttendance, { isLoading: saving }] = useUpsertAttendanceMutation();
  const [addAdvance, { isLoading: addingAdv }] = useAddLabourAdvanceMutation();

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

  if (labourLoading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/labour')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h1">{labour?.name} — Attendance</Typography>
          <Typography variant="body2" color="text.secondary">
            {labour?.trade ?? 'Labour'} | Daily Wage: {fmt(labour?.dailyWage ?? 0)}
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 140 } }}>
          <InputLabel>Month</InputLabel>
          <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => (
              <MenuItem key={i} value={i + 1}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 100 } }}>
          <InputLabel>Year</InputLabel>
          <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Save Attendance
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        {attLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
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

      <Divider sx={{ mb: 3 }} />

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Advances</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setAdvanceOpen(true)}>
          Add Advance
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {advances?.map((adv) => (
              <TableRow key={adv.id} hover>
                <TableCell>{new Date(adv.date).toLocaleDateString()}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 600 }}>{fmt(adv.amount)}</TableCell>
                <TableCell>{adv.reason ?? '-'}</TableCell>
              </TableRow>
            ))}
            {!advances?.length && (
              <TableRow>
                <TableCell colSpan={3} align="center">No advances</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
