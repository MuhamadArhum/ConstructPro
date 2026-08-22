import {
  Box, Button, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmptyState from '../../../components/common/EmptyState';
import { fmt, fmtDate, PO_STATUS_COLOR } from './utils';

interface Props {
  posData: any;
  navigate: (path: string) => void;
}

export default function ProjectPurchaseOrdersTab({ posData, navigate }: Props) {
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {posData?.data.length ? (() => {
          const poTotal = posData.data.reduce((s: number, po: any) => s + po.total, 0);
          const poReceived = posData.data.filter((po: any) => po.status === 'Received').reduce((s: number, po: any) => s + po.total, 0);
          const poPending = posData.data.filter((po: any) => !['Received', 'Cancelled'].includes(po.status)).reduce((s: number, po: any) => s + po.total, 0);
          return (
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">Ordered: <strong>{fmt(poTotal)}</strong></Typography>
              <Typography variant="body2" color="success.main">Received: <strong>{fmt(poReceived)}</strong></Typography>
              <Typography variant="body2" color={poPending > 0 ? 'warning.main' : 'text.secondary'}>Pending: <strong>{fmt(poPending)}</strong></Typography>
            </Stack>
          );
        })() : <Box />}
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => navigate(`/purchase-orders/new`)}>
          New PO
        </Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>PO #</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Expected Delivery</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posData?.data.map((po: any) => (
              <TableRow key={po.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{po.poNumber}</TableCell>
                <TableCell>{po.supplier?.name ?? '-'}</TableCell>
                <TableCell>{fmtDate(po.issueDate)}</TableCell>
                <TableCell>{po.expectedDelivery ? fmtDate(po.expectedDelivery) : '-'}</TableCell>
                <TableCell align="right">{fmt(po.total)}</TableCell>
                <TableCell><Chip label={po.status} color={PO_STATUS_COLOR(po.status)} size="small" /></TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => navigate(`/purchase-orders/${po.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!posData?.data.length && (
              <TableRow><TableCell colSpan={7}><EmptyState message="No purchase orders for this project" actionLabel="New PO" onAction={() => navigate('/purchase-orders/new')} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
