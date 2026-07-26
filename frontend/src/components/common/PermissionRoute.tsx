import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

interface Props {
  permission: string;
}

export default function PermissionRoute({ permission }: Props) {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  if (!permissions.includes(permission)) return <Navigate to="/" replace />;
  return <Outlet />;
}
