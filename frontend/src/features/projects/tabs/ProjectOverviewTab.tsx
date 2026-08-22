import { Box, Divider, Grid, Stack, Typography } from '@mui/material';
import { fmtDate } from './utils';

interface Props {
  project: any;
}

export default function ProjectOverviewTab({ project }: Props) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">Client</Typography>
            <Typography>{project.client ? (project.client.companyName ?? project.client.name) : '-'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Site Address</Typography>
            <Typography>{project.siteAddress ?? '-'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Manager</Typography>
            <Typography>{project.managerName ?? '-'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Start Date</Typography>
            <Typography>{fmtDate(project.startDate)}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">End Date</Typography>
            <Typography>{project.endDate ? fmtDate(project.endDate) : '-'}</Typography>
          </Box>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">Description</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{project.description ?? '-'}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">Notes</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{project.notes ?? '-'}</Typography>
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}
