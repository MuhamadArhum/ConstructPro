import {
  Alert, Button, Chip, FormControl, IconButton, InputLabel, MenuItem,
  Paper, Select, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import EmptyState from '../../../components/common/EmptyState';
import AttendanceSheet from '../../../components/AttendanceSheet';
import { fmt, fmtDate } from './utils';

interface Props {
  project: any;
  hrSubTab: number;
  setHrSubTab: (v: number) => void;
  attSubTab: number;
  setAttSubTab: (v: number) => void;
  attMonth: number;
  setAttMonth: (v: number) => void;
  attYear: number;
  setAttYear: (v: number) => void;
  selectedAttLabourId: string;
  setSelectedAttLabourId: (v: string) => void;
  selectedAttEmployeeId: string;
  setSelectedAttEmployeeId: (v: string) => void;
  attLabourRecords: any[];
  attEmployeeRecords: any[];
  savingLabourAtt: boolean;
  savingEmpAtt: boolean;
  bulkUpsertLabourAttendance: (args: any) => Promise<any>;
  bulkUpsertEmpAttendance: (args: any) => Promise<any>;
  dispatch: (action: any) => void;
  showSnackbar: (args: { message: string; severity: string }) => any;
  payrollData: any;
  payrollMonth: number;
  setPayrollMonth: (v: number) => void;
  payrollYear: number;
  setPayrollYear: (v: number) => void;
  setLabourOpen: (v: boolean) => void;
  setRemoveLabourId: (v: string) => void;
  setEmployeeOpen: (v: boolean) => void;
  setRemoveEmployeeId: (v: string) => void;
  setGenSalaryEmp: (v: { employeeId: string; fullName: string; basicSalary: number } | null) => void;
  setGenBasicSalary: (v: string) => void;
  setGenBonus: (v: string) => void;
  setGenDeductions: (v: string) => void;
  setGenDaysPresent: (v: string) => void;
  setGenTotalDays: (v: string) => void;
  setGenRemarks: (v: string) => void;
  fetchEmpAttendance: (args: any, preferCacheValue: boolean) => Promise<any>;
  setPayDialogSalary: (v: { employeeId: string; salaryId: string } | null) => void;
  setPaidDate: (v: string) => void;
  setDeleteSalaryInfo: (v: { employeeId: string; salaryId: string } | null) => void;
  today: () => string;
}

export default function ProjectHRTab({
  project,
  hrSubTab,
  setHrSubTab,
  attSubTab,
  setAttSubTab,
  attMonth,
  setAttMonth,
  attYear,
  setAttYear,
  selectedAttLabourId,
  setSelectedAttLabourId,
  selectedAttEmployeeId,
  setSelectedAttEmployeeId,
  attLabourRecords,
  attEmployeeRecords,
  savingLabourAtt,
  savingEmpAtt,
  bulkUpsertLabourAttendance,
  bulkUpsertEmpAttendance,
  dispatch,
  showSnackbar,
  payrollData,
  payrollMonth,
  setPayrollMonth,
  payrollYear,
  setPayrollYear,
  setLabourOpen,
  setRemoveLabourId,
  setEmployeeOpen,
  setRemoveEmployeeId,
  setGenSalaryEmp,
  setGenBasicSalary,
  setGenBonus,
  setGenDeductions,
  setGenDaysPresent,
  setGenTotalDays,
  setGenRemarks,
  fetchEmpAttendance,
  setPayDialogSalary,
  setPaidDate,
  setDeleteSalaryInfo,
  today,
}: Props) {
  const assignedLabours = project.labours ?? [];
  const assignedEmployees = project.employees ?? [];
  const selectedLabour = assignedLabours.find((l: any) => l.labour?.id === selectedAttLabourId)?.labour;
  const selectedEmployee = assignedEmployees.find((e: any) => e.employee?.id === selectedAttEmployeeId)?.employee;

  const MONTHS_LIST = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <>
      <Tabs value={hrSubTab} onChange={(_, v) => setHrSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Labour (${assignedLabours.length})`} />
        <Tab label={`Employees (${assignedEmployees.length})`} />
        <Tab label="Payroll" />
        <Tab label="Attendance" icon={<EventNoteIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {/* ── HR > Labour ── */}
      {hrSubTab === 0 && (
        <>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setLabourOpen(true)}>
              Assign Labour
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Trade</TableCell>
                  <TableCell align="right">Daily Wage</TableCell>
                  <TableCell>Assigned Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.labours?.map((pl: any) => (
                  <TableRow key={pl.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{pl.labour.name}</TableCell>
                    <TableCell>{pl.labour.trade ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(pl.labour.dailyWage)}</TableCell>
                    <TableCell>{fmtDate(pl.assignedAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => setRemoveLabourId(pl.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!project.labours?.length && (
                  <TableRow><TableCell colSpan={5}><EmptyState message="No labour assigned yet" actionLabel="Assign Labour" onAction={() => setLabourOpen(true)} /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ── HR > Employees ── */}
      {hrSubTab === 1 && (
        <>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setEmployeeOpen(true)}>
              Assign Employee
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell align="right">Basic Salary</TableCell>
                  <TableCell>Assigned Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.employees?.map((pe: any) => (
                  <TableRow key={pe.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{pe.employee.fullName}</TableCell>
                    <TableCell>{pe.employee.designation ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(pe.employee.basicSalary)}</TableCell>
                    <TableCell>{fmtDate(pe.assignedAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => setRemoveEmployeeId(pe.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!project.employees?.length && (
                  <TableRow><TableCell colSpan={5}><EmptyState message="No employees assigned yet" actionLabel="Assign Employee" onAction={() => setEmployeeOpen(true)} /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ── HR > Payroll ── */}
      {hrSubTab === 2 && (
        <>
          {/* Month/Year selector */}
          <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 1 }}>Payroll Month:</Typography>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Month</InputLabel>
              <Select label="Month" value={payrollMonth} onChange={(e) => setPayrollMonth(Number(e.target.value))}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select label="Year" value={payrollYear} onChange={(e) => setPayrollYear(Number(e.target.value))}>
                {[2023, 2024, 2025, 2026, 2027].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {/* ── Employee Salaries ── */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Employee Salaries</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell align="right">Basic Salary</TableCell>
                  <TableCell align="right">Net Salary</TableCell>
                  <TableCell align="center">Days</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Paid Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payrollData?.employees.map((emp: any) => (
                  <TableRow key={emp.employeeId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{emp.fullName}</TableCell>
                    <TableCell>{emp.designation ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(emp.basicSalary)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {emp.salary ? fmt(emp.salary.netSalary) : '—'}
                    </TableCell>
                    <TableCell align="center">
                      {emp.salary
                        ? `${emp.salary.daysPresent}/${emp.salary.totalDays}`
                        : emp.attendanceDaysPresent > 0
                          ? <Chip label={`${emp.attendanceDaysPresent} att.`} size="small" color="info" />
                          : '—'}
                    </TableCell>
                    <TableCell>
                      {emp.salary ? (
                        <Chip
                          label={emp.salary.status}
                          size="small"
                          color={emp.salary.status === 'Paid' ? 'success' : 'warning'}
                        />
                      ) : (
                        <Chip label="Not Generated" size="small" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      {emp.salary?.paidDate ? fmtDate(emp.salary.paidDate) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        {!emp.salary && (
                          <Tooltip title="Generate Salary">
                            <IconButton size="small" color="primary" onClick={async () => {
                              setGenSalaryEmp({ employeeId: emp.employeeId, fullName: emp.fullName, basicSalary: emp.basicSalary });
                              setGenBasicSalary(String(emp.basicSalary));
                              setGenBonus('0');
                              setGenDeductions('0');
                              setGenDaysPresent('');
                              setGenTotalDays('30');
                              setGenRemarks('');
                              const result = await fetchEmpAttendance({ id: emp.employeeId, month: payrollMonth, year: payrollYear }, false);
                              const present = (result.data ?? []).filter((r: any) => r.isPresent).length;
                              if (present > 0) setGenDaysPresent(String(present));
                            }}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {emp.salary?.status === 'Generated' && (
                          <Tooltip title="Mark as Paid">
                            <IconButton size="small" color="success" onClick={() => {
                              setPayDialogSalary({ employeeId: emp.employeeId, salaryId: emp.salary!.id });
                              setPaidDate(today());
                            }}>
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {emp.salary && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() =>
                              setDeleteSalaryInfo({ employeeId: emp.employeeId, salaryId: emp.salary!.id })
                            }>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!payrollData?.employees.length && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                      No employees assigned to this project
                    </TableCell>
                  </TableRow>
                )}
                {(payrollData?.employees.length ?? 0) > 0 && (
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total Employee Cost</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {fmt(payrollData?.employees.reduce((s: number, e: any) => s + (e.salary?.netSalary ?? 0), 0) ?? 0)}
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Labour Wages ── */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Labour Wages</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Trade</TableCell>
                  <TableCell align="right">Daily Wage</TableCell>
                  <TableCell align="center">Days Present</TableCell>
                  <TableCell align="right">Wages Earned</TableCell>
                  <TableCell align="right">OT Pay</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payrollData?.labours.map((lab: any) => (
                  <TableRow key={lab.labourId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{lab.name}</TableCell>
                    <TableCell>{lab.trade ?? '-'}</TableCell>
                    <TableCell align="right">{fmt(lab.dailyWage)}</TableCell>
                    <TableCell align="center">
                      <Chip label={lab.daysPresent} size="small" color={lab.daysPresent > 0 ? 'info' : 'default'} />
                    </TableCell>
                    <TableCell align="right">{fmt(lab.wagesEarned)}</TableCell>
                    <TableCell align="right">{lab.overtimePay > 0 ? fmt(lab.overtimePay) : '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>{fmt(lab.totalWages)}</TableCell>
                  </TableRow>
                ))}
                {!payrollData?.labours.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                      No labour assigned to this project
                    </TableCell>
                  </TableRow>
                )}
                {(payrollData?.labours.length ?? 0) > 0 && (
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell colSpan={6} sx={{ fontWeight: 700 }}>Total Labour Cost</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {fmt(payrollData?.labours.reduce((s: number, l: any) => s + l.totalWages, 0) ?? 0)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Grand Total */}
          {((payrollData?.employees.length ?? 0) > 0 || (payrollData?.labours.length ?? 0) > 0) && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2, borderColor: 'warning.main' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Grand Total Payroll Cost</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                  {fmt(
                    (payrollData?.employees.reduce((s: number, e: any) => s + (e.salary?.netSalary ?? 0), 0) ?? 0) +
                    (payrollData?.labours.reduce((s: number, l: any) => s + l.totalWages, 0) ?? 0)
                  )}
                </Typography>
              </Stack>
            </Paper>
          )}
        </>
      )}

      {/* ── HR > Attendance ── */}
      {hrSubTab === 3 && (
        <>
          {/* Month / Year Selector */}
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Attendance Month:</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select label="Month" value={attMonth} onChange={(e) => setAttMonth(Number(e.target.value))}>
                {MONTHS_LIST.map((m, i) => (
                  <MenuItem key={i} value={i + 1}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select label="Year" value={attYear} onChange={(e) => setAttYear(Number(e.target.value))}>
                {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {/* Sub-tabs: Labour | Employees */}
          <Tabs value={attSubTab} onChange={(_, v) => setAttSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={`Labour (${assignedLabours.length})`} />
            <Tab label={`Employees (${assignedEmployees.length})`} />
          </Tabs>

          {/* ── Labour Attendance ── */}
          {attSubTab === 0 && (
            <>
              {assignedLabours.length === 0 ? (
                <Alert severity="info">No labour assigned to this project. Assign labour from the Labour tab first.</Alert>
              ) : (
                <>
                  <FormControl size="small" sx={{ minWidth: 260, mb: 2 }}>
                    <InputLabel>Select Labour</InputLabel>
                    <Select
                      label="Select Labour"
                      value={selectedAttLabourId}
                      onChange={(e) => setSelectedAttLabourId(e.target.value)}
                    >
                      {assignedLabours.map((pl: any) => (
                        <MenuItem key={pl.labour?.id} value={pl.labour?.id ?? ''}>
                          {pl.labour?.name} {pl.labour?.trade ? `(${pl.labour.trade})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!selectedAttLabourId && (
                    <Alert severity="info">Select a labour worker above to view and mark attendance.</Alert>
                  )}

                  {selectedLabour && (
                    <AttendanceSheet
                      workerId={selectedLabour.id}
                      workerName={selectedLabour.name}
                      dailyRate={selectedLabour.dailyWage ?? 0}
                      overtimeRate={0}
                      showOvertimeHours
                      month={attMonth}
                      year={attYear}
                      existingRecords={attLabourRecords.map((r: any) => ({
                        date: r.date,
                        isPresent: r.isPresent,
                        overtimeHours: r.overtimeHours,
                      }))}
                      saving={savingLabourAtt}
                      onSave={async (records) => {
                        await bulkUpsertLabourAttendance({
                          records: records.map((r) => ({
                            labourId: r.workerId,
                            date: r.date,
                            isPresent: r.isPresent,
                            overtimeHours: r.overtimeHours,
                          })),
                        }).unwrap();
                        dispatch(showSnackbar({ message: 'Attendance saved', severity: 'success' }));
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* ── Employee Attendance ── */}
          {attSubTab === 1 && (
            <>
              {assignedEmployees.length === 0 ? (
                <Alert severity="info">No employees assigned to this project. Assign employees from the Employees tab first.</Alert>
              ) : (
                <>
                  <FormControl size="small" sx={{ minWidth: 260, mb: 2 }}>
                    <InputLabel>Select Employee</InputLabel>
                    <Select
                      label="Select Employee"
                      value={selectedAttEmployeeId}
                      onChange={(e) => setSelectedAttEmployeeId(e.target.value)}
                    >
                      {assignedEmployees.map((pe: any) => (
                        <MenuItem key={pe.employee?.id} value={pe.employee?.id ?? ''}>
                          {pe.employee?.fullName} {pe.employee?.designation ? `(${pe.employee.designation})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!selectedAttEmployeeId && (
                    <Alert severity="info">Select an employee above to view and mark attendance.</Alert>
                  )}

                  {selectedEmployee && (
                    <AttendanceSheet
                      workerId={selectedEmployee.id}
                      workerName={selectedEmployee.fullName}
                      dailyRate={(selectedEmployee.basicSalary ?? 0) / 30}
                      showOvertimeHours={false}
                      month={attMonth}
                      year={attYear}
                      existingRecords={attEmployeeRecords.map((r: any) => ({
                        date: r.date,
                        isPresent: r.isPresent,
                        overtimeHours: r.overtimeHours ?? 0,
                      }))}
                      saving={savingEmpAtt}
                      onSave={async (records) => {
                        await bulkUpsertEmpAttendance({
                          records: records.map((r) => ({
                            employeeId: r.workerId,
                            date: r.date,
                            isPresent: r.isPresent,
                            overtimeHours: r.overtimeHours,
                          })),
                        }).unwrap();
                        dispatch(showSnackbar({ message: 'Attendance saved', severity: 'success' }));
                      }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
