import { useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, LinearProgress,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField,
  Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import TableSkeleton from '../../components/common/TableSkeleton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useGetProjectsQuery, useDeleteProjectMutation } from './projectApi';
import ProjectFormDialog from './ProjectFormDialog';
import type { ProjectStatus } from '../../types/project.types';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');

const STATUS_COLORS: Record<ProjectStatus, 'info' | 'success' | 'warning' | 'primary' | 'error'> = {
  Planning: 'info',
  Active: 'success',
  'On Hold': 'warning',
  Completed: 'primary',
  Cancelled: 'error',
};

const STATUSES: ProjectStatus[] = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];

export default function ProjectListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useGetProjectsQuery({
    page: page + 1,
    pageSize: rowsPerPage,
    search: search || undefined,
    status: status || undefined,
  });

  const [deleteProject] = useDeleteProjectMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject(deleteId).unwrap();
      dispatch(showSnackbar({ message: 'Project deleted', severity: 'success' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to delete project', severity: 'error' }));
    } finally {
      setDeleteId(null);
    }
  };

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h1">PROJECTS</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          New Project
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search by code / name"
            size="small"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0); } }}
            onBlur={() => { setSearch(searchInput); setPage(0); }}
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 250 } }}
          />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 160 } }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Site Address</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell align="right">Budget (PKR)</TableCell>
              <TableCell align="right">Spent (PKR)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Progress</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={11} />
            ) : (
              <>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.code ?? '-'}</TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, cursor: 'pointer', color: 'primary.main' }}
                      onClick={() => navigate(`/projects/${row.id}`)}
                    >
                      {row.name}
                    </TableCell>
                    <TableCell>{row.client ? (row.client.companyName ?? row.client.name) : '-'}</TableCell>
                    <TableCell>{row.siteAddress ?? '-'}</TableCell>
                    <TableCell>{fmtDate(row.startDate)}</TableCell>
                    <TableCell>{row.endDate ? fmtDate(row.endDate) : '-'}</TableCell>
                    <TableCell align="right">{fmt(row.budget)}</TableCell>
                    <TableCell align="right">{fmt(row.spent)}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={STATUS_COLORS[row.status] ?? 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={row.progress}
                          sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption">{row.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => navigate(`/projects/${row.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">No projects found</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      <ProjectFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
