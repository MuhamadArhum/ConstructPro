import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
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
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useGetEmployeeByIdQuery, useGetSalaryHistoryQuery, useProcessSalaryMutation } from './employeesApi';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function SalaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const now = new Date();

  const [open, setOpen] = useState(false);
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [basicSalary, setBasicSalary] = useState('');
  const [bonus, setBonus] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [daysPresent, setDaysPresent] = useState('');
  const [totalDays, setTotalDays] = useState('30');
  const [remarks, setRemarks] = useState('');

  const { data: employee, isLoading: empLoading } = useGetEmployeeByIdQuery(id ?? '', { skip: !id });
  const { data: salaryHistory, isLoading: histLoading } = useGetSalaryHistoryQuery(id ?? '', { skip: !id });
  const [processSalary, { isLoading: processing }] = useProcessSalaryMutation();

  const handleOpen = () => {
    setBasicSalary(String(employee?.basicSalary ?? ''));
    setOpen(true);
  };

  const handleProcess = async () => {
    if (!id) return;
    try {
      await processSalary({
        id,
        data: {
          month: selMonth,
          year: selYear,
          basicSalary: parseFloat(basicSalary),
          bonus: parseFloat(bonus) || 0,
          deductions: parseFloat(deductions) || 0,
          daysPresent: parseInt(daysPresent),
          totalDays: parseInt(totalDays),
          remarks: remarks || undefined,
        },
      }).unwrap();
      dispatch(showSnackbar({ message: 'Salary processed successfully', severity: 'success' }));
      setOpen(false);
    } catch {
      dispatch(showSnackbar({ message: 'Failed to process salary', severity: 'error' }));
    }
  };

  if (empLoading) return <Loader />;

  return (
    <Box>
      <AppBreadcrumbs crumbs={[{ label: 'Employees', to: '/employees' }, { label: employee?.fullName ?? '…' }, { label: 'Salary' }]} />
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/employees')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{employee?.fullName} — Salary</Typography>
          <Typography variant="body2" color="text.secondary">
            {employee?.designation ?? 'Employee'} | Basic: {fmt(employee?.basicSalary ?? 0)}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Process Salary
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        {histLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Year</TableCell>
                <TableCell align="right">Basic</TableCell>
                <TableCell align="right">Bonus</TableCell>
                <TableCell align="right">Deductions</TableCell>
                <TableCell align="right">Net Salary</TableCell>
                <TableCell>Days Present</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Paid At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salaryHistory?.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{monthNames[row.month - 1]}</TableCell>
                  <TableCell>{row.year}</TableCell>
                  <TableCell align="right">{fmt(row.basicSalary)}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>{fmt(row.bonus)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(row.deductions)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {fmt(row.netSalary)}
                  </TableCell>
                  <TableCell>{row.daysPresent}/{row.totalDays}</TableCell>
                  <TableCell>{row.remarks ?? '-'}</TableCell>
                  <TableCell>{new Date(row.paidAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {!salaryHistory?.length && (
                <TableRow>
                  <TableCell colSpan={9} align="center">No salary records</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Salary</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select label="Month" value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}>
                  {monthNames.map((m, i) => (
                    <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Year"
                type="number"
                value={selYear}
                onChange={(e) => setSelYear(parseInt(e.target.value))}
                fullWidth
              />
            </Stack>

            <TextField
              label="Basic Salary"
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              required
              fullWidth
              slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Bonus"
                type="number"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
              />
              <TextField
                label="Deductions"
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Days Present"
                type="number"
                value={daysPresent}
                onChange={(e) => setDaysPresent(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Total Working Days"
                type="number"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                required
                fullWidth
              />
            </Stack>

            <TextField
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProcess}
            disabled={
              processing ||
              !daysPresent ||
              !basicSalary ||
              parseFloat(basicSalary) <= 0 ||
              parseInt(totalDays) <= 0 ||
              isNaN(parseInt(daysPresent))
            }
          >
            Process
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
