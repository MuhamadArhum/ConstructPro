import {
  Button, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmptyState from '../../../components/common/EmptyState';
import { fmt, fmtDate } from './utils';

interface Props {
  project: any;
  totalIncome: number;
  incCategoryNames: string[];
  openAddIncome: () => void;
  openEditIncome: (inc: any) => void;
  setDeleteIncId: (id: string) => void;
}

export default function ProjectIncomeTab({
  project,
  totalIncome,
  incCategoryNames,
  openAddIncome,
  openEditIncome,
  setDeleteIncId,
}: Props) {
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2">Total: <strong>{fmt(totalIncome)}</strong></Typography>
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddIncome}>
          Add Income
        </Button>
      </Stack>
      {/* Category breakdown */}
      {((project as any).incomes?.length ?? 0) > 0 && (() => {
        const byCategory = incCategoryNames.map((cat) => ({
          cat,
          total: (project as any).incomes?.filter((i: any) => i.category === cat).reduce((s: number, i: any) => s + i.amount, 0) ?? 0,
        })).filter((r) => r.total > 0);
        return (
          <Stack direction="row" sx={{ flexWrap: 'wrap', mb: 2 }} spacing={1}>
            {byCategory.map(({ cat, total }) => (
              <Chip key={cat} label={`${cat}: ${fmt(total)}`} size="small" variant="outlined" color="success" />
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
              <TableCell>Source</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Tax</TableCell>
              <TableCell align="right">Net</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {((project as any).incomes ?? []).map((inc: any) => (
              <TableRow key={inc.id} hover>
                <TableCell>{fmtDate(inc.date)}</TableCell>
                <TableCell>{inc.category}</TableCell>
                <TableCell>{inc.source ?? '-'}</TableCell>
                <TableCell>{inc.description ?? '-'}</TableCell>
                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{fmt(inc.amount)}</TableCell>
                <TableCell align="right" sx={{ color: 'warning.main' }}>{(inc.tax ?? 0) > 0 ? fmt(inc.tax) : '-'}</TableCell>
                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>{fmt(inc.amount - (inc.tax ?? 0))}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEditIncome(inc)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleteIncId(inc.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!((project as any).incomes?.length) && (
              <TableRow><TableCell colSpan={8}><EmptyState message="No income recorded yet" actionLabel="Add Income" onAction={openAddIncome} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
