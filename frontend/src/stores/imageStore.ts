/* eslint-disable */
// @ts-nocheck
import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ImageFile } from '@/types/image';
import {
  validateImageFile,
  formatFileSize,
  generateImageId,
} from '@/utils/imageValidation';
import { readExifFromFile } from '@/utils/exifReader';

export const useImageStore = defineStore('image', {
  state: () => ({
    images: [] as ImageFile[],
    isDragging: false,
    uploadErrors: [] as string[],
    selectedImageId: null as string | null,
  }),

  getters: {
    hasImages: (state) => state.images.length > 0,
    firstImage: (state) => state.images[0],
    selectedImage: (state): ImageFile | null => {
      if (state.images.length === 0) return null;
      if (state.selectedImageId) {
        return state.images.find((img) => img.id === state.selectedImageId) ?? state.images[0] ?? null;
      }
      return state.images[0] ?? null;
    },
    processedCount: (state) =>
      state.images.filter((img) => img.status === 'completed').length,
  },

  actions: {
    createObjectUrl(file: File): string {
      return URL.createObjectURL(file);
    },

    revokeObjectUrl(url: string): void {
      URL.revokeObjectURL(url);
    },

    async loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = this.createObjectUrl(file);

        img.onload = () => {
          this.revokeObjectUrl(url);
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };

        img.onerror = () => {
          this.revokeObjectUrl(url);
          reject(new Error('Failed to load image'));
        };

        img.src = url;
      });
    },

    async processFiles(files: FileList | File[]): Promise<void> {
      this.uploadErrors = [];
      const fileList = Array.from(files);

      for (const file of fileList) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          this.uploadErrors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        try {
          const dimensions = await this.loadImageDimensions(file);
          const exif = await readExifFromFile(file);
          const url = this.createObjectUrl(file);

          console.log('[imageStore.processFiles] Processing file:', file.name);
          console.log('[imageStore.processFiles] EXIF data:', exif);

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

          console.log('[imageStore.processFiles] Created imageFile with exif:', 'exif' in imageFile);
          this.images.push(imageFile);
        } catch {
          this.uploadErrors.push(`${file.name}: 无法读取图片尺寸`);
        }
      }
    },

    onDrop(event: DragEvent): void {
      event.preventDefault();
      this.isDragging = false;

      if (event.dataTransfer?.files) {
        void this.processFiles(event.dataTransfer.files);
      }
    },

    onDragOver(event: DragEvent): void {
      event.preventDefault();
      this.isDragging = true;
    },

    onDragLeave(event: DragEvent): void {
      event.preventDefault();
      this.isDragging = false;
    },

    async onFileSelect(event: Event): Promise<void> {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        await this.processFiles(target.files);
        // Reset input value to allow selecting the same file again
        target.value = '';
      }
    },

    removeImage(id: string): void {
      const index = this.images.findIndex((img) => img.id === id);
      if (index === -1) return;

      const [image] = this.images.splice(index, 1);
      if (!image) return;

      if (image.url) {
        this.revokeObjectUrl(image.url);
      }
      if (image.processedUrl) {
        this.revokeObjectUrl(image.processedUrl);
      }
      // Note: processedBlob is automatically garbage collected when no longer referenced
    },

    clearImages(): void {
      this.images.forEach((image) => {
        if (image.url) this.revokeObjectUrl(image.url);
        if (image.processedUrl) this.revokeObjectUrl(image.processedUrl);
        // Note: processedBlob is automatically garbage collected
      });
      this.images = [];
      this.uploadErrors = [];
      this.selectedImageId = null;
    },

    selectImage(id: string): void {
      this.selectedImageId = id;
    },

    updateImageStatus(
      id: string,
      status: ImageFile['status'],
      processedUrl?: string,
      error?: string,
    ): void {
      const image = this.images.find((img) => img.id === id);
      if (!image) return;

      image.status = status;
      if (processedUrl) {
        if (image.processedUrl) {
          this.revokeObjectUrl(image.processedUrl);
        }
        image.processedUrl = processedUrl;
      }
      if (error) {
        image.error = error;
      }
    },

    formatFileSize,
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImageStore, import.meta.hot));
}
