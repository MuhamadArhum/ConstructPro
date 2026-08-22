import {
  Button, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmptyState from '../../../components/common/EmptyState';
import { fmtDate, isOverdue } from './utils';

interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  isCompleted: boolean;
}

interface Props {
  project: any;
  openAddMilestone: () => void;
  openEditMilestone: (ms: Milestone) => void;
  handleToggleMilestone: (msId: string, current: boolean) => void;
  handleDeleteMilestone: (msId: string) => void;
}

export default function ProjectMilestonesTab({
  project,
  openAddMilestone,
  openEditMilestone,
  handleToggleMilestone,
  handleDeleteMilestone,
}: Props) {
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddMilestone}>
          Add Milestone
        </Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.milestones?.map((ms: Milestone) => {
              const overdue = !ms.isCompleted && isOverdue(ms.dueDate);
              return (
                <TableRow key={ms.id} hover sx={{ bgcolor: overdue ? 'error.50' : undefined }}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Stack direction="row" sx={{ alignItems: 'center' }} spacing={0.5}>
                      {overdue && <WarningAmberIcon fontSize="small" color="error" />}
                      <span>{ms.title}</span>
                    </Stack>
                  </TableCell>
                  <TableCell>{ms.description ?? '-'}</TableCell>
                  <TableCell sx={{ color: overdue ? 'error.main' : undefined, fontWeight: overdue ? 600 : undefined }}>
                    {fmtDate(ms.dueDate)}
                    {overdue && <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>Overdue</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ms.isCompleted ? 'Completed' : overdue ? 'Overdue' : 'Pending'}
                      color={ms.isCompleted ? 'success' : overdue ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={ms.isCompleted ? 'Mark Pending' : 'Mark Complete'}>
                      <IconButton size="small" onClick={() => handleToggleMilestone(ms.id, ms.isCompleted)}>
                        {ms.isCompleted ? <CheckCircleIcon fontSize="small" color="success" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditMilestone(ms)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteMilestone(ms.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {!project.milestones?.length && (
              <TableRow><TableCell colSpan={5}><EmptyState message="No milestones yet" actionLabel="Add Milestone" onAction={openAddMilestone} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
