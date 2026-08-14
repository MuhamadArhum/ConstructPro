import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
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
import { useCreateEmployeeMutation, useGetEmployeeByIdQuery, useUpdateEmployeeMutation, useGetNextEmployeeCodeQuery } from './employeesApi';

export default function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: isLoadingExisting } = useGetEmployeeByIdQuery(id ?? '', { skip: !isEdit });
  const { data: nextCodeData } = useGetNextEmployeeCodeQuery(undefined, { skip: isEdit });
  const [create, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [update, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing) {
      setCode(existing.code ?? '');
      setFullName(existing.fullName);
      setDesignation(existing.designation ?? '');
      setDepartment(existing.department ?? '');
      setPhoneNumber(existing.phoneNumber ?? '');
      setCnic(existing.cnic ?? '');
      setBasicSalary(String(existing.basicSalary));
      setJoinDate(existing.joinDate.split('T')[0]);
    }
  }, [existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!basicSalary || parseFloat(basicSalary) <= 0) {
      setError('Basic salary must be greater than zero.');
      return;
    }
    const payload = {
      code: code || undefined,
      fullName,
      designation: designation || undefined,
      department: department || undefined,
      phoneNumber: phoneNumber || undefined,
      cnic: cnic || undefined,
      address: address || undefined,
      basicSalary: parseFloat(basicSalary),
      joinDate,
    };
    try {
      if (isEdit && id) {
        await update({ id, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Employee updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Employee created', severity: 'success' }));
      }
      navigate('/employees');
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      if (msg?.includes('Code already in use')) {
        setError('Code already in use. Please choose a different code.');
      } else {
        setError('Failed to save employee record.');
      }
    }
  };

  if (isEdit && isLoadingExisting) return <Loader />;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h1" sx={{ mb: 3 }}>{isEdit ? 'Edit Employee' : 'Add Employee'}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
              helperText="Auto-generated. You may override it."
            />

            <TextField label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required fullWidth />
            <TextField label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} fullWidth />
            <TextField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} fullWidth />
            <TextField label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} fullWidth />
            <TextField label="CNIC" value={cnic} onChange={(e) => setCnic(e.target.value)} fullWidth placeholder="XXXXX-XXXXXXX-X" />
            <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth multiline rows={2} />

            <TextField
              label="Basic Salary"
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              required
              fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
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
              <Button onClick={() => navigate('/employees')}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={isCreating || isUpdating}>
                {isEdit ? 'Save Changes' : 'Add Employee'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
