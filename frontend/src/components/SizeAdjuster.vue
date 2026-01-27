<template>
  <div class="size-adjuster">
    <div class="text-h6 q-mb-md">输出尺寸</div>

    <!-- Size Mode Selection -->
    <q-btn-group spread class="q-mb-md">
      <q-btn
        :flat="sizeMode !== 'original'"
        :color="sizeMode === 'original' ? 'primary' : 'grey'"
        label="原始尺寸"
        @click="setSizeMode('original')"
      />
      <q-btn
        :flat="sizeMode !== 'ratio'"
        :color="sizeMode === 'ratio' ? 'primary' : 'grey'"
        label="按比例"
        @click="setSizeMode('ratio')"
      />
      <q-btn
        :flat="sizeMode !== 'fixed'"
        :color="sizeMode === 'fixed' ? 'primary' : 'grey'"
        label="固定尺寸"
        @click="setSizeMode('fixed')"
      />
    </q-btn-group>

    <!-- Original Size Mode -->
    <div v-if="sizeMode === 'original'" class="q-gutter-md">
      <q-card flat bordered class="q-pa-md">
        <div class="text-caption text-grey q-mb-sm">保持图片原始尺寸</div>
        <div class="row q-col-gutter-sm">
          <div class="col">
            <q-input label="原始宽度" :model-value="originalWidth" readonly dense outlined>
              <template #append>px</template>
            </q-input>
          </div>
          <div class="col">
            <q-input label="原始高度" :model-value="originalHeight" readonly dense outlined>
              <template #append>px</template>
            </q-input>
          </div>
        </div>
      </q-card>
    </div>

    <!-- Ratio Size Mode -->
    <div v-else-if="sizeMode === 'ratio'" class="q-gutter-md">
      <q-card flat bordered class="q-pa-md">
        <div class="text-caption text-grey q-mb-sm">按比例缩放图片</div>
        <q-slider
          :model-value="scalePercent"
          :label="true"
          :min="10"
          :max="200"
          markers
          label-always
          @update:model-value="updateScalePercent"
        />
        <div class="row q-col-gutter-sm q-mt-md">
          <div class="col">
            <q-input label="输出宽度" :model-value="scaledWidth" readonly dense outlined>
              <template #append>px</template>
            </q-input>
          </div>
          <div class="col">
            <q-input label="输出高度" :model-value="scaledHeight" readonly dense outlined>
              <template #append>px</template>
            </q-input>
          </div>
        </div>
        <div class="row q-gutter-sm q-mt-sm">
          <q-btn
            v-for="preset in scalePresets"
            :key="preset.value"
            size="sm"
            :label="preset.label"
            :flat="scalePercent !== preset.value"
            :color="scalePercent === preset.value ? 'primary' : 'grey'"
            @click="updateScalePercent(preset.value)"
          />
        </div>
      </q-card>

      <!-- Max Size Limit -->
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-toggle
            :model-value="useMaxSize"
            label="限制最大尺寸"
            @update:model-value="updateUseMaxSize"
          />
          <q-input
            v-if="useMaxSize"
            :model-value="maxSize"
            type="number"
            label="最大尺寸"
            dense
            outlined
            style="width: 120px"
            @update:model-value="updateMaxSize"
          >
            <template #append>px</template>
          </q-input>
        </div>
      </q-card>
    </div>

    <!-- Fixed Size Mode -->
    <div v-else-if="sizeMode === 'fixed'" class="q-gutter-md">
      <q-card flat bordered class="q-pa-md">
        <div class="text-caption text-grey q-mb-sm">设置固定的输出尺寸</div>
        <div class="row q-col-gutter-sm">
          <div class="col">
            <q-input
              :model-value="fixedWidth"
              type="number"
              label="宽度"
              dense
              outlined
              @update:model-value="updateFixedWidth"
            >
              <template #append>px</template>
            </q-input>
          </div>
          <div class="col">
            <q-input
              :model-value="fixedHeight"
              type="number"
              label="高度"
              dense
              outlined
              @update:model-value="updateFixedHeight"
            >
              <template #append>px</template>
            </q-input>
          </div>
        </div>

        <q-toggle
          :model-value="maintainAspectRatio"
          label="保持宽高比"
          class="q-mt-md"
          @update:model-value="updateMaintainAspectRatio"
        />

        <!-- Common Presets -->
        <div class="q-mt-md">
          <div class="text-caption text-grey q-mb-sm">常用尺寸预设</div>
          <div class="row q-gutter-sm">
            <q-btn
              v-for="preset in commonSizes"
              :key="preset.name"
              size="sm"
              :label="preset.name"
              outline
              @click="applyPreset(preset)"
            />
          </div>
        </div>
      </q-card>
    </div>

    <!-- Quality Setting -->
    <q-expansion-item icon="tune" label="输出质量设置" class="q-mt-md">
      <q-card flat bordered class="q-mt-sm">
        <q-card-section>
          <q-slider
            :model-value="quality"
            :label="true"
            :min="50"
            :max="100"
            markers
            label-always
            @update:model-value="updateQuality"
          />
          <div class="text-caption text-grey q-mt-sm text-center">
            质量: {{ quality }}% (建议: 85-95%)
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';

interface SizePreset {
  name: string;
  width: number;
  height: number;
}

interface Props {
  originalWidth?: number;
  originalHeight?: number;
}

interface Emits {
  (e: 'update:outputWidth', value: number | undefined): void;
  (e: 'update:outputHeight', value: number | undefined): void;
  (e: 'update:maintainAspectRatio', value: boolean): void;
  (e: 'update:quality', value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  originalWidth: 1920,
  originalHeight: 1080,
});

const emit = defineEmits<Emits>();

// State
const sizeMode = ref<'original' | 'ratio' | 'fixed'>('original');
const scalePercent = ref(100);
const useMaxSize = ref(false);
const maxSize = ref(4096);
const fixedWidth = ref<number | undefined>(1920);
const fixedHeight = ref<number | undefined>(1080);
const maintainAspectRatio = ref(true);
const quality = ref(95);

// Scale presets
const scalePresets = [
  { label: '25%', value: 25 },
  { label: '50%', value: 50 },
  { label: '75%', value: 75 },
  { label: '100%', value: 100 },
  { label: '150%', value: 150 },
  { label: '200%', value: 200 },
];

// Common fixed sizes
const commonSizes: SizePreset[] = [
  { name: '1920×1080', width: 1920, height: 1080 },
  { name: '1280×720', width: 1280, height: 720 },
  { name: '1080×1080', width: 1080, height: 1080 },
  { name: '2048×2048', width: 2048, height: 2048 },
  { name: '4096×2160', width: 4096, height: 2160 },
  { name: 'Instagram', width: 1080, height: 1080 },
  { name: '微信', width: 1280, height: 1280 },
];

// Computed
const scaledWidth = computed(() => {
  return Math.round((props.originalWidth * scalePercent.value) / 100);
});

const scaledHeight = computed(() => {
  return Math.round((props.originalHeight * scalePercent.value) / 100);
});

// Methods
const setSizeMode = (mode: 'original' | 'ratio' | 'fixed') => {
  sizeMode.value = mode;

  if (mode === 'original') {
    emit('update:outputWidth', undefined);
    emit('update:outputHeight', undefined);
    emit('update:maintainAspectRatio', true);
  } else if (mode === 'ratio') {
    emit('update:outputWidth', scaledWidth.value);
    emit('update:outputHeight', scaledHeight.value);
    emit('update:maintainAspectRatio', true);
  } else if (mode === 'fixed') {
    emit('update:outputWidth', fixedWidth.value);
    emit('update:outputHeight', fixedHeight.value);
    emit('update:maintainAspectRatio', maintainAspectRatio.value);
  }
};

const updateScalePercent = (value: string | number | null) => {
  if (value === null) return;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  scalePercent.value = numValue;
  if (sizeMode.value === 'ratio') {
    let width = scaledWidth.value;
    let height = scaledHeight.value;

    // Apply max size limit if enabled
    if (useMaxSize.value) {
      if (width > maxSize.value || height > maxSize.value) {
        const ratio = Math.min(maxSize.value / width, maxSize.value / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
    }

    emit('update:outputWidth', width);
    emit('update:outputHeight', height);
  }
};

const updateUseMaxSize = (value: boolean) => {
  useMaxSize.value = value;
  updateScalePercent(scalePercent.value);
};

const updateMaxSize = (value: string | number | null) => {
  if (value === null) return;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  maxSize.value = numValue;
  updateScalePercent(scalePercent.value);
};

const updateFixedWidth = (value: string | number | null) => {
  const numValue = value === null ? undefined : (typeof value === 'string' ? parseFloat(value) : value);
  fixedWidth.value = numValue;
  if (sizeMode.value === 'fixed') {
    emit('update:outputWidth', fixedWidth.value);
  }
};

const updateFixedHeight = (value: string | number | null) => {
  const numValue = value === null ? undefined : (typeof value === 'string' ? parseFloat(value) : value);
  fixedHeight.value = numValue;
  if (sizeMode.value === 'fixed') {
    emit('update:outputHeight', fixedHeight.value);
  }
};

const updateMaintainAspectRatio = (value: boolean) => {
  maintainAspectRatio.value = value;
  emit('update:maintainAspectRatio', value);
};

const applyPreset = (preset: SizePreset) => {
  fixedWidth.value = preset.width;
  fixedHeight.value = preset.height;
  if (sizeMode.value === 'fixed') {
    emit('update:outputWidth', preset.width);
    emit('update:outputHeight', preset.height);
  }
};

const updateQuality = (value: string | number | null) => {
  if (value === null) return;
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  quality.value = numValue;
  emit('update:quality', numValue);
};

// Initialize with default values
onMounted(() => {
  // Only emit quality and maintainAspectRatio on mount
  // Don't set outputWidth/outputHeight unless user explicitly chooses a mode
  emit('update:quality', quality.value);
  emit('update:maintainAspectRatio', maintainAspectRatio.value);

  // If current mode is not 'original', sync the values
  if (sizeMode.value === 'ratio') {
    updateScalePercent(scalePercent.value);
  } else if (sizeMode.value === 'fixed' && fixedWidth.value && fixedHeight.value) {
    emit('update:outputWidth', fixedWidth.value);
    emit('update:outputHeight', fixedHeight.value);
  }
});
</script>

<style scoped lang="scss">
.size-adjuster {
  :deep(.q-card) {
    background-color: $grey-1;
  }
}
</style>
