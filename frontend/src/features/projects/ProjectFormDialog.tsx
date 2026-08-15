import { useEffect, useState, type FormEvent } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputAdornment, InputLabel, MenuItem,
  Select, Slider, Stack, TextField, Typography,
} from '@mui/material';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import { useCreateProjectMutation, useGetProjectQuery, useUpdateProjectMutation, useGetNextProjectCodeQuery } from './projectApi';
import { useGetCustomersQuery } from '../customers/customerApi';
import type { ProjectStatus } from '../../types/project.types';

const today = () => new Date().toISOString().split('T')[0];
const STATUSES: ProjectStatus[] = ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'];

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: string;
}

export default function ProjectFormDialog({ open, onClose, projectId }: ProjectFormDialogProps) {
  const isEdit = Boolean(projectId);
  const dispatch = useAppDispatch();

  const { data: existing, isLoading: loadingProject } = useGetProjectQuery(projectId ?? '', { skip: !projectId });
  const { data: nextCodeData, isLoading: isLoadingCode } = useGetNextProjectCodeQuery(undefined, { skip: isEdit, refetchOnMountOrArgChange: true });
  const { data: customersData } = useGetCustomersQuery({ pageSize: 100 } as Parameters<typeof useGetCustomersQuery>[0]);
  const [create, { isLoading: isCreating }] = useCreateProjectMutation();
  const [update, { isLoading: isUpdating }] = useUpdateProjectMutation();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('0');
  const [progress, setProgress] = useState(0);
  const [managerName, setManagerName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isEdit && nextCodeData?.code) {
      setCode(nextCodeData.code);
    }
  }, [nextCodeData, isEdit]);

  useEffect(() => {
    if (existing && isEdit) {
      setCode(existing.code ?? '');
      setName(existing.name);
      setStatus(existing.status);
      setClientId(existing.clientId ?? '');
      setStartDate(existing.startDate ?? today());
      setEndDate(existing.endDate ?? '');
      setBudget(existing.budget.toString());
      setProgress(existing.progress);
      setManagerName(existing.managerName ?? '');
      setSiteAddress(existing.siteAddress ?? '');
      setDescription(existing.description ?? '');
      setNotes(existing.notes ?? '');
    } else if (!isEdit) {
      setCode('');
      setName('');
      setStatus('Planning');
      setClientId('');
      setStartDate(today());
      setEndDate('');
      setBudget('0');
      setProgress(0);
      setManagerName('');
      setSiteAddress('');
      setDescription('');
      setNotes('');
    }
  }, [existing, isEdit, open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      code: code || undefined,
      name,
      status,
      clientId: clientId || undefined,
      startDate,
      endDate: endDate || undefined,
      budget: parseFloat(budget) || 0,
      progress,
      managerName: managerName || undefined,
      siteAddress: siteAddress || undefined,
      description: description || undefined,
      notes: notes || undefined,
    };
    try {
      if (isEdit && projectId) {
        await update({ id: projectId, data: payload }).unwrap();
        dispatch(showSnackbar({ message: 'Project updated', severity: 'success' }));
      } else {
        await create(payload).unwrap();
        dispatch(showSnackbar({ message: 'Project created', severity: 'success' }));
      }
      onClose();
    } catch (err) {
      const msg = (err as { data?: { message?: string } })?.data?.message;
      if (msg?.includes('Code already in use')) {
        dispatch(showSnackbar({ message: 'Code already in use. Please choose a different code.', severity: 'error' }));
      } else {
        dispatch(showSnackbar({ message: 'Failed to save project', severity: 'error' }));
      }
    }
  };

  const isBusy = isCreating || isUpdating;
  const customers = (customersData as any)?.items ?? (customersData as any)?.data ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
        <DialogContent dividers>
          {isEdit && loadingProject ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                fullWidth
                disabled={isLoadingCode}
                placeholder={isLoadingCode ? 'Generating...' : ''}
                slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
                helperText={isLoadingCode ? 'Fetching next code…' : 'Auto-generated. You may override it.'}
              />
              <TextField
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {customers.map((c: any) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}{c.companyName ? ` — ${c.companyName}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Stack>
              <TextField
                label="Budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment> } }}
              />
              <Box>
                <Typography gutterBottom>Progress: {progress}%</Typography>
                <Slider
                  value={progress}
                  onChange={(_, val) => setProgress(val as number)}
                  min={0}
                  max={100}
                  step={1}
                  valueLabelDisplay="auto"
                />
              </Box>
              <TextField
                label="Manager Name"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Site Address"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                fullWidth
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isBusy}>
            {isBusy ? <CircularProgress size={20} /> : isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
