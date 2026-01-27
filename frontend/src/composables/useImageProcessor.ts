import { ref } from 'vue';
import { CanvasRenderer } from '@/utils/canvasRenderer';
import type { ImageFile, ProcessOptions, BorderStyle } from '@/types/image';

export function useImageProcessor() {
  const isProcessing = ref(false);
  const processingProgress = ref(0);
  const processingErrors = ref<string[]>([]);

  const renderer = new CanvasRenderer();

  /**
   * Process a single image
   */
  const processImage = async (
    imageFile: ImageFile,
    options: ProcessOptions,
  ): Promise<{ url: string; width: number; height: number }> => {
    try {
      console.log('[useImageProcessor] Processing image:', imageFile.name);

      // Use Canvas for all images (no HDR special handling)
      const result = await renderer.render({
        imageFile,
        ...options,
      });

      return {
        url: result.url,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      throw new Error(`处理图片失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * Process multiple images in batch
   */
  const processBatch = async (
    images: ImageFile[],
    options: ProcessOptions,
    onProgress?: (current: number, total: number, imageId: string) => void,
  ): Promise<void> => {
    isProcessing.value = true;
    processingProgress.value = 0;
    processingErrors.value = [];

    const total = images.length;

    for (let i = 0; i < total; i++) {
      const image = images[i];
      if (!image) continue; // Skip undefined entries

      try {
        if (onProgress) {
          onProgress(i + 1, total, image.id);
        }

        await processImage(image, options);

        processingProgress.value = ((i + 1) / total) * 100;

        // The parent component should update the image status
        onProgress?.(i + 1, total, image.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        processingErrors.value.push(`${image.name}: ${errorMessage}`);
      }
    }

    isProcessing.value = false;
  };

  /**
   * Process images with delay to prevent UI blocking
   */
  const processWithDelay = async (
    images: ImageFile[],
    options: ProcessOptions,
    delay: number = 100,
    onProgress?: (current: number, total: number, imageId: string) => void,
  ): Promise<void> => {
    isProcessing.value = true;
    processingProgress.value = 0;
    processingErrors.value = [];

    const total = images.length;

    for (let i = 0; i < total; i++) {
      const image = images[i];
      if (!image) continue; // Skip undefined entries

      try {
        if (onProgress) {
          onProgress(i + 1, total, image.id);
        }

        await processImage(image, options);

        processingProgress.value = ((i + 1) / total) * 100;

        // Add delay to prevent blocking
        if (i < total - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        processingErrors.value.push(`${image.name}: ${errorMessage}`);
      }
    }

    isProcessing.value = false;
  };

  /**
   * Get default border style
   */
  const getDefaultBorderStyle = (): BorderStyle => {
    return {
      id: 'default',
      name: '默认边框',
      type: 'bottom',
      bottomHeight: 80,
      sideWidth: 0,
      padding: 20,
      backgroundColor: '#ffffff',
      textColor: '#333333',
      font: 'Arial',
      fontSize: 14,
      showExif: true,
      showLogo: false,
      logoPosition: 'center',
    };
  };

  /**
   * Get default process options
   */
  const getDefaultProcessOptions = (): ProcessOptions => {
    return {
      borderStyle: getDefaultBorderStyle(),
      exifFields: ['make', 'model', 'dateTime', 'exposureTime', 'fNumber', 'iso', 'focalLength'],
      maintainAspectRatio: true,
      quality: 0.95,
    };
  };

  return {
    isProcessing,
    processingProgress,
    processingErrors,
    processImage,
    processBatch,
    processWithDelay,
    getDefaultBorderStyle,
    getDefaultProcessOptions,
  };
}
