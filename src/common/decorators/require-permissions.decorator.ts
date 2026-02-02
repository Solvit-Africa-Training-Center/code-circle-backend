import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '@circle-backend/modules/auth/constants/permissions';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);