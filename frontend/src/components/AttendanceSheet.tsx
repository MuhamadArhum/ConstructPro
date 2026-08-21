import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
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
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface AttendanceRecord {
  date: string;        // YYYY-MM-DD
  isPresent: boolean;
  overtimeHours: number;
  notes?: string;
}

interface AttendanceSaveRecord extends AttendanceRecord {
  workerId: string;
}

interface AttendanceSheetProps {
  workerId: string;
  workerName: string;
  dailyRate: number;
  overtimeRate?: number;
  showOvertimeHours?: boolean;
  month: number;
  year: number;
  existingRecords: AttendanceRecord[];
  onSave: (records: AttendanceSaveRecord[]) => Promise<void>;
  saving?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function AttendanceSheet({
  workerId,
  workerName,
  dailyRate,
  overtimeRate = 0,
  showOvertimeHours = false,
  month,
  year,
  existingRecords,
  onSave,
  saving = false,
}: AttendanceSheetProps) {
  const daysInMonth = new Date(year, month, 0).getDate();

  const buildInitialRows = () => {
    const map = new Map<string, AttendanceRecord>();
    existingRecords.forEach((r) => {
      const key = r.date.split('T')[0];
      map.set(key, { ...r, date: key });
    });
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return map.get(dateStr) ?? { date: dateStr, isPresent: false, overtimeHours: 0 };
    });
  };

  const [rows, setRows] = useState<AttendanceRecord[]>(buildInitialRows);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setRows(buildInitialRows());
    setDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, month, year, existingRecords.length]);

  const toggle = (idx: number) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], isPresent: !next[idx].isPresent };
      if (!next[idx].isPresent) next[idx] = { ...next[idx], overtimeHours: 0 };
      return next;
    });
    setDirty(true);
  };

  const setOT = (idx: number, val: string) => {
    const hours = Math.max(0, parseFloat(val) || 0);
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], overtimeHours: hours };
      return next;
    });
    setDirty(true);
  };

  const presentDays = rows.filter((r) => r.isPresent).length;
  const totalOT = rows.reduce((s, r) => s + r.overtimeHours, 0);
  const wagesEarned = presentDays * dailyRate;
  const otPay = totalOT * overtimeRate;
  const total = wagesEarned + otPay;

  const handleSave = async () => {
    const records: AttendanceSaveRecord[] = rows.map((r) => ({
      workerId,
      date: r.date,
      isPresent: r.isPresent,
      overtimeHours: r.overtimeHours,
    }));
    await onSave(records);
    setDirty(false);
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {workerName} — {MONTHS[month - 1]} {year}
        </Typography>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || !dirty}
          size="small"
        >
          Save Attendance
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ width: 40, fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ width: 90, fontWeight: 600 }}>Present</TableCell>
              {showOvertimeHours && (
                <TableCell sx={{ width: 100, fontWeight: 600 }}>OT Hrs</TableCell>
              )}
              <TableCell sx={{ width: 120, fontWeight: 600 }}>Daily Pay</TableCell>
              {showOvertimeHours && overtimeRate > 0 && (
                <TableCell sx={{ width: 120, fontWeight: 600 }}>OT Pay</TableCell>
              )}
              <TableCell sx={{ width: 130, fontWeight: 600 }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => {
              const date = new Date(row.date + 'T00:00:00');
              const dayName = DAY_NAMES[date.getDay()];
              const isWeekend = date.getDay() === 0;
              const dailyPay = row.isPresent ? dailyRate : 0;
              const otPay = row.isPresent ? row.overtimeHours * overtimeRate : 0;
              const rowTotal = dailyPay + otPay;

              return (
                <TableRow
                  key={row.date}
                  hover
                  sx={{
                    bgcolor: isWeekend ? 'grey.50' : undefined,
                    '&:hover': { bgcolor: isWeekend ? 'grey.100' : undefined },
                  }}
                >
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2">{dayName},</Typography>
                      <Typography variant="body2" sx={{ fontWeight: isWeekend ? 600 : undefined, color: isWeekend ? 'warning.dark' : undefined }}>
                        {String(idx + 1).padStart(2, '0')} {MONTHS[month - 1].slice(0, 3)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={row.isPresent ? 'Mark Absent' : 'Mark Present'}>
                      <Switch
                        checked={row.isPresent}
                        onChange={() => toggle(idx)}
                        size="small"
                        color="success"
                      />
                    </Tooltip>
                  </TableCell>
                  {showOvertimeHours && (
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={row.overtimeHours || ''}
                        onChange={(e) => setOT(idx, e.target.value)}
                        disabled={!row.isPresent}
                        slotProps={{ input: { inputProps: { min: 0, step: 0.5, style: { padding: '4px 6px', width: 60 } } } }}
                        variant="outlined"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    {row.isPresent ? (
                      <Typography variant="body2" sx={{ color: 'success.main' }}>{fmt(dailyPay)}</Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                    )}
                  </TableCell>
                  {showOvertimeHours && overtimeRate > 0 && (
                    <TableCell>
                      {otPay > 0 ? (
                        <Typography variant="body2" sx={{ color: 'info.main' }}>{fmt(otPay)}</Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: rowTotal > 0 ? 600 : undefined, color: rowTotal > 0 ? 'text.primary' : 'text.disabled' }}>
                      {rowTotal > 0 ? fmt(rowTotal) : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Month Summary */}
      <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'primary.50' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Monthly Summary</Typography>
        <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CheckCircleIcon fontSize="small" color="success" />
            <Typography variant="body2">
              <strong>{presentDays}</strong> / {daysInMonth} days present
            </Typography>
          </Stack>
          <Chip label={`Wages: ${fmt(wagesEarned)}`} size="small" color="success" variant="outlined" />
          {showOvertimeHours && overtimeRate > 0 && totalOT > 0 && (
            <Chip label={`OT (${totalOT}h): ${fmt(otPay)}`} size="small" color="info" variant="outlined" />
          )}
          <Chip label={`Total Payable: ${fmt(total)}`} size="small" color="primary" />
        </Stack>
      </Paper>
    </Box>
  );
}
