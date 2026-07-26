export interface PermissionDto {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string;
}

export interface RoleDto {
  id: string;
  name: string;
  isSystemRole: boolean;
  permissionCodes: string[];
}

export interface CreateRoleRequest {
  name: string;
}

export interface AssignPermissionsRequest {
  permissionCodes: string[];
}
