import { ref, computed } from 'vue';
import { CanvasRenderer } from '@/utils/canvasRenderer';
import type { ImageFile, ProcessOptions } from '@/types/image';

export function useImagePreview() {
  const previewImage = ref<ImageFile | null>(null);
  const previewUrl = ref<string>('');
  const isGenerating = ref(false);
  const renderer = new CanvasRenderer();

  const hasPreview = computed(() => !!previewUrl.value);

  /**
   * Generate preview for an image
   */
  const generatePreview = async (
    imageFile: ImageFile,
    options: ProcessOptions,
  ): Promise<string> => {
    isGenerating.value = true;

    try {
      // Always use Canvas for preview (HDR images will be processed via backend during export)
      console.log('[useImagePreview] Using Canvas for preview');
      const result = await renderer.render({
        imageFile,
        ...options,
      });

      // Update preview image with new dimensions
      previewImage.value = {
        ...imageFile,
        width: result.width,
        height: result.height,
      };

      // Revoke old URL before setting new one
      if (previewUrl.value && previewUrl.value !== result.url) {
        URL.revokeObjectURL(previewUrl.value);
      }

      previewUrl.value = result.url;

      console.log('[useImagePreview] Preview updated:', {
        url: previewUrl.value,
        width: result.width,
        height: result.height,
        hasPreview: !!previewUrl.value,
      });

      return result.url;
    } finally {
      isGenerating.value = false;
    }
  };

  /**
   * Clear preview
   */
  const clearPreview = (): void => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = '';
    previewImage.value = null;
  };

  /**
   * Download preview image
   */
  const downloadPreview = (filename: string = 'preview.jpg'): void => {
    if (!previewUrl.value) return;

    const link = document.createElement('a');
    link.href = previewUrl.value;
    link.download = filename;
    link.click();
  };

  return {
    previewImage,
    previewUrl,
    isGenerating,
    hasPreview,
    generatePreview,
    clearPreview,
    downloadPreview,
  };
}
