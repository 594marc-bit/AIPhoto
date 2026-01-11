<template>
  <q-page>
    <div class="text-h4 text-weight-bold q-mb-md">AI 照片边框处理</div>
    <div class="text-subtitle1 text-grey q-mb-lg">
      上传照片，添加边框、EXIF 信息和品牌 Logo
    </div>

    <div class="row q-col-gutter-lg">
      <!-- Left Column: Upload -->
      <div class="col-12 col-md-6">
        <!-- Upload Section -->
        <image-uploader ref="uploaderRef" class="q-mb-md" />

        <!-- Preview Display -->
        <div v-if="hasImages" class="preview-section">
          <image-preview
            ref="previewRef"
            @download="handlePreviewDownload"
          />
        </div>

        <!-- Action Buttons -->
        <div v-if="hasImages" class="row q-gutter-sm q-mt-md">
          <q-btn
            color="primary"
            :label="userStore.isGuest ? '处理照片' : '批量处理'"
            icon="done_all"
            size="lg"
            :loading="isProcessing"
            :disable="isProcessing || !canProcess"
            @click="handleProcess"
          >
            <q-tooltip v-if="!canProcess">
              访客最多处理{{ maxImagesPerBatch }}张图片，登录后可处理更多
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="processedCount > 0 && !userStore.isGuest"
            color="secondary"
            label="下载全部"
            icon="download"
            size="lg"
            @click="handleDownloadAll"
          />
        </div>

        <!-- Batch limit warning for guest users -->
        <q-banner v-if="hasTooManyImages" class="bg-warning text-white q-mt-md rounded-borders">
          <template v-slot:avatar>
            <q-icon name="warning" />
          </template>
          <div>
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

      <!-- Right Column: Settings Panels -->
      <div class="col-12 col-md-6">
        <q-tabs v-model="settingsTab" dense class="q-mb-md">
          <q-tab name="border" label="边框" icon="photo_size_select_large" />
          <q-tab name="size" label="尺寸" icon="aspect_ratio" />
        </q-tabs>

        <q-tab-panels v-model="settingsTab" animated>
          <!-- Border Style Tab -->
          <q-tab-panel name="border">
            <border-style-selector
              v-model="borderStyle"
              :image-width="firstImageWidth"
              :image-height="firstImageHeight"
              class="q-mb-md"
            />

            <!-- EXIF and Logo Side by Side -->
            <div class="row q-col-gutter-md">
              <!-- EXIF Settings -->
              <div class="col-12 col-sm-6">
                <q-card flat bordered>
                  <q-card-section class="bg-primary text-white">
                    <div class="text-subtitle2 flex items-center">
                      <q-icon name="info" class="q-mr-sm" />
                      EXIF 设置
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <exif-field-selector
                      v-model="exifFields"
                      v-model:show-exif="showExif"
                      v-model:text-align="exifTextAlign"
                      v-model:text-offset="exifTextOffset"
                      v-model:text-offset-x="exifTextOffsetX"
                      v-model:text-offset-y="exifTextOffsetY"
                      v-model:font-family="exifFont"
                      v-model:font-size="exifFontSize"
                      v-model:text-color="exifColor"
                      :exif-data="selectedImage?.exif || null"
                      :image-width="selectedImage?.width || 1920"
                    />
                  </q-card-section>
                </q-card>
              </div>

              <!-- Logo Settings -->
              <div class="col-12 col-sm-6">
                <q-card flat bordered>
                  <q-card-section class="bg-primary text-white">
                    <div class="text-subtitle2 flex items-center">
                      <q-icon name="copyright" class="q-mr-sm" />
                      Logo 设置
                    </div>
                  </q-card-section>
                  <q-card-section>
                    <logo-manager
                      v-bind="logoConfig ? { modelValue: logoConfig } : {}"
                      :exif-data="selectedImage?.exif || null"
                      :bottom-height-percent="borderStyle.bottomHeightPercent ?? 5"
                      @update:model-value="handleLogoChange"
                    />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-tab-panel>

          <!-- Size Tab -->
          <q-tab-panel name="size">
            <size-adjuster
              v-model:output-width="outputWidth"
              v-model:output-height="outputHeight"
              v-model:maintain-aspect-ratio="maintainAspectRatio"
              v-model:quality="quality"
              :original-width="firstImageWidth"
              :original-height="firstImageHeight"
            />
          </q-tab-panel>
        </q-tab-panels>

        <!-- Quick Preview Button -->
        <q-btn
          v-if="selectedImage"
          color="primary"
          label="刷新预览"
          icon="refresh"
          flat
          class="q-mt-md"
          @click="refreshPreview"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import ImageUploader from '@/components/ImageUploader.vue';
import ImagePreview from '@/components/ImagePreview.vue';
import BorderStyleSelector from '@/components/BorderStyleSelector.vue';
import ExifFieldSelector from '@/components/ExifFieldSelector.vue';
import SizeAdjuster from '@/components/SizeAdjuster.vue';
import LogoManager from '@/components/LogoManager.vue';
import BatchProgress from '@/components/BatchProgress.vue';
import { useImageProcessor } from '@/composables/useImageProcessor';
import { useBatchProcessor } from '@/composables/useBatchProcessor';
import { useImageStore } from '@/stores/imageStore';
import { useUserStore } from '@/stores/userStore';
import type { BorderStyle, LogoConfig, ImageFile, ProcessOptions } from '@/types/image';
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

// Settings state
const settingsTab = ref('border');
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
const logoConfig = ref<LogoConfig>();

// Processing state
const { isProcessing, processingProgress } = useImageProcessor();
const batchProcessor = useBatchProcessor();
const showBatchProgress = ref(false);
const processingCurrent = ref(0);
const processingTotal = ref(0);

// Computed
const hasImages = computed(() => imageStore.images.length > 0);
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

// Watch for image changes to reset border style with appropriate bottom height
watch(
  () => [firstImageWidth.value, firstImageHeight.value],
  ([width, height]) => {
    // Only update if this is the first image or border style hasn't been customized
    // Check if borderStyle still has default values
    const isDefault = borderStyle.value.id === 'custom' ||
      borderStyle.value.id === 'default';
    if (isDefault && width && height) {
      const defaultStyle = getDefaultBorderStyle(width, height);
      // Preserve any customizations the user might have made
      borderStyle.value = {
        ...borderStyle.value,
        bottomHeightPercent: defaultStyle.bottomHeightPercent ?? 5,
      };
    }
  },
  { immediate: true }
);

// Watch for selected image changes and settings changes to update preview
watch(
  () => [
    selectedImage.value,
    borderStyle.value,
    exifFields.value,
    showExif.value,
    exifTextAlign.value,
    exifTextOffset.value,
    exifTextOffsetX.value,
    exifTextOffsetY.value,
    exifFont.value,
    exifFontSize.value,
    exifColor.value,
    outputWidth.value,
    outputHeight.value,
    maintainAspectRatio.value,
    quality.value,
    logoConfig.value,
  ],
  () => {
    // Use nextTick to ensure component is ready
    nextTick(() => {
      refreshPreview();
    });
  },
  { deep: true, flush: 'post' },
);

// Methods
const refreshPreview = async () => {
  if (!selectedImage.value || !previewRef.value) return;

  // Create borderStyle with showExif and showLogo
  const borderStyleWithOptions: BorderStyle = {
    ...borderStyle.value,
    showExif: showExif.value,
    showLogo: !!logoConfig.value,
  };

  const options: Record<string, unknown> = {
    borderStyle: borderStyleWithOptions,
    exifFields: exifFields.value,
    exifTextAlign: exifTextAlign.value,
    exifTextOffset: exifTextOffset.value,
    exifTextOffsetX: exifTextOffsetX.value,
    exifTextOffsetY: exifTextOffsetY.value,
    exifFontFamily: exifFont.value,
    exifFontSize: exifFontSize.value,
    exifTextColor: exifColor.value,
    maintainAspectRatio: maintainAspectRatio.value,
    quality: quality.value,
  };

  // Only add optional properties if they have values
  if (logoConfig.value) {
    options.logoConfig = logoConfig.value;
  }
  if (outputWidth.value !== undefined) {
    options.outputWidth = outputWidth.value;
  }
  if (outputHeight.value !== undefined) {
    options.outputHeight = outputHeight.value;
  }

  await previewRef.value.updatePreview(selectedImage.value, options as any);
};

const handleLogoChange = (config: LogoConfig | undefined) => {
  logoConfig.value = config;
};

const handleProcess = async () => {
  if (imageStore.images.length === 0) return;

  // Create borderStyle with showExif and showLogo
  const borderStyleWithOptions: BorderStyle = {
    ...borderStyle.value,
    showExif: showExif.value,
    showLogo: !!logoConfig.value,
  };

  const options: Record<string, unknown> = {
    borderStyle: borderStyleWithOptions,
    exifFields: exifFields.value,
    exifTextAlign: exifTextAlign.value,
    exifTextOffset: exifTextOffset.value,
    exifTextOffsetX: exifTextOffsetX.value,
    exifTextOffsetY: exifTextOffsetY.value,
    exifFontFamily: exifFont.value,
    exifFontSize: exifFontSize.value,
    exifTextColor: exifColor.value,
    maintainAspectRatio: maintainAspectRatio.value,
    quality: quality.value,
  };

  // Only add optional properties if they have values
  if (logoConfig.value) {
    options.logoConfig = logoConfig.value;
  }
  if (outputWidth.value !== undefined) {
    options.outputWidth = outputWidth.value;
  }
  if (outputHeight.value !== undefined) {
    options.outputHeight = outputHeight.value;
  }

  // Clear previous batch and add new tasks
  batchProcessor.clearTasks();
  batchProcessor.addTasks(imageStore.images, options as unknown as ProcessOptions);

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

  processedImages.forEach((image) => {
    if (image.processedUrl) {
      const link = document.createElement('a');
      link.href = image.processedUrl;
      link.download = `border_${image.name}`;
      link.click();
    }
  });
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
  handleProcess();
};

const handleCloseProgress = () => {
  showBatchProgress.value = false;
};
</script>

<style scoped>
/* Preview section - natural height */
.preview-section {
  margin-top: 16px;
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

/* EXIF and Logo cards */
.exif-field-selector,
.logo-manager {
  :deep(.q-toggle) {
    font-size: 14px;
  }

  :deep(.q-list) {
    max-height: 300px;
    overflow-y: auto;
  }
}

/* Card header icons */
.flex {
  display: flex;
}
</style>
