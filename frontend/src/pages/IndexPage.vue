<template>
  <q-page class="main-page">
    <!-- Compact Header -->
    <div class="page-header q-mb-sm">
      <div class="text-h5 text-weight-bold">AI 照片边框处理</div>
      <div class="text-caption text-grey">上传照片，添加边框、EXIF 信息和品牌 Logo</div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Upload Section -->
      <image-uploader ref="uploaderRef" class="q-mb-sm" />

      <!-- Preview and Settings Section -->
      <div v-if="hasImages" class="preview-settings-section">
        <!-- Preview Display -->
        <div class="preview-section">
          <image-preview
            ref="previewRef"
            @download="handlePreviewDownload"
          />
        </div>

        <!-- Settings Panel with 4 tabs -->
        <div class="settings-section">
          <settings-panel
            v-model:border-style="borderStyle"
            v-model:exif-fields="exifFields"
            v-model:show-exif="showExif"
            v-model:exif-text-align="exifTextAlign"
            v-model:exif-text-offset="exifTextOffset"
            v-model:exif-text-offset-x="exifTextOffsetX"
            v-model:exif-text-offset-y="exifTextOffsetY"
            v-model:exif-font="exifFont"
            v-model:exif-font-size="exifFontSize"
            v-model:exif-color="exifColor"
            :preset-logo-config="presetLogoConfig"
            :custom-logo-config="customLogoConfig"
            :exif-data="selectedImage?.exif || null"
            :image-width="firstImageWidth"
            :image-height="firstImageHeight"
            @update:preset-logo-config="handlePresetLogoChange"
            @update:custom-logo-config="handleCustomLogoChange"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="hasImages" class="action-buttons q-mt-sm">
        <q-btn
          v-if="hasMultipleImages"
          color="info"
          label="应用到其它照片"
          icon="content_copy"
          @click="handleApplyToOthers"
        />
        <q-btn
          color="primary"
          :label="userStore.isGuest ? '处理照片' : '批量处理'"
          icon="done_all"
          :loading="isProcessing"
          :disable="isProcessing || !canProcess"
          @click="handleProcess"
        />
        <q-btn
          v-if="processedCount > 0 && !userStore.isGuest"
          color="secondary"
          label="下载全部"
          icon="download"
          @click="handleDownloadAll"
        />
      </div>

      <!-- Batch limit warning for guest users -->
      <q-banner v-if="hasTooManyImages" class="bg-warning text-white q-mt-sm rounded-borders">
        <template v-slot:avatar>
          <q-icon name="warning" />
        </template>
        <div class="text-body2">
          访客模式最多处理 {{ maxImagesPerBatch }} 张图片。当前已上传 {{ imageStore.images.length }} 张，
          超出 {{ exceededImageCount }} 张。
          <router-link v-if="userStore.isGuest" to="#" class="text-white text-weight-bold">
            登录后可处理最多 50 张
          </router-link>
        </div>
      </q-banner>

      <!-- Batch Processing Progress -->
      <batch-progress
        v-if="showBatchProgress"
        :show="showBatchProgress"
        :is-processing="batchProcessor.isProcessing.value"
        :is-paused="batchProcessor.isPaused.value"
        :progress="batchProcessor.progress.value"
        :errors="batchProcessor.errors.value"
        :statistics="batchProcessor.getStatistics()"
        @pause="handlePause"
        @resume="handleResume"
        @cancel="handleCancel"
        @retry="handleRetry"
        @close="handleCloseProgress"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, computed, watch, nextTick } from 'vue';
import ImageUploader from '@/components/ImageUploader.vue';
import ImagePreview from '@/components/ImagePreview.vue';
import SettingsPanel from '@/components/SettingsPanel.vue';
import BatchProgress from '@/components/BatchProgress.vue';
import { useImageProcessor } from '@/composables/useImageProcessor';
import { useBatchProcessor } from '@/composables/useBatchProcessor';
import { useImageStore } from '@/stores/imageStore';
import { useUserStore } from '@/stores/userStore';
import type { BorderStyle, LogoConfig, ImageFile, ProcessOptions, ImageCustomSettings } from '@/types/image';
import { getDefaultBorderStyle } from '@/utils/borderStyles';
import { getDefaultExifFields } from '@/utils/exifReader';

// Component instance types
interface ImageUploaderInstance {
  images: ImageFile[];
  updateImageStatus: (id: string, status: ImageFile['status'], processedUrl?: string, error?: string) => void;
}

interface ImagePreviewInstance {
  updatePreview: (image: ImageFile, options: ProcessOptions) => Promise<void>;
  clearPreview: () => void;
  hasPreview: { value: boolean };
}

// Upload
const imageStore = useImageStore();
const userStore = useUserStore();
const uploaderRef = ref<ImageUploaderInstance>();
const previewRef = ref<ImagePreviewInstance>();

// Computed properties - MUST be defined before using them
const hasImages = computed(() => imageStore.images.length > 0);
const hasMultipleImages = computed(() => imageStore.images.length > 1);
const selectedImage = computed(() => imageStore.selectedImage);
const firstImageWidth = computed(() => selectedImage.value?.width ?? 1920);
const firstImageHeight = computed(() => selectedImage.value?.height ?? 1080);
const processedCount = computed(
  () => imageStore.images.filter((img) => img.status === 'completed').length,
);
const maxImagesPerBatch = computed(() => userStore.maxImagesPerBatch);
const hasTooManyImages = computed(() => imageStore.images.length > maxImagesPerBatch.value);
const canProcess = computed(() => !hasTooManyImages.value);
const exceededImageCount = computed(() => Math.max(0, imageStore.images.length - maxImagesPerBatch.value));

// Global default settings (shared by all images unless overridden)
const borderStyle = ref<BorderStyle>(getDefaultBorderStyle());
const exifFields = ref<string[]>(getDefaultExifFields());
const showExif = ref(true);
const exifTextAlign = ref<'left' | 'center' | 'right'>('right');
const exifTextOffset = ref(0);
const exifTextOffsetX = ref(50); // Default to right edge
const exifTextOffsetY = ref(0);
const exifFont = ref('Arial');
const exifFontSize = ref(1); // 1% of image width
const exifColor = ref('#333333');
const outputWidth = ref<number | undefined>(undefined);
const outputHeight = ref<number | undefined>(undefined);
const maintainAspectRatio = ref(true);
const quality = ref(95);
// Split logo into preset and custom for task 3.3
const presetLogoConfig = ref<LogoConfig>();
const customLogoConfig = ref<LogoConfig>();
const logoConfig = ref<LogoConfig>(); // For backward compatibility
const logoConfigs = ref<LogoConfig[]>(); // For backward compatibility

// Flag to prevent auto-save when loading settings during image switch
const isLoadingSettings = ref(false);

// Get effective settings for current selected image (custom or default)
const effectiveBorderStyle = computed(() => {
  if (!selectedImage.value?.customSettings?.borderStyle) {
    return borderStyle.value;
  }
  return { ...borderStyle.value, ...selectedImage.value.customSettings.borderStyle };
});

const effectiveExifFields = computed(() => {
  return selectedImage.value?.customSettings?.exifFields ?? exifFields.value;
});

const effectiveShowExif = computed(() => {
  return selectedImage.value?.customSettings?.showExif ?? showExif.value;
});

const effectiveExifTextAlign = computed(() => {
  return selectedImage.value?.customSettings?.exifTextAlign ?? exifTextAlign.value;
});

const effectiveExifTextOffset = computed(() => {
  return selectedImage.value?.customSettings?.exifTextOffset ?? exifTextOffset.value;
});

const effectiveExifTextOffsetX = computed(() => {
  return selectedImage.value?.customSettings?.exifTextOffsetX ?? exifTextOffsetX.value;
});

const effectiveExifTextOffsetY = computed(() => {
  return selectedImage.value?.customSettings?.exifTextOffsetY ?? exifTextOffsetY.value;
});

const effectiveExifFont = computed(() => {
  return selectedImage.value?.customSettings?.exifFontFamily ?? exifFont.value;
});

const effectiveExifFontSize = computed(() => {
  return selectedImage.value?.customSettings?.exifFontSize ?? exifFontSize.value;
});

const effectiveExifColor = computed(() => {
  return selectedImage.value?.customSettings?.exifTextColor ?? exifColor.value;
});

const effectiveLogoConfig = computed(() => {
  // Combine preset and custom logos for backward compatibility
  // Priority: custom logo settings > preset logo settings > default
  const configs: LogoConfig[] = [];

  // Add preset logo if configured
  if (selectedImage.value?.customSettings?.presetLogoConfig) {
    configs.push(selectedImage.value.customSettings.presetLogoConfig);
  } else if (presetLogoConfig.value) {
    configs.push(presetLogoConfig.value);
  }

  // Add custom logo if configured
  if (selectedImage.value?.customSettings?.customLogoConfig) {
    configs.push(selectedImage.value.customSettings.customLogoConfig);
  } else if (customLogoConfig.value) {
    configs.push(customLogoConfig.value);
  }

  return logoConfig.value;
});

// Sync settings when switching images
watch(() => selectedImage.value?.id, (newId, oldId) => {
  if (!selectedImage.value || newId === oldId) return;

  // Set flag to prevent auto-save
  isLoadingSettings.value = true;

  // Load this image's custom settings into UI if it has any
  if (selectedImage.value.customSettings) {
    const custom = selectedImage.value.customSettings;

    // Sync UI with this image's custom settings
    if (custom.borderStyle) {
      borderStyle.value = { ...getDefaultBorderStyle(), ...custom.borderStyle };
    }
    if (custom.exifFields) exifFields.value = [...custom.exifFields];
    if (custom.showExif !== undefined) showExif.value = custom.showExif;
    if (custom.exifTextAlign !== undefined) exifTextAlign.value = custom.exifTextAlign;
    if (custom.exifTextOffset !== undefined) exifTextOffset.value = custom.exifTextOffset;
    if (custom.exifTextOffsetX !== undefined) exifTextOffsetX.value = custom.exifTextOffsetX;
    if (custom.exifTextOffsetY !== undefined) exifTextOffsetY.value = custom.exifTextOffsetY;
    if (custom.exifFontFamily !== undefined) exifFont.value = custom.exifFontFamily;
    if (custom.exifFontSize !== undefined) exifFontSize.value = custom.exifFontSize;
    if (custom.exifTextColor !== undefined) exifColor.value = custom.exifTextColor;
    if (custom.outputWidth !== undefined) outputWidth.value = custom.outputWidth;
    if (custom.outputHeight !== undefined) outputHeight.value = custom.outputHeight;
    if (custom.maintainAspectRatio !== undefined) maintainAspectRatio.value = custom.maintainAspectRatio;
    if (custom.quality !== undefined) quality.value = custom.quality;
    if (custom.logoConfig) logoConfig.value = { ...custom.logoConfig };
    if (custom.presetLogoConfig) presetLogoConfig.value = { ...custom.presetLogoConfig };
    if (custom.customLogoConfig) customLogoConfig.value = { ...custom.customLogoConfig };
  }
  // If no custom settings, keep current UI values (they represent global defaults)

  // Clear flag after a tick to allow UI to update
  void nextTick(() => {
    isLoadingSettings.value = false;
  });
});

// Processing state
const { isProcessing } = useImageProcessor();
const batchProcessor = useBatchProcessor();
const showBatchProgress = ref(false);
const processingCurrent = ref(0);
const processingTotal = ref(0);

// Watch for selected image changes and settings changes to update preview
watch(
  () => [
    selectedImage.value,
    effectiveBorderStyle.value,
    effectiveExifFields.value,
    effectiveShowExif.value,
    effectiveExifTextAlign.value,
    effectiveExifTextOffset.value,
    effectiveExifTextOffsetX.value,
    effectiveExifTextOffsetY.value,
    effectiveExifFont.value,
    effectiveExifFontSize.value,
    effectiveExifColor.value,
    outputWidth.value,
    outputHeight.value,
    maintainAspectRatio.value,
    quality.value,
    effectiveLogoConfig.value,
    presetLogoConfig.value,
    customLogoConfig.value,
  ],
  () => {
    // Use nextTick to ensure component is ready
    void nextTick(() => {
      void refreshPreview();
    });
  },
  { deep: true, flush: 'post' },
);

// Helper function to get process options for a specific image
const getOptionsForImage = (image: ImageFile): ProcessOptions => {
  // Get effective settings for this image
  const imgBorderStyle = image.customSettings?.borderStyle
    ? { ...borderStyle.value, ...image.customSettings.borderStyle }
    : borderStyle.value;

  const imgExifFields = image.customSettings?.exifFields ?? exifFields.value;
  const imgShowExif = image.customSettings?.showExif ?? showExif.value;
  const imgExifTextAlign = image.customSettings?.exifTextAlign ?? exifTextAlign.value;
  const imgExifTextOffset = image.customSettings?.exifTextOffset ?? exifTextOffset.value;
  const imgExifTextOffsetX = image.customSettings?.exifTextOffsetX ?? exifTextOffsetX.value;
  const imgExifTextOffsetY = image.customSettings?.exifTextOffsetY ?? exifTextOffsetY.value;
  const imgExifFont = image.customSettings?.exifFontFamily ?? exifFont.value;
  const imgExifFontSize = image.customSettings?.exifFontSize ?? exifFontSize.value;
  const imgExifColor = image.customSettings?.exifTextColor ?? exifColor.value;
  const imgOutputWidth = image.customSettings?.outputWidth ?? outputWidth.value;
  const imgOutputHeight = image.customSettings?.outputHeight ?? outputHeight.value;
  const imgMaintainAspect = image.customSettings?.maintainAspectRatio ?? maintainAspectRatio.value;
  const imgQuality = image.customSettings?.quality ?? quality.value;

  // Logo: combine preset and custom logos
  const imgPresetLogoConfig = image.customSettings?.presetLogoConfig ?? presetLogoConfig.value;
  const imgCustomLogoConfig = image.customSettings?.customLogoConfig ?? customLogoConfig.value;
  const imgLogoConfig = image.customSettings?.logoConfig ?? logoConfig.value;
  const imgLogoConfigs = image.customSettings?.logoConfigs ?? logoConfigs.value;

  // Build logo configs array from preset and custom
  const combinedLogoConfigs: LogoConfig[] = [];
  if (imgPresetLogoConfig) combinedLogoConfigs.push(imgPresetLogoConfig);
  if (imgCustomLogoConfig) combinedLogoConfigs.push(imgCustomLogoConfig);

  const borderStyleWithOptions: BorderStyle = {
    ...imgBorderStyle,
    showExif: imgShowExif,
    showLogo: !!(imgLogoConfig || combinedLogoConfigs.length > 0),
  };

  const options: Record<string, unknown> = {
    borderStyle: borderStyleWithOptions,
    exifFields: imgExifFields,
    exifTextAlign: imgExifTextAlign,
    exifTextOffset: imgExifTextOffset,
    exifTextOffsetX: imgExifTextOffsetX,
    exifTextOffsetY: imgExifTextOffsetY,
    exifFontFamily: imgExifFont,
    exifFontSize: imgExifFontSize,
    exifTextColor: imgExifColor,
    maintainAspectRatio: imgMaintainAspect,
    quality: imgQuality,
  };

  // Support both single and multiple logos
  if (combinedLogoConfigs.length > 0) {
    options.logoConfigs = combinedLogoConfigs;
    options.logoConfig = combinedLogoConfigs[0];
  } else if (imgLogoConfigs && imgLogoConfigs.length > 0) {
    options.logoConfigs = imgLogoConfigs;
    options.logoConfig = imgLogoConfigs[0];
  } else if (imgLogoConfig) {
    options.logoConfig = imgLogoConfig;
  }
  if (imgOutputWidth !== undefined) {
    options.outputWidth = imgOutputWidth;
  }
  if (imgOutputHeight !== undefined) {
    options.outputHeight = imgOutputHeight;
  }

  return options as unknown as ProcessOptions;
};

// Methods
const refreshPreview = async () => {
  if (!selectedImage.value || !previewRef.value) return;

  const options = getOptionsForImage(selectedImage.value);
  await previewRef.value.updatePreview(selectedImage.value, options);
};


const handlePresetLogoChange = (config: LogoConfig | undefined) => {
  presetLogoConfig.value = config;
  // Mark current image as having custom preset logo setting
  if (selectedImage.value) {
    updateCurrentImageCustomSettings({ presetLogoConfig: config });
  }
  // Refresh preview to show the logo
  void refreshPreview();
};

const handleCustomLogoChange = (config: LogoConfig | undefined) => {
  customLogoConfig.value = config;
  // Mark current image as having custom custom logo setting
  if (selectedImage.value) {
    updateCurrentImageCustomSettings({ customLogoConfig: config });
  }
  // Refresh preview to show the logo
  void refreshPreview();
};


// Update current image's custom settings with current UI values
const updateCurrentImageCustomSettings = (additionalSettings?: Partial<ImageCustomSettings>) => {
  if (!selectedImage.value) return;

  const customSettings: ImageCustomSettings = {
    borderStyle: { ...borderStyle.value },
    exifFields: [...exifFields.value],
    showExif: showExif.value,
    exifTextAlign: exifTextAlign.value,
    exifTextOffset: exifTextOffset.value,
    exifTextOffsetX: exifTextOffsetX.value,
    exifTextOffsetY: exifTextOffsetY.value,
    exifFontFamily: exifFont.value,
    exifFontSize: exifFontSize.value,
    exifTextColor: exifColor.value,
    outputWidth: outputWidth.value,
    outputHeight: outputHeight.value,
    maintainAspectRatio: maintainAspectRatio.value,
    quality: quality.value,
    logoConfig: logoConfig.value ? { ...logoConfig.value } : undefined,
    ...additionalSettings,
  };

  selectedImage.value.customSettings = customSettings;
};

// Sync settings from first image to all images without custom settings
const syncDefaultsToOtherImages = () => {
  if (!selectedImage.value) return;

  // Only sync if we're modifying the first image
  const currentImageId = selectedImage.value?.id;
  if (!currentImageId) return;
  const firstImage = imageStore.images[0];
  const isFirstImage = firstImage && firstImage.id === currentImageId;
  if (!isFirstImage) return;

  // Sync to all images that don't have custom settings
  for (const image of imageStore.images) {
    if (image.id !== selectedImage.value.id && !image.customSettings) {
      image.customSettings = {
        borderStyle: { ...borderStyle.value },
        exifFields: [...exifFields.value],
        showExif: showExif.value,
        exifTextAlign: exifTextAlign.value,
        exifTextOffset: exifTextOffset.value,
        exifTextOffsetX: exifTextOffsetX.value,
        exifTextOffsetY: exifTextOffsetY.value,
        exifFontFamily: exifFont.value,
        exifFontSize: exifFontSize.value,
        exifTextColor: exifColor.value,
        outputWidth: outputWidth.value,
        outputHeight: outputHeight.value,
        maintainAspectRatio: maintainAspectRatio.value,
        quality: quality.value,
        logoConfig: logoConfig.value ? { ...logoConfig.value } : undefined,
        presetLogoConfig: presetLogoConfig.value ? { ...presetLogoConfig.value } : undefined,
        customLogoConfig: customLogoConfig.value ? { ...customLogoConfig.value } : undefined,
      };
    }
  }
};

// Watch for settings changes
watch(
  [
    () => borderStyle.value,
    () => exifFields.value,
    () => showExif.value,
    () => exifTextAlign.value,
    () => exifTextOffset.value,
    () => exifTextOffsetX.value,
    () => exifTextOffsetY.value,
    () => exifFont.value,
    () => exifFontSize.value,
    () => exifColor.value,
    () => outputWidth.value,
    () => outputHeight.value,
    () => maintainAspectRatio.value,
    () => quality.value,
    () => presetLogoConfig.value,
    () => customLogoConfig.value,
  ],
  () => {
    // Don't save if we're just loading settings during image switch
    if (isLoadingSettings.value || !selectedImage.value) return;

    // Save to current image
    updateCurrentImageCustomSettings();

    // If modifying first image, sync to others without custom settings
    syncDefaultsToOtherImages();
  },
  { deep: true },
);

const handleProcess = async () => {
  if (imageStore.images.length === 0) return;

  // Clear previous batch and add tasks with per-image options
  batchProcessor.clearTasks();

  for (const image of imageStore.images) {
    const options = getOptionsForImage(image);
    batchProcessor.addTask(image, options);
  }

  // Show progress panel
  showBatchProgress.value = true;

  // Process all images
  try {
    await batchProcessor.processAll({
      concurrent: 1, // Process one at a time for stability
      delayBetweenTasks: 50, // Small delay between images
      onProgress: (progress) => {
        processingCurrent.value = progress.current;
        processingTotal.value = progress.total;
      },
      onTaskComplete: (task) => {
        if (uploaderRef.value && task.result) {
          uploaderRef.value.updateImageStatus(task.id, 'completed', task.result.url);
        }
      },
      onTaskError: (task) => {
        if (uploaderRef.value) {
          uploaderRef.value.updateImageStatus(task.id, 'error', undefined, task.error);
        }
      },
      onComplete: () => {
        isProcessing.value = false;
      },
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    isProcessing.value = false;
  }
};

const handleDownloadAll = () => {
  const processedImages = imageStore.images.filter((img) => img.processedUrl);

  for (const image of processedImages) {
    if (image.processedUrl) {
      const link = document.createElement('a');
      link.href = image.processedUrl;
      link.download = `border_${image.name}`;
      link.click();
    }
  }
};

const handlePreviewDownload = (url: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = 'preview.jpg';
  link.click();
};

// Batch processor event handlers
const handlePause = () => {
  batchProcessor.pause();
};

const handleResume = () => {
  batchProcessor.resume();
};

const handleCancel = () => {
  batchProcessor.cancel();
  showBatchProgress.value = false;
};

const handleRetry = () => {
  batchProcessor.retryFailed();
  void handleProcess();
};

const handleCloseProgress = () => {
  showBatchProgress.value = false;
};

// Apply current image's settings to all other images
const handleApplyToOthers = async () => {
  if (!selectedImage.value || imageStore.images.length <= 1) return;

  // Get current settings from UI
  const currentSettings: ImageCustomSettings = {
    borderStyle: { ...borderStyle.value },
    exifFields: [...exifFields.value],
    showExif: showExif.value,
    exifTextAlign: exifTextAlign.value,
    exifTextOffset: exifTextOffset.value,
    exifTextOffsetX: exifTextOffsetX.value,
    exifTextOffsetY: exifTextOffsetY.value,
    exifFontFamily: exifFont.value,
    exifFontSize: exifFontSize.value,
    exifTextColor: exifColor.value,
    outputWidth: outputWidth.value,
    outputHeight: outputHeight.value,
    maintainAspectRatio: maintainAspectRatio.value,
    quality: quality.value,
    logoConfig: logoConfig.value ? { ...logoConfig.value } : undefined,
    presetLogoConfig: presetLogoConfig.value ? { ...presetLogoConfig.value } : undefined,
    customLogoConfig: customLogoConfig.value ? { ...customLogoConfig.value } : undefined,
  };

  // Apply to all other images
  for (const image of imageStore.images) {
    if (image.id !== selectedImage.value.id) {
      image.customSettings = { ...currentSettings };
    }
  }

  // Show success notification
  const { Notify } = await import('quasar');
  Notify.create({
    type: 'positive',
    message: `已将当前设置应用到 ${imageStore.images.length - 1} 张照片`,
    position: 'top',
    timeout: 2000,
  });
};
</script>

<style scoped lang="scss">
.main-page {
  padding: 8px;
}

.page-header {
  padding: 4px 0;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
}

.preview-settings-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: $breakpoint-md) {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.preview-section {
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.settings-section {
  :deep(.border-style-selector) {
    .q-card {
      margin-bottom: 0;
    }

    .text-h6 {
      font-size: 1.1rem;
    }
  }

  :deep(.q-card-section) {
    padding: 8px;
  }

  // Settings panel styles
  :deep(.settings-panel) {
    min-height: 500px;
    max-height: 700px;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* EXIF and Logo cards - more compact */
.exif-field-selector,
.logo-manager {
  :deep(.q-toggle) {
    font-size: 13px;
  }

  :deep(.q-list) {
    max-height: 250px;
    overflow-y: auto;
  }

  :deep(.text-subtitle2) {
    font-size: 0.95rem;
  }
}

/* Compact card headers */
.flex {
  display: flex;
  align-items: center;
}

/* Responsive adjustments */
@media (max-width: $breakpoint-sm) {
  .main-page {
    padding: 4px;
  }

  .action-buttons {
    .q-btn {
      flex: 1;
      min-width: 120px;
    }
  }
}
</style>
