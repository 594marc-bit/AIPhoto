import type { UploadOptions } from '@/types/image';

export const DEFAULT_UPLOAD_OPTIONS: UploadOptions = {
  maxSize: Number.parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '8388608'),
  allowedTypes: (import.meta.env.VITE_ALLOWED_FORMATS || 'image/jpeg,image/png').split(','),
  multiple: true,
};

export function validateImageFile(file: File, options: UploadOptions = DEFAULT_UPLOAD_OPTIONS): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件格式: ${file.type}。仅支持 JPG 和 PNG 格式`,
    };
  }

  // Check file size
  if (file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `文件大小超出限制: ${fileSizeMB}MB (最大 ${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
