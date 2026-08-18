import { useEffect, useState } from 'react';
import {
  Box,
  Button,
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
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import TableSkeleton from '../../components/common/TableSkeleton';
import { useGetLabourAttendanceByDateQuery, useBulkUpsertAttendanceMutation } from './labourApi';
import type { LabourAttendanceByDateItem } from '../../types/labour.types';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface LocalRecord {
  isPresent: boolean;
  overtimeHours: string;
  notes: string;
}

export default function BulkAttendancePage() {
  const dispatch = useAppDispatch();
  const [date, setDate] = useState(toDateString(new Date()));

  const { data: rows, isLoading } = useGetLabourAttendanceByDateQuery(date, { skip: !date });
  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertAttendanceMutation();

  // Local state keyed by labourId
  const [localState, setLocalState] = useState<Record<string, LocalRecord>>({});

  // Reset local state when date or rows change
  useEffect(() => {
    setLocalState({});
  }, [date]);

  const getRecord = (item: LabourAttendanceByDateItem): LocalRecord => {
    if (localState[item.labourId] !== undefined) return localState[item.labourId];
    return {
      isPresent: item.attendance?.isPresent ?? false,
      overtimeHours: String(item.attendance?.overtimeHours ?? 0),
      notes: item.attendance?.notes ?? '',
    };
  };

  const setField = (labourId: string, field: keyof LocalRecord, value: string | boolean) => {
    setLocalState((prev) => {
      const existing = prev[labourId] ?? {
        isPresent: false,
        overtimeHours: '0',
        notes: '',
      };
      return { ...prev, [labourId]: { ...existing, [field]: value } };
    });
  };

  const handleSaveAll = async () => {
    if (!rows || rows.length === 0) return;

    // Build records for ALL labourers (merge server data + local changes)
    const records = rows.map((item) => {
      const rec = getRecord(item);
      return {
        labourId: item.labourId,
        date,
        isPresent: rec.isPresent,
        overtimeHours: parseFloat(rec.overtimeHours) || 0,
        notes: rec.notes || undefined,
      };
    });

    // Only save rows that are present or have existing record (to avoid creating empty records)
    const toSave = records.filter((r) => r.isPresent || localState[r.labourId] !== undefined || rows.find(row => row.labourId === r.labourId)?.attendance !== null);

    if (toSave.length === 0) {
      dispatch(showSnackbar({ message: 'No changes to save', severity: 'info' }));
      return;
    }

    try {
      await bulkUpsert({ records: toSave }).unwrap();
      dispatch(showSnackbar({ message: `Attendance saved for ${toSave.length} workers`, severity: 'success' }));
      setLocalState({});
    } catch {
      dispatch(showSnackbar({ message: 'Failed to save attendance', severity: 'error' }));
    }
  };

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Labour', to: '/labour' }, { label: 'Bulk Attendance' }]} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
        <Typography variant="h1" sx={{ flex: 1 }}>Bulk Attendance</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            label="Date"
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveAll}
            disabled={saving || isLoading}
          >
            Save All
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Trade</TableCell>
              <TableCell align="right">Daily Wage</TableCell>
              <TableCell>Present</TableCell>
              <TableCell>OT Hours</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="right">Daily Pay</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={8} />
            ) : (
              <>
                {(rows ?? []).map((item) => {
                  const rec = getRecord(item);
                  const present = rec.isPresent;
                  const ot = parseFloat(rec.overtimeHours) || 0;
                  const dailyPay = present ? item.dailyWage + ot * item.overtimeRatePerHour : 0;

                  return (
                    <TableRow key={item.labourId} hover>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{item.labourCode ?? '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{item.labourName}</TableCell>
                      <TableCell>{item.trade ?? '—'}</TableCell>
                      <TableCell align="right">{fmt(item.dailyWage)}</TableCell>
                      <TableCell>
                        <Switch
                          size="small"
                          checked={present}
                          onChange={(e) => {
                            setField(item.labourId, 'isPresent', e.target.checked);
                            if (!e.target.checked) {
                              setField(item.labourId, 'overtimeHours', '0');
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 90 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={rec.overtimeHours}
                          onChange={(e) => setField(item.labourId, 'overtimeHours', e.target.value)}
                          disabled={!present}
                          sx={{ width: 75 }}
                          slotProps={{ input: { inputProps: { min: 0, step: 0.5 } } }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 160 }}>
                        <TextField
                          size="small"
                          value={rec.notes}
                          onChange={(e) => setField(item.labourId, 'notes', e.target.value)}
                          disabled={!present}
                          placeholder="Notes…"
                          sx={{ width: 140 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {present ? fmt(dailyPay) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!rows?.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No active labour records found.</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
