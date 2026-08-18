import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PaymentsIcon from '@mui/icons-material/Payments';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useGetEmployeeByIdQuery } from './employeesApi';
import { printSalarySlip } from '../../utils/printSalarySlip';
import type { EmployeeDto } from '../../types/employee.types';

const fmt = (n: number) => `PKR ${n.toLocaleString()}`;

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: employee, isLoading } = useGetEmployeeByIdQuery(id ?? '', { skip: !id });

  if (isLoading) return <Loader />;
  if (!employee) return (
    <Box>
      <Typography color="error">Employee not found.</Typography>
    </Box>
  );

  const latestSalary = employee.salaryPayments?.[0];

  return (
    <Box>
      <AppBreadcrumbs
        crumbs={[{ label: 'Employees', to: '/employees' }, { label: employee.fullName }]}
      />

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/employees')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1">{employee.fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {employee.designation ?? 'Employee'}{employee.department ? ` · ${employee.department}` : ''}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PaymentsIcon />}
          onClick={() => navigate(`/employees/${employee.id}/salary`)}
        >
          View Salary
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/employees/${employee.id}/edit`)}
        >
          Edit
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flex: 1 }}>Profile</Typography>
              <Chip
                label={employee.isActive ? 'Active' : 'Inactive'}
                color={employee.isActive ? 'success' : 'default'}
                size="small"
              />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <InfoRow label="Employee Code" value={<code style={{ fontFamily: 'monospace' }}>{employee.code ?? '—'}</code>} />
            <InfoRow label="Full Name" value={employee.fullName} />
            <InfoRow label="Designation" value={employee.designation} />
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Phone Number" value={employee.phoneNumber} />
            <InfoRow label="CNIC" value={employee.cnic} />
            <InfoRow label="Address" value={employee.address} />
            <InfoRow label="Basic Salary" value={fmt(employee.basicSalary)} />
            <InfoRow
              label="Join Date"
              value={new Date(employee.joinDate).toLocaleDateString('en-PK', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            />
          </Paper>
        </Grid>

        {/* Current Month Payroll */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Current Month Payroll</Typography>
            <Divider sx={{ mb: 2 }} />
            {latestSalary ? (
              <Box>
                <InfoRow
                  label="Period"
                  value={`${monthNames[latestSalary.month - 1]} ${latestSalary.year}`}
                />
                <InfoRow label="Net Salary" value={
                  <Typography component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {fmt(latestSalary.netSalary)}
                  </Typography>
                } />
                <InfoRow label="Days Present" value={`${latestSalary.daysPresent} / ${latestSalary.totalDays}`} />
                <InfoRow label="Bonus" value={
                  <Typography component="span" sx={{ color: latestSalary.bonus > 0 ? 'success.main' : 'text.primary' }}>
                    {fmt(latestSalary.bonus)}
                  </Typography>
                } />
                <InfoRow label="Deductions" value={
                  <Typography component="span" sx={{ color: latestSalary.deductions > 0 ? 'error.main' : 'text.primary' }}>
                    {fmt(latestSalary.deductions)}
                  </Typography>
                } />
                {latestSalary.remarks && <InfoRow label="Remarks" value={latestSalary.remarks} />}
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    startIcon={<PrintIcon />}
                    variant="outlined"
                    onClick={() => printSalarySlip(employee as EmployeeDto, latestSalary)}
                  >
                    Print Slip
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No salary processed yet.
              </Typography>
            )}
          </Paper>

          {/* Recent Salary History */}
          {(employee.salaryPayments?.length ?? 0) > 0 && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>Recent Salary History</Typography>
                <Button size="small" onClick={() => navigate(`/employees/${employee.id}/salary`)}>
                  View All
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month/Year</TableCell>
                      <TableCell align="right">Basic</TableCell>
                      <TableCell align="right">Bonus</TableCell>
                      <TableCell align="right">Deductions</TableCell>
                      <TableCell align="right">Net</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employee.salaryPayments?.map((sp) => (
                      <TableRow key={sp.id} hover>
                        <TableCell>{monthNames[sp.month - 1].slice(0, 3)} {sp.year}</TableCell>
                        <TableCell align="right">{fmt(sp.basicSalary)}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>{fmt(sp.bonus)}</TableCell>
                        <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(sp.deductions)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {fmt(sp.netSalary)}
                        </TableCell>
                        <TableCell>{sp.daysPresent}/{sp.totalDays}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Print Slip">
                            <IconButton size="small" onClick={() => printSalarySlip(employee as EmployeeDto, sp)}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Quick action card at the bottom */}
      <Card variant="outlined" sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa' }}>
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Quick Actions
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PaymentsIcon />}
              onClick={() => navigate(`/employees/${employee.id}/salary`)}
            >
              Process Salary
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              Edit Profile
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
