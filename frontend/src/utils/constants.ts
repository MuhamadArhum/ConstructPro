export const AppRoles = {
  Admin: 'Admin',
  Accountant: 'Accountant',
  Manager: 'Manager',
  DataEntryOperator: 'DataEntryOperator',
} as const;

export type AppRole = (typeof AppRoles)[keyof typeof AppRoles];

export const ALL_ROLES: AppRole[] = [
  AppRoles.Admin,
  AppRoles.Accountant,
  AppRoles.Manager,
  AppRoles.DataEntryOperator,
];

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const ACCESS_TOKEN_KEY = 'builderp_access_token';
export const REFRESH_TOKEN_KEY = 'builderp_refresh_token';
