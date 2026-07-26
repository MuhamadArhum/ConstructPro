import type { ReactNode } from 'react';
import { useAppSelector } from '../../app/hooks';

interface Props {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGate({ permission, children, fallback = null }: Props) {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  if (!permissions.includes(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
