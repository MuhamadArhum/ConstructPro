import {
  Box, Button, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmptyState from '../../../components/common/EmptyState';
import { fmt, fmtDate, INV_STATUS_COLOR } from './utils';

interface Props {
  invoicesData: any;
  navigate: (path: string) => void;
  projectId: string;
}

export default function ProjectInvoicesTab({ invoicesData, navigate, projectId }: Props) {
  const newInvoiceUrl = `/invoices/new?projectId=${projectId}&returnTo=/projects/${projectId}`;
  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {invoicesData?.data.length ? (() => {
          const invTotal = invoicesData.data.reduce((s: number, inv: any) => s + inv.total, 0);
          const invPaid = invoicesData.data.filter((inv: any) => inv.status === 'Paid').reduce((s: number, inv: any) => s + inv.total, 0);
          const invOutstanding = invTotal - invPaid;
          return (
            <Stack direction="row" spacing={2}>
              <Typography variant="body2">Billed: <strong>{fmt(invTotal)}</strong></Typography>
              <Typography variant="body2" color="success.main">Paid: <strong>{fmt(invPaid)}</strong></Typography>
              <Typography variant="body2" color={invOutstanding > 0 ? 'warning.main' : 'text.secondary'}>Outstanding: <strong>{fmt(invOutstanding)}</strong></Typography>
            </Stack>
          );
        })() : <Box />}
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => navigate(newInvoiceUrl)}>
          New Invoice
        </Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoicesData?.data.map((inv: any) => (
              <TableRow key={inv.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                <TableCell>{inv.customer?.name ?? '-'}</TableCell>
                <TableCell>{fmtDate(inv.issueDate)}</TableCell>
                <TableCell>{fmtDate(inv.dueDate)}</TableCell>
                <TableCell align="right">{fmt(inv.total)}</TableCell>
                <TableCell><Chip label={inv.status} color={INV_STATUS_COLOR(inv.status)} size="small" /></TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton size="small" onClick={() => navigate(`/invoices/${inv.id}?returnTo=/projects/${projectId}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!invoicesData?.data.length && (
              <TableRow><TableCell colSpan={7}><EmptyState message="No invoices for this project" actionLabel="New Invoice" onAction={() => navigate(newInvoiceUrl)} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
