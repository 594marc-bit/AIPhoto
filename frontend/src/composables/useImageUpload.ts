import { ref } from 'vue';
import type { ImageFile } from '@/types/image';
import {
  validateImageFile,
  formatFileSize,
  generateImageId,
} from '@/utils/imageValidation';
import { readExifFromFile } from '@/utils/exifReader';

export function useImageUpload() {
  const images = ref<ImageFile[]>([]);
  const isDragging = ref(false);
  const uploadErrors = ref<string[]>([]);

  const createObjectUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const revokeObjectUrl = (url: string): void => {
    URL.revokeObjectURL(url);
  };

  const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = createObjectUrl(file);

      img.onload = () => {
        revokeObjectUrl(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };

      img.onerror = () => {
        revokeObjectUrl(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  const processFiles = async (files: FileList | File[]): Promise<void> => {
    uploadErrors.value = [];
    const fileList = Array.from(files);

    for (const file of fileList) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        uploadErrors.value.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const dimensions = await loadImageDimensions(file);
        const exif = await readExifFromFile(file);
        const url = createObjectUrl(file);

        const imageFile: ImageFile = {
          id: generateImageId(),
          file,
          url,
          name: file.name,
          size: file.size,
          type: file.type,
          width: dimensions.width,
          height: dimensions.height,
          status: 'pending',
          ...(exif ? { exif } : {}),
        };

        images.value.push(imageFile);
      } catch {
        uploadErrors.value.push(`${file.name}: 无法读取图片尺寸`);
      }
    }
  };

  const onDrop = (event: DragEvent): void => {
    event.preventDefault();
    isDragging.value = false;

    if (event.dataTransfer?.files) {
      void processFiles(event.dataTransfer.files);
    }
  };

  const onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    isDragging.value = true;
  };

  const onDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    isDragging.value = false;
  };

  const onFileSelect = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      void processFiles(target.files);
      // Reset input value to allow selecting the same file again
      target.value = '';
    }
  };

  const removeImage = (id: string): void => {
    const index = images.value.findIndex((img) => img.id === id);
    if (index === -1) return;

    const [image] = images.value.splice(index, 1);
    if (!image) return;

    if (image.url) {
      revokeObjectUrl(image.url);
    }
    if (image.processedUrl) {
      revokeObjectUrl(image.processedUrl);
    }
  };

  const clearImages = (): void => {
    images.value.forEach((image) => {
      if (image.url) revokeObjectUrl(image.url);
      if (image.processedUrl) revokeObjectUrl(image.processedUrl);
    });
    images.value = [];
    uploadErrors.value = [];
  };

  const updateImageStatus = (
    id: string,
    status: ImageFile['status'],
    processedUrl?: string,
    error?: string,
  ): void => {
    const image = images.value.find((img) => img.id === id);
    if (!image) return;

    image.status = status;
    if (processedUrl) {
      if (image.processedUrl) {
        revokeObjectUrl(image.processedUrl);
      }
      image.processedUrl = processedUrl;
    }
    if (error) {
      image.error = error;
    }
  };

  return {
    images,
    isDragging,
    uploadErrors,
    formatFileSize,
    onDrop,
    onDragOver,
    onDragLeave,
    onFileSelect,
    removeImage,
    clearImages,
    updateImageStatus,
  };
}
