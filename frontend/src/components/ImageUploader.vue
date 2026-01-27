<template>
  <div class="image-uploader">
    <!-- Image List with Dynamic Drop Zone -->
    <div class="image-list-container">
      <!-- Header -->
      <div class="row items-center justify-between q-mb-md">
        <p class="text-subtitle1 q-ma-none">已上传图片 ({{ imageStore.images.length }})</p>
        <q-btn
          v-if="imageStore.images.length > 0"
          flat
          color="negative"
          label="清空全部"
          icon="delete_sweep"
          size="sm"
          @click="confirmClear"
        />
      </div>

      <!-- Image Grid with Dynamic Drop Zone -->
      <div class="row q-col-gutter-md">
        <!-- Uploaded Images -->
        <div v-for="image in imageStore.images" :key="image.id" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card
            class="image-card cursor-pointer"
            :class="{ 'is-selected': imageStore.selectedImageId === image.id }"
            @click="selectImage(image.id)"
          >
            <q-card-section class="q-pa-none">
              <div class="image-preview">
                <img :src="image.url" :alt="image.name" />
                <!-- Selected indicator -->
                <div v-if="imageStore.selectedImageId === image.id" class="image-selected">
                  <q-icon name="check_circle" color="primary" size="32px" />
                </div>
                <div class="image-overlay">
                  <q-btn
                    round
                    color="negative"
                    icon="delete"
                    size="sm"
                    @click.stop="imageStore.removeImage(image.id)"
                  />
                </div>
                <div v-if="image.status === 'processing'" class="image-processing">
                  <q-spinner color="primary" size="40px" />
                  <span>处理中...</span>
                </div>
                <div v-else-if="image.status === 'completed'" class="image-status completed">
                  <q-icon name="check_circle" color="positive" size="24px" />
                </div>
                <div v-else-if="image.status === 'error'" class="image-status error">
                  <q-icon name="error" color="negative" size="24px" />
                </div>
              </div>
            </q-card-section>
            <q-card-section class="q-pa-sm">
              <div class="text-subtitle2 ellipsis">{{ image.name }}</div>
              <div class="text-caption text-grey">
                {{ imageStore.formatFileSize(image.size) }} · {{ Math.round(image.width ?? 0) }}×{{ Math.round(image.height ?? 0) }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Dynamic Drop Zone Card -->
        <div v-if="!uploadDisabled" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card
            :class="['drop-zone-card cursor-pointer', { 'is-dragging': imageStore.isDragging }]"
            @drop="imageStore.onDrop"
            @dragover="imageStore.onDragOver"
            @dragleave="imageStore.onDragLeave"
            @click="selectFiles"
          >
            <q-card-section class="q-pa-none">
              <div class="drop-zone-preview">
                <div class="drop-zone-content">
                  <q-icon name="add_photo_alternate" size="48px" color="primary" />
                  <p class="text-subtitle2 q-mb-sm">添加图片</p>
                  <p class="text-caption text-grey">拖放或点击上传</p>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  style="display: none"
                  @change="imageStore.onFileSelect"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Guest Limit Warning Card -->
        <div v-if="uploadDisabled" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card class="drop-zone-card disabled-zone">
            <q-card-section class="q-pa-none">
              <div class="drop-zone-preview">
                <div class="drop-zone-content text-center">
                  <q-icon name="lock" size="48px" color="grey-5" />
                  <p class="text-subtitle2 q-mb-sm text-grey-7">访客限制</p>
                  <p class="text-caption text-grey">只能上传1张图片</p>
                  <q-btn
                    flat
                    color="primary"
                    label="登录解除限制"
                    size="sm"
                    class="q-mt-md"
                    @click.stop="$emit('showLogin')"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Upload Errors -->
    <div v-if="imageStore.uploadErrors.length > 0" class="q-mt-md">
      <q-banner v-for="error in imageStore.uploadErrors" :key="error" class="bg-negative text-white q-mb-sm">
        <template #avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
      </q-banner>
    </div>

    <!-- Clear Confirmation Dialog -->
    <q-dialog v-model="showClearDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">确认清空</div>
        </q-card-section>
        <q-card-section>确定要清空所有已上传的图片吗？</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" v-close-popup />
          <q-btn flat label="清空" color="negative" @click="clearImages" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useImageStore } from '@/stores/imageStore';
import { useUserStore } from '@/stores/userStore';
import type { ImageFile } from '@/types/image';

const imageStore = useImageStore();
const userStore = useUserStore();

const fileInput = ref<HTMLInputElement>();
const showClearDialog = ref(false);

// Check if upload is disabled for guest (already has 1 image)
const uploadDisabled = computed(() => {
  return userStore.isGuest && imageStore.images.length >= 1;
});

const selectFiles = () => {
  if (uploadDisabled.value) {
    return;
  }
  fileInput.value?.click();
};

const confirmClear = () => {
  showClearDialog.value = true;
};

const clearImages = () => {
  imageStore.clearImages();
  showClearDialog.value = false;
};

const selectImage = (id: string) => {
  imageStore.selectImage(id);
};

defineExpose({
  get images() {
    return imageStore.images;
  },
  updateImageStatus: (id: string, status: ImageFile['status'], processedUrl?: string, error?: string) => {
    imageStore.updateImageStatus(id, status, processedUrl, error);
  },
});
</script>

<style scoped lang="scss">
.image-uploader {
  .image-list-container {
    // Container styles if needed
  }

  // Drop zone card - same size as image cards
  .drop-zone-card {
    transition: all 0.3s ease;
    border: 2px dashed $grey-4;
    background-color: $grey-1;

    &:hover {
      border-color: $primary;
      background-color: rgba($primary, 0.05);
    }

    &.is-dragging {
      border-color: $primary;
      background-color: rgba($primary, 0.1);
      transform: scale(1.02);
    }

    &.disabled-zone {
      border-color: $grey-4;
      background-color: $grey-2;
      cursor: not-allowed;

      &:hover {
        border-color: $grey-4;
        background-color: $grey-2;
      }
    }

    .drop-zone-preview {
      position: relative;
      width: 100%;
      padding-top: 75%; // 4:3 aspect ratio - same as image cards
      overflow: hidden;
      background-color: $grey-2;

      .drop-zone-content {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
    }
  }

  // Image cards
  .image-card {
    transition: all 0.3s ease;

    &.is-selected {
      border: 2px solid $primary;
      box-shadow: 0 0 0 2px rgba($primary, 0.2);
    }

    .image-preview {
      position: relative;
      width: 100%;
      padding-top: 75%; // 4:3 aspect ratio
      overflow: hidden;
      background-color: $grey-2;

      img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-selected {
        position: absolute;
        top: 8px;
        left: 8px;
        background-color: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 10;
      }

      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;

        &:hover {
          opacity: 1;
        }
      }

      .image-processing,
      .image-status {
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .image-processing {
        width: auto;
        height: auto;
        padding: 8px;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
    }
  }
}
</style>
