import {
  Button, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmptyState from '../../../components/common/EmptyState';
import { fmt, fmtDate } from './utils';

interface Expense {
  id: string;
  category: string;
  amount: number;
  tax: number;
  date: string;
  description?: string | null;
}

interface Props {
  project: any;
  totalExpenses: number;
  expCategoryNames: string[];
  openAddExpense: () => void;
  openEditExpense: (exp: Expense) => void;
  setDeleteExpId: (id: string) => void;
}

export default function ProjectExpensesTab({
  project,
  totalExpenses,
  expCategoryNames,
  openAddExpense,
  openEditExpense,
  setDeleteExpId,
}: Props) {
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">Total: <strong>{fmt(totalExpenses)}</strong></Typography>
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddExpense}>
          Add Expense
        </Button>
      </Stack>
      {/* Category breakdown */}
      {(project.expenses?.length ?? 0) > 0 && (() => {
        const byCategory = expCategoryNames.map((cat) => ({
          cat,
          total: project.expenses?.filter((e: Expense) => e.category === cat).reduce((s: number, e: Expense) => s + e.amount, 0) ?? 0,
        })).filter((r) => r.total > 0);
        return (
          <Stack direction="row" sx={{ flexWrap: 'wrap', mb: 2 }} spacing={1}>
            {byCategory.map(({ cat, total }) => (
              <Chip key={cat} label={`${cat}: ${fmt(total)}`} size="small" variant="outlined" />
            ))}
          </Stack>
        );
      })()}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Tax</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.expenses?.map((exp: Expense) => (
              <TableRow key={exp.id} hover>
                <TableCell>{fmtDate(exp.date)}</TableCell>
                <TableCell>{exp.category}</TableCell>
                <TableCell>{exp.description ?? '-'}</TableCell>
                <TableCell align="right">{fmt(exp.amount)}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main' }}>{exp.tax > 0 ? fmt(exp.tax) : '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(exp.amount + (exp.tax ?? 0))}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEditExpense(exp)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleteExpId(exp.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!project.expenses?.length && (
              <TableRow><TableCell colSpan={7}><EmptyState message="No expenses yet" actionLabel="Add Expense" onAction={openAddExpense} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
