import {
  Button, IconButton, Paper, Stack, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EmptyState from '../../../components/common/EmptyState';
import { fmtDate } from './utils';

interface Props {
  project: any;
  resourcesSubTab: number;
  setResourcesSubTab: (v: number) => void;
  setMachineryOpen: (v: boolean) => void;
  setRemoveMachineryId: (v: string) => void;
  setVehicleOpen: (v: boolean) => void;
  setRemoveVehicleId: (v: string) => void;
  setPlantOpen: (v: boolean) => void;
  setRemovePlantId: (v: string) => void;
}

export default function ProjectResourcesTab({
  project,
  resourcesSubTab,
  setResourcesSubTab,
  setMachineryOpen,
  setRemoveMachineryId,
  setVehicleOpen,
  setRemoveVehicleId,
  setPlantOpen,
  setRemovePlantId,
}: Props) {
  return (
    <>
      <Tabs value={resourcesSubTab} onChange={(_, v) => setResourcesSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Machinery (${project.machinery?.length ?? 0})`} />
        <Tab label={`Vehicles (${(project as any).vehicles?.length ?? 0})`} />
        <Tab label={`Plants (${(project as any).plants?.length ?? 0})`} />
      </Tabs>

      {/* Machinery sub-tab */}
      {resourcesSubTab === 0 && (
        <>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setMachineryOpen(true)}>
              Assign Machinery
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.machinery?.map((pm: any) => (
                  <TableRow key={pm.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{pm.machinery.name}</TableCell>
                    <TableCell>{pm.machinery.model ?? '-'}</TableCell>
                    <TableCell>{pm.machinery.status}</TableCell>
                    <TableCell>{fmtDate(pm.assignedAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => setRemoveMachineryId(pm.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!project.machinery?.length && (
                  <TableRow><TableCell colSpan={5}><EmptyState message="No machinery assigned yet" actionLabel="Assign Machinery" onAction={() => setMachineryOpen(true)} /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Vehicles sub-tab */}
      {resourcesSubTab === 1 && (
        <>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setVehicleOpen(true)}>
              Assign Vehicle
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Registration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {((project as any).vehicles ?? []).map((pv: any) => (
                  <TableRow key={pv.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{pv.vehicle?.name ?? pv.vehicle?.make ?? '-'}</TableCell>
                    <TableCell>{pv.vehicle?.registrationNumber ?? '-'}</TableCell>
                    <TableCell>{pv.vehicle?.status ?? '-'}</TableCell>
                    <TableCell>{fmtDate(pv.assignedAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => setRemoveVehicleId(pv.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!(project as any).vehicles?.length && (
                  <TableRow><TableCell colSpan={5}><EmptyState message="No vehicles assigned yet" actionLabel="Assign Vehicle" onAction={() => setVehicleOpen(true)} /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Plants sub-tab */}
      {resourcesSubTab === 2 && (
        <>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setPlantOpen(true)}>
              Assign Plant
            </Button>
          </Stack>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {((project as any).plants ?? []).map((pp: any) => (
                  <TableRow key={pp.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{pp.plant?.name ?? '-'}</TableCell>
                    <TableCell>{pp.plant?.type ?? '-'}</TableCell>
                    <TableCell>{pp.plant?.status ?? '-'}</TableCell>
                    <TableCell>{fmtDate(pp.assignedAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => setRemovePlantId(pp.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!(project as any).plants?.length && (
                  <TableRow><TableCell colSpan={5}><EmptyState message="No plants assigned yet" actionLabel="Assign Plant" onAction={() => setPlantOpen(true)} /></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
}
