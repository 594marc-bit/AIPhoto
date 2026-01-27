<template>
  <div class="border-style-selector">
    <div class="text-h6 q-mb-md">边框样式</div>

    <q-card flat bordered>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- Background Color -->
          <div class="col-12 col-sm-6">
            <q-input
              :model-value="modelValue?.backgroundColor"
              label="背景颜色"
              readonly
              dense
              outlined
            >
              <template #append>
                <q-icon
                  :name="showBgPicker ? 'colorize' : 'palette'"
                  :style="{ color: modelValue?.backgroundColor }"
                  class="cursor-pointer"
                  @click="showBgPicker = !showBgPicker"
                />
              </template>
            </q-input>
            <q-popup-proxy v-model="showBgPicker" cover transition-show="scale" transition-hide="scale">
              <q-color v-model="customBgColor" />
            </q-popup-proxy>
          </div>

          <!-- Blur Toggle -->
          <div class="col-12 col-sm-6">
            <q-toggle
              :model-value="modelValue?.blur ?? false"
              label="模糊效果"
              color="primary"
              @update:model-value="updateBlur"
            />
          </div>

          <!-- Shadow Toggle -->
          <div class="col-12 col-sm-6">
            <q-toggle
              :model-value="modelValue?.shadow ?? false"
              label="照片阴影"
              color="primary"
              @update:model-value="updateShadow"
            />
          </div>

          <!-- Top Border -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey q-mb-xs">上边框</div>
            <q-slider
              :model-value="modelValue?.topWidthPercent ?? 0"
              :min="0"
              :max="100"
              :step="1"
              markers
              label-always
              @update:model-value="updateTopWidth"
            />
          </div>

          <!-- Bottom Border -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey q-mb-xs">
              下边框
              <q-tooltip v-if="defaultBottomHeightPercent">
                推荐: {{ defaultBottomHeightPercent }}%
                {{ imageOrientation === 'landscape' ? '(横向照片)' : imageOrientation === 'portrait' ? '(纵向照片)' : '' }}
              </q-tooltip>
            </div>
            <q-slider
              :model-value="modelValue?.bottomHeightPercent ?? 0"
              :min="0"
              :max="100"
              :step="1"
              markers
              label-always
              @update:model-value="updateBottomHeight"
            />
          </div>

          <!-- Left Border -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey q-mb-xs">左边框</div>
            <q-slider
              :model-value="modelValue?.leftWidthPercent ?? 0"
              :min="0"
              :max="100"
              :step="1"
              markers
              label-always
              @update:model-value="updateLeftWidth"
            />
          </div>

          <!-- Right Border -->
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey q-mb-xs">右边框</div>
            <q-slider
              :model-value="modelValue?.rightWidthPercent ?? 0"
              :min="0"
              :max="100"
              :step="1"
              markers
              label-always
              @update:model-value="updateRightWidth"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { BorderStyle } from '@/types/image';

interface Props {
  modelValue?: BorderStyle;
  imageWidth?: number;
  imageHeight?: number;
}

interface Emits {
  (e: 'update:modelValue', value: BorderStyle): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showBgPicker = ref(false);
const customBgColor = ref(props.modelValue?.backgroundColor || '#ffffff');

// Calculate default bottom height based on image orientation
const defaultBottomHeightPercent = computed(() => {
  if (!props.imageWidth || !props.imageHeight) return null;
  if (props.imageWidth >= props.imageHeight) {
    return Math.round(100 / 9); // Landscape: ~11% of image height
  } else {
    return Math.round(100 / 14); // Portrait: ~7% of image height
  }
});

// Get image orientation for display
const imageOrientation = computed<'landscape' | 'portrait' | 'square'>(() => {
  if (!props.imageWidth || !props.imageHeight) return 'landscape';
  if (props.imageWidth > props.imageHeight) return 'landscape';
  if (props.imageWidth < props.imageHeight) return 'portrait';
  return 'square';
});

const updateStyle = (key: keyof BorderStyle, value: unknown) => {
  if (!props.modelValue) return;
  const newStyle = { ...props.modelValue, [key]: value };
  emit('update:modelValue', newStyle);
};

// Wrapper functions to handle null values from q-slider
const updateTopWidth = (value: number | null) => {
  if (value !== null) updateStyle('topWidthPercent', value);
};

const updateBottomHeight = (value: number | null) => {
  if (value !== null) updateStyle('bottomHeightPercent', value);
};

const updateLeftWidth = (value: number | null) => {
  if (value !== null) updateStyle('leftWidthPercent', value);
};

const updateRightWidth = (value: number | null) => {
  if (value !== null) updateStyle('rightWidthPercent', value);
};

const updateBlur = (value: boolean) => {
  updateStyle('blur', value);
};

const updateShadow = (value: boolean) => {
  updateStyle('shadow', value);
};

// Watch custom color changes
watch(customBgColor, (newColor) => {
  if (props.modelValue && newColor !== props.modelValue.backgroundColor) {
    updateStyle('backgroundColor', newColor);
  }
});
</script>

<style scoped lang="scss">
.border-style-selector {
  :deep(.q-card) {
    background-color: $grey-1;
  }

  // Shorten slider length and prevent text overlap
  :deep(.q-slider) {
    max-width: 85%;
    margin: 0 auto;
  }

  // Ensure label text doesn't overlap
  .text-caption {
    min-height: 18px;
    display: flex;
    align-items: center;
  }
}
</style>
