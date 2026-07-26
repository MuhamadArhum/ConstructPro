import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { AppRole } from '../../utils/constants';

interface RoleBasedRouteProps {
  allowedRoles: AppRole[];
}

export default function RoleBasedRoute({ allowedRoles }: RoleBasedRouteProps) {
  const user = useAppSelector((state) => state.auth.user);

  const hasAccess = user?.roles.some((role) => allowedRoles.includes(role)) ?? false;

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
