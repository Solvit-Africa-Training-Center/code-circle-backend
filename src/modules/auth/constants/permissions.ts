export const PERMISSIONS = {
  // Role Management
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN_PERMISSIONS: 'role:assign-permissions',

  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLE: 'user:assign-role',
  USER_MANAGE_PERMISSIONS: 'user:manage-permissions',

  // Auth Management
  AUTH_READ: 'auth:read',
  AUTH_MANAGE: 'auth:manage',

  // Permission Management
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_READ: 'permission:read',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',

  // Audit Logs
  AUDIT_READ: 'audit:read',

  // System Administration
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_SETTINGS: 'system:settings',

  // club 
  CLUB_CREATE: 'club:create',
  CLUB_READ: 'club:read',
  CLUB_UPDATE: 'club:update',
  CLUB_DELETE: 'club:delete'
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const getAllPermissions = (): PermissionKey[] => {
  return Object.values(PERMISSIONS);
};

export const isValidPermission = (permission: string): permission is PermissionKey => {
  return Object.values(PERMISSIONS).includes(permission as PermissionKey);
};