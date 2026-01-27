/**
 * Error handling utilities for image processing
 */

export interface ProcessingError {
  code: ErrorCode;
  message: string;
  details: string | undefined;
  imageId: string | undefined;
  imageName: string | undefined;
  timestamp: Date;
}

export enum ErrorCode {
  // File errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  FILE_READ_ERROR = 'FILE_READ_ERROR',

  // Processing errors
  CANVAS_RENDER_ERROR = 'CANVAS_RENDER_ERROR',
  IMAGE_LOAD_ERROR = 'IMAGE_LOAD_ERROR',
  EXIF_READ_ERROR = 'EXIF_READ_ERROR',

  // System errors
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  WORKER_ERROR = 'WORKER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ImageProcessingError extends Error {
  public readonly code: ErrorCode;
  public readonly details: string | undefined;
  public readonly imageId: string | undefined;
  public readonly imageName: string | undefined;

  constructor(
    code: ErrorCode,
    message: string,
    details?: string,
    imageId?: string,
    imageName?: string,
  ) {
    super(message);
    this.name = 'ImageProcessingError';
    this.code = code;
    this.details = details;
    this.imageId = imageId;
    this.imageName = imageName;
  }

  toProcessingError(): ProcessingError {
    return {
      code: this.code,
      message: this.message,
      details: this.details ?? undefined,
      imageId: this.imageId ?? undefined,
      imageName: this.imageName ?? undefined,
      timestamp: new Date(),
    };
  }
}

/**
 * Create a processing error from an unknown error
 */
export function createProcessingError(
  error: unknown,
  imageId?: string,
  imageName?: string,
): ProcessingError {
  const timestamp = new Date();

  if (error instanceof ImageProcessingError) {
    return {
      ...error.toProcessingError(),
      timestamp,
    };
  }

  if (error instanceof Error) {
    // Try to determine error code from message
    let code = ErrorCode.UNKNOWN_ERROR;
    const message = error.message.toLowerCase();

    if (message.includes('file too large') || message.includes('size')) {
      code = ErrorCode.FILE_TOO_LARGE;
    } else if (message.includes('format') || message.includes('invalid')) {
      code = ErrorCode.INVALID_FORMAT;
    } else if (message.includes('canvas') || message.includes('render')) {
      code = ErrorCode.CANVAS_RENDER_ERROR;
    } else if (message.includes('load') || message.includes('image')) {
      code = ErrorCode.IMAGE_LOAD_ERROR;
    } else if (message.includes('exif')) {
      code = ErrorCode.EXIF_READ_ERROR;
    } else if (message.includes('memory')) {
      code = ErrorCode.OUT_OF_MEMORY;
    } else if (message.includes('worker')) {
      code = ErrorCode.WORKER_ERROR;
    }

    return {
      code,
      message: error.message,
      details: error.stack ?? undefined,
      imageId: imageId ?? undefined,
      imageName: imageName ?? undefined,
      timestamp,
    };
  }

  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: String(error),
    details: undefined,
    imageId: imageId ?? undefined,
    imageName: imageName ?? undefined,
    timestamp,
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: ProcessingError): string {
  switch (error.code) {
    case ErrorCode.FILE_TOO_LARGE:
      return `文件过大: ${error.imageName || '未知文件'} (最大 8MB)`;

    case ErrorCode.INVALID_FORMAT:
      return `不支持的文件格式: ${error.imageName || '未知文件'} (仅支持 JPG, PNG)`;

    case ErrorCode.FILE_READ_ERROR:
      return `读取文件失败: ${error.imageName || '未知文件'}`;

    case ErrorCode.CANVAS_RENDER_ERROR:
      return `渲染失败: ${error.imageName || '未知文件'}`;

    case ErrorCode.IMAGE_LOAD_ERROR:
      return `加载图片失败: ${error.imageName || '未知文件'}`;

    case ErrorCode.EXIF_READ_ERROR:
      return `读取 EXIF 失败: ${error.imageName || '未知文件'}`;

    case ErrorCode.OUT_OF_MEMORY:
      return `内存不足，请减少批处理数量`;

    case ErrorCode.WORKER_ERROR:
      return `工作线程错误`;

    case ErrorCode.NETWORK_ERROR:
      return `网络错误`;

    default:
      return error.message || '未知错误';
  }
}

/**
 * Format error for display
 */
export function formatError(error: ProcessingError): string {
  const message = getErrorMessage(error);
  const details = error.details ? `\n详情: ${error.details}` : '';
  return `${message}${details}`;
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): ImageProcessingError | null {
  // Check file size (8MB limit)
  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return new ImageProcessingError(
      ErrorCode.FILE_TOO_LARGE,
      `文件过大 (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
      `最大允许 8MB，当前文件 ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      undefined,
      file.name,
    );
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return new ImageProcessingError(
      ErrorCode.INVALID_FORMAT,
      `不支持的文件格式: ${file.type}`,
      '仅支持 JPG, PNG 格式',
      undefined,
      file.name,
    );
  }

  return null;
}

/**
 * Batch error handler
 */
export class BatchErrorHandler {
  private errors: ProcessingError[] = [];

  add(error: ProcessingError): void {
    this.errors.push(error);
  }

  addFromUnknown(error: unknown, imageId?: string, imageName?: string): void {
    this.add(createProcessingError(error, imageId, imageName));
  }

  getAll(): ProcessingError[] {
    return [...this.errors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clear(): void {
    this.errors = [];
  }

  count(): number {
    return this.errors.length;
  }

  getErrorsByCode(code: ErrorCode): ProcessingError[] {
    return this.errors.filter((e) => e.code === code);
  }

  getSummary(): string {
    if (this.errors.length === 0) {
      return '处理完成，没有错误';
    }

    const summary = `共 ${this.errors.length} 个错误:\n`;
    const byCode = new Map<ErrorCode, number>();

    for (const error of this.errors) {
      const count = byCode.get(error.code) || 0;
      byCode.set(error.code, count + 1);
    }

    const details = Array.from(byCode.entries())
      .map(([code, count]) => `- ${code}: ${count}`)
      .join('\n');

    return summary + details;
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableErrors: ErrorCode[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableErrors: [
    ErrorCode.CANVAS_RENDER_ERROR,
    ErrorCode.IMAGE_LOAD_ERROR,
    ErrorCode.WORKER_ERROR,
  ],
};

/**
 * Check if error is retryable
 */
export function isRetryableError(
  error: ProcessingError,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  return config.retryableErrors.includes(error.code);
}

/**
 * Delay utility for retry
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error) => void,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const processingError = createProcessingError(error);
        if (isRetryableError(processingError, config)) {
          const delayTime = config.retryDelay * Math.pow(2, attempt);
          onRetry?.(attempt + 1, lastError);
          await delay(delayTime);
          continue;
        }
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Retry failed');
}
