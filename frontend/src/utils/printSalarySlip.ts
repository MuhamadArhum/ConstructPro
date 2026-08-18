import type { EmployeeDto, SalaryPaymentDto } from '../types/employee.types';

const fmtPKR = (n: number) => `PKR ${n.toLocaleString()}`;

export function printSalarySlip(employee: EmployeeDto, salary: SalaryPaymentDto): void {
  const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(
    new Date(salary.year, salary.month - 1),
  );

  const earningsRows = [
    `<tr><td>Basic Salary</td><td>${fmtPKR(salary.basicSalary)}</td></tr>`,
    salary.bonus > 0 ? `<tr><td>Bonus</td><td style="color:#2e7d32">${fmtPKR(salary.bonus)}</td></tr>` : '',
  ].join('');

  const deductionRows =
    salary.deductions > 0
      ? `<tr><td>Deductions</td><td style="color:#c62828">${fmtPKR(salary.deductions)}</td></tr>`
      : '<tr><td colspan="2" style="color:#999;font-style:italic">No deductions</td></tr>';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Salary Slip - ${employee.fullName} - ${monthName} ${salary.year}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; font-size: 14px; }
    .header { text-align: center; border-bottom: 2px solid #1a3c5e; padding-bottom: 16px; margin-bottom: 24px; }
    .company { font-size: 22px; font-weight: bold; color: #1a3c5e; }
    .slip-title { font-size: 15px; color: #555; margin-top: 6px; letter-spacing: 1px; }
    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 12px; font-weight: bold; color: #1a3c5e;
      border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 8px; font-size: 13px; }
    .info-table td:first-child { color: #666; width: 40%; }
    .info-table td:last-child { font-weight: 500; }
    .earnings-table td, .deductions-table td { border: 1px solid #eee; }
    .earnings-table td:first-child, .deductions-table td:first-child { color: #444; width: 60%; }
    .earnings-table td:last-child, .deductions-table td:last-child { font-weight: 600; text-align: right; }
    .net-row { background: #1a3c5e; color: white !important; font-weight: bold; font-size: 15px; }
    .net-row td { padding: 10px 8px; color: white !important; border: none; }
    .net-row td:last-child { text-align: right; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">ConstructPro</div>
    <div class="slip-title">SALARY SLIP &mdash; ${monthName.toUpperCase()} ${salary.year}</div>
  </div>

  <div class="section">
    <div class="section-title">Employee Information</div>
    <table class="info-table">
      <tr><td>Employee Name</td><td>${employee.fullName}</td></tr>
      <tr><td>Employee Code</td><td>${employee.code ?? '—'}</td></tr>
      <tr><td>Designation</td><td>${employee.designation ?? '—'}</td></tr>
      <tr><td>Department</td><td>${employee.department ?? '—'}</td></tr>
      <tr><td>CNIC</td><td>${employee.cnic ?? '—'}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Earnings</div>
    <table class="earnings-table">
      ${earningsRows}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Deductions</div>
    <table class="deductions-table">
      ${deductionRows}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Attendance</div>
    <table class="info-table">
      <tr><td>Days Present</td><td>${salary.daysPresent} / ${salary.totalDays} days</td></tr>
    </table>
  </div>

  ${salary.remarks ? `<div class="section">
    <div class="section-title">Remarks</div>
    <p style="font-size:13px;color:#555">${salary.remarks}</p>
  </div>` : ''}

  <table>
    <tr class="net-row">
      <td>NET SALARY</td>
      <td>${fmtPKR(salary.netSalary)}</td>
    </tr>
  </table>

  <div class="footer">
    Generated on ${new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
    &nbsp;&bull;&nbsp; ConstructPro Payroll System
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    // Give the browser a moment to render before printing
    setTimeout(() => win.print(), 300);
  }
}
