/**
 * User type definition
 */
import type { BorderStyle, LogoConfig } from './image';

export type UserType = 'guest' | 'user' | 'admin';

/**
 * User interface
 */
export interface User {
  id: string;
  username: string;
  type: UserType;
  email?: string;
  createdAt: string;
}

/**
 * User permissions based on type
 */
export interface UserPermissions {
  canSaveSettings: boolean;
  canUseCustomLogo: boolean;
  canBatchProcess: boolean;
  maxImagesPerBatch: number;
  canExportSettings: boolean;
  isAdmin: boolean;
}

/**
 * Guest user default permissions
 */
export const GUEST_PERMISSIONS: UserPermissions = {
  canSaveSettings: false,
  canUseCustomLogo: false,
  canBatchProcess: false,  // Guest cannot batch process
  maxImagesPerBatch: 1,     // Guest can only upload 1 image at a time
  canExportSettings: false,
  isAdmin: false,
};

/**
 * Registered user default permissions
 */
export const USER_PERMISSIONS: UserPermissions = {
  canSaveSettings: true,
  canUseCustomLogo: true,
  canBatchProcess: true,
  maxImagesPerBatch: 50,
  canExportSettings: true,
  isAdmin: false,
};

/**
 * Admin user default permissions
 */
export const ADMIN_PERMISSIONS: UserPermissions = {
  canSaveSettings: true,
  canUseCustomLogo: true,
  canBatchProcess: true,
  maxImagesPerBatch: 100,    // Admin can process more images
  canExportSettings: true,
  isAdmin: true,
};

/**
 * User settings that can be persisted
 */
export interface UserSettings {
  borderStyle?: BorderStyle;
  exifFields?: string[];
  exifTextAlign?: 'left' | 'center' | 'right';
  exifFont?: string;
  exifFontSize?: number;
  exifColor?: string;
  outputWidth?: number;
  outputHeight?: number;
  maintainAspectRatio?: boolean;
  quality?: number;
  customLogos?: LogoConfig[];
}

/**
 * Authentication credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

/**
 * Get permissions by user type
 */
export function getPermissionsByType(userType: UserType): UserPermissions {
  switch (userType) {
    case 'admin':
      return ADMIN_PERMISSIONS;
    case 'user':
      return USER_PERMISSIONS;
    case 'guest':
    default:
      return GUEST_PERMISSIONS;
  }
}
