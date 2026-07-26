import type { AppRole } from '../utils/constants';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profilePicturePath: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: AppRole[];
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: AppRole;
  phoneNumber?: string;
}

export interface UpdateUserRequest {
  fullName: string;
  role: AppRole;
  isActive: boolean;
  phoneNumber?: string;
}

export interface AdminResetPasswordRequest {
  newPassword: string;
}
