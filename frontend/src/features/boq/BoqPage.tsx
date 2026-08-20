import { useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment,
  Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import ArticleIcon from '@mui/icons-material/Article';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { showSnackbar } from '../../app/snackbarSlice';
import Loader from '../../components/common/Loader';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { useGetProjectQuery } from '../projects/projectApi';
import {
  useGetBoqByProjectQuery,
  useCreateBoqMutation,
  useAddBoqSectionMutation,
  useUpdateBoqSectionMutation,
  useDeleteBoqSectionMutation,
  useAddBoqItemMutation,
  useUpdateBoqItemMutation,
  useDeleteBoqItemMutation,
} from './boqApi';
import type { BoqSectionDto, BoqItemDto } from '../../types/boq.types';

const fmt = (n: number) => `PKR ${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const COMMON_UNITS = ['Sft', 'Rft', 'Cft', 'Nos', 'Bags', 'Kg', 'Ton', 'Ltr', 'Mtr', 'Sqm', 'Cum'];

export default function BoqPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: project } = useGetProjectQuery(projectId ?? '', { skip: !projectId });
  const { data: boq, isLoading } = useGetBoqByProjectQuery(projectId ?? '', { skip: !projectId });

  const [createBoq, { isLoading: creating }] = useCreateBoqMutation();
  const [addSection, { isLoading: addingSection }] = useAddBoqSectionMutation();
  const [updateSection] = useUpdateBoqSectionMutation();
  const [deleteSection] = useDeleteBoqSectionMutation();
  const [addItem, { isLoading: addingItem }] = useAddBoqItemMutation();
  const [updateItem, { isLoading: updatingItem }] = useUpdateBoqItemMutation();
  const [deleteItem] = useDeleteBoqItemMutation();

  // Section dialog
  const [sectionOpen, setSectionOpen] = useState(false);
  const [editSection, setEditSection] = useState<BoqSectionDto | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  // Item dialog
  const [itemOpen, setItemOpen] = useState(false);
  const [itemSectionId, setItemSectionId] = useState('');
  const [editItem, setEditItem] = useState<BoqItemDto | null>(null);
  const [itemDesc, setItemDesc] = useState('');
  const [itemUnit, setItemUnit] = useState('Nos');
  const [itemQty, setItemQty] = useState('');
  const [itemRate, setItemRate] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemProjectId] = useState(projectId ?? '');

  const openAddSection = () => { setEditSection(null); setSectionTitle(''); setSectionOpen(true); };
  const openEditSection = (s: BoqSectionDto) => { setEditSection(s); setSectionTitle(s.title); setSectionOpen(true); };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !sectionTitle.trim()) return;
    try {
      if (editSection) {
        await updateSection({ sectionId: editSection.id, projectId, data: { title: sectionTitle } }).unwrap();
        dispatch(showSnackbar({ message: 'Section updated', severity: 'success' }));
      } else {
        await addSection({ projectId, data: { title: sectionTitle } }).unwrap();
        dispatch(showSnackbar({ message: 'Section added', severity: 'success' }));
      }
      setSectionOpen(false);
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
    }
  };

  const openAddItem = (sectionId: string) => {
    setEditItem(null);
    setItemSectionId(sectionId);
    setItemDesc(''); setItemUnit('Nos'); setItemQty(''); setItemRate(''); setItemNotes('');
    setItemOpen(true);
  };

  const openEditItem = (item: BoqItemDto) => {
    setEditItem(item);
    setItemSectionId(item.sectionId);
    setItemDesc(item.description);
    setItemUnit(item.unit);
    setItemQty(String(item.quantity));
    setItemRate(String(item.unitRate));
    setItemNotes(item.notes ?? '');
    setItemOpen(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    const data = {
      description: itemDesc,
      unit: itemUnit,
      quantity: parseFloat(itemQty) || 0,
      unitRate: parseFloat(itemRate) || 0,
      notes: itemNotes || undefined,
    };
    try {
      if (editItem) {
        await updateItem({ itemId: editItem.id, projectId, data }).unwrap();
        dispatch(showSnackbar({ message: 'Item updated', severity: 'success' }));
      } else {
        await addItem({ sectionId: itemSectionId, projectId, data }).unwrap();
        dispatch(showSnackbar({ message: 'Item added', severity: 'success' }));
      }
      setItemOpen(false);
    } catch (err: any) {
      dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
    }
  };

  const previewAmount = (parseFloat(itemQty) || 0) * (parseFloat(itemRate) || 0);

  if (isLoading) return <Loader />;

  return (
    <Box sx={{ p: 3 }}>
      <AppBreadcrumbs crumbs={[
        { label: 'Projects', to: '/projects' },
        { label: project?.name ?? '…', to: `/projects/${projectId}` },
        { label: 'BOQ' },
      ]} />

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => navigate(`/projects/${projectId}`)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <ArticleIcon color="primary" />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Bill of Quantities</Typography>
            <Typography variant="body2" color="text.secondary">{project?.name}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          {boq && (
            <>
              <Button startIcon={<PrintIcon />} variant="outlined" size="small" onClick={() => window.print()}>
                Print
              </Button>
              <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={openAddSection}>
                Add Section
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* No BOQ yet */}
      {!boq && (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <ArticleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No BOQ Created Yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a Bill of Quantities to list all materials, labour and work items with quantities and rates.
          </Typography>
          <Button
            variant="contained" startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            onClick={async () => {
              if (!projectId) return;
              try {
                await createBoq({ projectId, data: {} }).unwrap();
              } catch (err: any) {
                dispatch(showSnackbar({ message: err?.data?.message ?? 'Failed', severity: 'error' }));
              }
            }}
            disabled={creating}
          >
            Create BOQ
          </Button>
        </Paper>
      )}

      {/* BOQ Content */}
      {boq && (
        <>
          {/* Grand Total Banner */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{fmt(boq.grandTotal)}</Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {boq.sections.length} section{boq.sections.length !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {boq.sections.reduce((s, sec) => s + sec.items.length, 0)} items
              </Typography>
            </Stack>
          </Paper>

          {/* Sections */}
          {boq.sections.length === 0 && (
            <EmptyState
              message="No sections yet. Add a section to start building your BOQ."
              actionLabel="Add Section"
              onAction={openAddSection}
            />
          )}

          {boq.sections.map((section, sIdx) => (
            <Paper key={section.id} variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
              {/* Section Header */}
              <Stack direction="row" sx={{
                alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1.5, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider',
              }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Chip label={`${sIdx + 1}`} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 28 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{section.title}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {fmt(section.subtotal)}
                  </Typography>
                  <Tooltip title="Add Item">
                    <IconButton size="small" color="primary" onClick={() => openAddItem(section.id)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Section">
                    <IconButton size="small" onClick={() => openEditSection(section)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Section">
                    <IconButton size="small" color="error" onClick={() => setDeleteSectionId(section.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {/* Items Table */}
              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ width: 40, fontWeight: 600, color: 'text.secondary' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell sx={{ width: 80, fontWeight: 600 }}>Unit</TableCell>
                      <TableCell sx={{ width: 90, fontWeight: 600 }} align="right">Qty</TableCell>
                      <TableCell sx={{ width: 130, fontWeight: 600 }} align="right">Rate (PKR)</TableCell>
                      <TableCell sx={{ width: 140, fontWeight: 600 }} align="right">Amount (PKR)</TableCell>
                      <TableCell sx={{ width: 80, fontWeight: 600 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.items.map((item, iIdx) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{iIdx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.description}</Typography>
                          {item.notes && (
                            <Typography variant="caption" color="text.secondary">{item.notes}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={item.unit} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{item.quantity.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{item.unitRate.toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: item.amount > 0 ? 'text.primary' : 'text.disabled' }}>
                            {item.amount > 0 ? item.amount.toLocaleString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0} sx={{ justifyContent: 'flex-end' }}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditItem(item)}>
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => setDeleteItemId(item.id)}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {section.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                          No items — click + to add
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Section subtotal row */}
                    {section.items.length > 0 && (
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={5} align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                          Section Total:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {section.subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}

          {/* Summary Table */}
          {boq.sections.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 1, overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Summary</Typography>
              </Box>
              <Table size="small">
                <TableBody>
                  {boq.sections.map((s, i) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ color: 'text.secondary', width: 40 }}>{i + 1}</TableCell>
                      <TableCell>{s.title}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(s.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'primary.50' }}>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Grand Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: 'primary.main' }}>
                      {fmt(boq.grandTotal)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          )}
        </>
      )}

      {/* Section Dialog */}
      <Dialog open={sectionOpen} onClose={() => setSectionOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSectionSubmit}>
          <DialogTitle>{editSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
          <DialogContent>
            <TextField
              label="Section Title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              fullWidth autoFocus required
              placeholder="e.g. Foundation Work, Masonry, Finishing"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSectionOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingSection || !sectionTitle.trim()}>
              {addingSection ? <CircularProgress size={18} /> : editSection ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemOpen} onClose={() => setItemOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleItemSubmit}>
          <DialogTitle>{editItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Description" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)}
                fullWidth required multiline rows={2}
                placeholder="e.g. Brick masonry in cement mortar (1:6)"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Unit" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)}
                  fullWidth required select
                  slotProps={{ select: { native: true } }}
                >
                  {COMMON_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </TextField>
                <TextField
                  label="Quantity" type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)}
                  fullWidth required
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                />
              </Stack>
              <TextField
                label="Unit Rate (PKR)" type="number" value={itemRate} onChange={(e) => setItemRate(e.target.value)}
                fullWidth required
                slotProps={{ input: { startAdornment: <InputAdornment position="start">PKR</InputAdornment>, inputProps: { min: 0, step: 0.01 } } }}
              />
              {itemQty && itemRate && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Amount = {parseFloat(itemQty) || 0} × {parseFloat(itemRate) || 0} = <strong>{fmt(previewAmount)}</strong>
                </Alert>
              )}
              <TextField
                label="Notes (optional)" value={itemNotes} onChange={(e) => setItemNotes(e.target.value)}
                fullWidth size="small"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setItemOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addingItem || updatingItem || !itemDesc.trim()}>
              {(addingItem || updatingItem) ? <CircularProgress size={18} /> : editItem ? 'Update' : 'Add Item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Section Confirm */}
      <ConfirmDialog
        open={Boolean(deleteSectionId)}
        title="Delete Section"
        message="This will delete the section and all its items. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteSectionId || !projectId) return;
          try {
            await deleteSection({ sectionId: deleteSectionId, projectId }).unwrap();
            dispatch(showSnackbar({ message: 'Section deleted', severity: 'success' }));
          } catch {
            dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' }));
          }
          setDeleteSectionId(null);
        }}
        onCancel={() => setDeleteSectionId(null)}
      />

      {/* Delete Item Confirm */}
      <ConfirmDialog
        open={Boolean(deleteItemId)}
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteItemId) return;
          try {
            await deleteItem({ itemId: deleteItemId, projectId: deleteItemProjectId }).unwrap();
            dispatch(showSnackbar({ message: 'Item deleted', severity: 'success' }));
          } catch {
            dispatch(showSnackbar({ message: 'Failed to delete', severity: 'error' }));
          }
          setDeleteItemId(null);
        }}
        onCancel={() => setDeleteItemId(null)}
      />
    </Box>
  );
}
