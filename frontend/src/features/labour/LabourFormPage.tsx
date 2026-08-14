import { useEffect, useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateLabourMutation, useGetLabourByIdQuery, useUpdateLabourMutation, useGetNextLabourCodeQuery } from './labourApi';

export default function LabourFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: isLoadingExisting } = useGetLabourByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData } = useGetNextLabourCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateLabourMutation();
  const [update, { isLoading: isUpdating }] = useUpdateLabourMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [trade, setTrade] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setName(existing.name);
      setPhoneNumber(existing.phoneNumber ?? '');
      setCnic(existing.cnic ?? '');
      setTrade(existing.trade ?? '');
      setDailyWage(String(existing.dailyWage));
      setOvertimeRatePerHour(String(existing.overtimeRatePerHour));
      setJoinDate(existing.joinDate.split('T')[0]);
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dailyWage || parseFloat(dailyWage) <= 0) {
      dispatch(showSnackbar({ message: 'Daily wage must be greater than zero.', severity: 'error' }));
      return;
    }
    const payload = {
      code: code || undefined,
      name,
      phoneNumber: phoneNumber || undefined,
      cnic: cnic || undefined,
      trade: trade || undefined,
      dailyWage: parseFloat(dailyWage),
      overtimeRatePerHour: parseFloat(overtimeRatePerHour),
      joinDate,
    };
    try {
      if (isEdit && id) {
        await update({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Labour updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Labour added', severity: 'success' }));
      }
      navigate('/labour');
    } catch (err) {
      const apiError = err as { data?: { message?: string } };
      const msg = apiError.data?.message;
      if (msg?.includes('Code already in use')) {
        dispatch(showSnackbar({ message: 'Code already in use. Please choose a different code.', severity: 'error' }));
      } else {
        dispatch(showSnackbar({ message: msg ?? (isEdit ? 'Failed to update labour record.' : 'Failed to create labour record.'), severity: 'error' }));
      }
    }
  };

  if (isEdit && isLoadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Labour' : 'Add Labour'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
              helperText="Auto-generated. You may override it."
            />

            <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label="Trade / Skill" value={trade} onChange={(e) => setTrade(e.target.value)} fullWidth />
            <TextField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth />
            <TextField label="CNIC" value={cnic} onChange={(e) => setCnic(e.target.value)} fullWidth placeholder="XXXXX-XXXXXXX-X" />

            <TextField
              label="Daily Wage"
              type="number"
              value={dailyWage}
              onChange={(e) => setDailyWage(e.target.value)}
              required
              fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> }, htmlInput: { min: 0 } }}
            />

            <TextField
              label="Overtime Rate per Hour"
              type="number"
              value={overtimeRatePerHour}
              onChange={(e) => setOvertimeRatePerHour(e.target.value)}
              required
              fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> }, htmlInput: { min: 0 } }}
            />

            <TextField
              label="Join Date"
              type="date"
              value={joinDate}
              onChange={(e) => setJoinDate(e.target.value)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/labour')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {isEdit ? 'Save Changes' : 'Add Labour'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
