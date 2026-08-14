import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  crumbs: Crumb[];
}

export default function AppBreadcrumbs({ crumbs }: Props) {
  return (
    <Breadcrumbs sx={{ mb: 1.5, fontSize: '0.78rem' }}>
      {crumbs.map((crumb, i) =>
        crumb.to && i < crumbs.length - 1 ? (
          <Link
            key={i}
            component={RouterLink}
            to={crumb.to}
            underline="hover"
            color="text.secondary"
            sx={{ fontSize: '0.78rem' }}
          >
            {crumb.label}
          </Link>
        ) : (
          <Typography key={i} color="text.primary" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
            {crumb.label}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
}
