<template>
  <div class="image-preview-panel">
    <div class="text-h6 q-mb-md">实时预览</div>

    <div v-if="!hasPreview" class="preview-placeholder">
      <q-icon name="image_not_supported" size="80px" color="grey-4" />
      <p class="text-grey q-mt-md">选择图片以预览效果</p>
    </div>

    <div v-else class="preview-content">
      <!-- Preview Image -->
      <div class="preview-image-container">
        <q-spinner v-if="isGenerating" color="primary" size="40px" class="absolute-center" />
        <img
          v-if="!imageError"
          :key="previewUrl"
          :src="previewUrl"
          alt="Preview"
          class="preview-image"
          :class="{ loading: isGenerating }"
          @error="handleImageError"
          @load="handleImageLoad"
          crossorigin="anonymous"
        />
        <div v-if="imageError" class="image-error">
          <q-icon name="error" size="40px" color="negative" />
          <p class="text-negative q-mt-md">Failed to load preview image</p>
          <p class="text-caption text-grey">{{ imageError }}</p>
          <p class="text-caption text-grey q-mt-sm">
            Try downloading to view the full result.
          </p>
          <q-btn
            flat
            color="primary"
            label="Download Processed Image"
            icon="download"
            @click="handleDownload"
            class="q-mt-md"
          />
        </div>
      </div>

      <!-- Preview Actions -->
      <div class="row q-gutter-sm q-mt-md">
        <q-btn
          flat
          color="primary"
          label="下载"
          icon="download"
          :disable="isGenerating"
          @click="handleDownload"
        />
        <q-btn
          flat
          color="grey"
          label="清除预览"
          icon="clear"
          :disable="isGenerating"
          @click="handleClear"
        />
      </div>

      <!-- Preview Info -->
      <div v-if="previewImage" class="preview-info q-mt-md">
        <q-chip size="sm" icon="image">
          {{ previewImage.name }}
        </q-chip>
        <q-chip size="sm" icon="photo_size_select_large">
          {{ previewImage.width }} × {{ previewImage.height }}
        </q-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useImagePreview } from '@/composables/useImagePreview';
import type { ImageFile, ProcessOptions } from '@/types/image';

const {
  previewUrl,
  previewImage,
  isGenerating,
  hasPreview,
  generatePreview,
  clearPreview,
  downloadPreview,
} = useImagePreview();

const emit = defineEmits<{
  (e: 'download', url: string): void;
}>();

// Image error state
const imageError = ref<string | null>(null);

const updatePreview = async (image: ImageFile, options: ProcessOptions) => {
  imageError.value = null;
  await generatePreview(image, options);
};

const handleDownload = () => {
  if (previewImage.value) {
    const filename = `preview_${previewImage.value.name}`;
    downloadPreview(filename);
    emit('download', previewUrl.value);
  }
};

const handleClear = () => {
  clearPreview();
  imageError.value = null;
};

const handleImageError = (event: Event) => {
  console.error('[ImagePreview] Failed to load image:', event);
  const img = event.target as HTMLImageElement;
  console.error('[ImagePreview] Image src:', img.src);
  imageError.value = 'Failed to load image. Try downloading instead.';
};

const handleImageLoad = () => {
  console.log('[ImagePreview] Image loaded successfully');
  imageError.value = null;
};

defineExpose({
  updatePreview,
  clearPreview,
  hasPreview,
});
</script>

<style scoped lang="scss">
.image-preview-panel {
  .preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 500px;
    background-color: $grey-1;
    border-radius: 8px;
    border: 2px dashed $grey-3;
  }

  .preview-content {
    .preview-image-container {
      position: relative;
      background-color: $grey-1;
      border-radius: 8px;
      overflow: hidden;
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;

      .preview-image {
        max-width: 100%;
        max-height: 700px;
        object-fit: contain;

        &.loading {
          opacity: 0.5;
        }
      }

      .image-error {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 20px;
      }
    }

    .preview-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}
</style>
