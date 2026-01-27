<template>
  <div class="preset-logo-selector">
    <!-- Show Logo Toggle - Default ON -->
    <q-toggle
      :model-value="showLogo"
      label="显示 Logo"
      color="primary"
      @update:model-value="updateShowLogo"
    />

    <template v-if="showLogo">
      <!-- Preset Logos Grid -->
      <div class="q-mt-md">
        <div class="text-caption q-mb-sm">选择品牌 Logo（仅支持一个）：</div>
        <div class="row q-col-gutter-sm">
          <div
            v-for="logo in PRESET_LOGOS"
            :key="logo.id"
            class="col-4 col-sm-3 col-md-2"
          >
            <q-card
              :class="['logo-card', { selected: isSelected(logo.id) }]"
              flat
              bordered
              clickable
              @click="selectLogo(logo)"
            >
              <q-card-section class="q-pa-sm">
                <img :src="logo.url" :alt="logo.name" class="logo-preview" />
              </q-card-section>
              <div class="text-caption text-center q-px-sm q-pb-sm">{{ logo.name }}</div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Logo Position and Size Controls - Show when logo is selected -->
      <q-expansion-item
        v-if="selectedLogo"
        icon="tune"
        label="Logo 位置和样式"
        class="q-mt-sm"
        default-opened
      >
        <q-card flat bordered class="q-mt-sm">
          <q-card-section>
            <!-- Horizontal Position - Default 0 -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">水平位置</div>
                <div class="text-caption text-grey q-ml-auto">{{ logoOffsetX }}%</div>
              </div>
              <q-slider
                :model-value="logoOffsetX"
                :min="-50"
                :max="50"
                markers
                label-always
                @update:model-value="updateOffsetX"
              />
            </div>

            <!-- Vertical Position -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">上下位置</div>
                <div class="text-caption text-grey q-ml-auto">{{ logoOffsetY }}%</div>
              </div>
              <q-slider
                :model-value="logoOffsetY"
                :min="-90"
                :max="20"
                markers
                label-always
                @update:model-value="updateOffsetY"
              />
            </div>

            <!-- Size -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">Logo 大小</div>
                <div class="text-caption text-grey q-ml-auto">{{ logoSize }}%</div>
              </div>
              <q-slider
                :model-value="logoSize"
                :min="1"
                :max="20"
                :step="0.5"
                markers
                label-always
                @update:model-value="updateSize"
              />
            </div>

            <!-- Opacity -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">不透明度</div>
                <div class="text-caption text-grey q-ml-auto">{{ logoOpacity }}%</div>
              </div>
              <q-slider
                :model-value="logoOpacity"
                :min="10"
                :max="100"
                markers
                label-always
                @update:model-value="updateOpacity"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { PRESET_LOGOS, autoMatchLogo } from '@/utils/logoLibrary';
import type { LogoConfig, ExifData } from '@/types/image';

interface Props {
  modelValue?: LogoConfig | undefined;
  exifData?: ExifData | null | undefined;
  bottomHeightPercent?: number;
  disableEmit?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: LogoConfig | undefined): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Default settings - Horizontal position defaults to 0 as per task requirement
const defaultLogoSize = 8;
const defaultLogoOffsetX = 0; // Changed from -50 to 0 as per task requirement

// State
const showLogo = ref(true); // Default ON as per task requirement
const selectedLogo = ref<LogoConfig | undefined>(undefined);

// Logo settings
const logoSize = ref(defaultLogoSize);
const logoOpacity = ref(100);
const logoOffsetX = ref(defaultLogoOffsetX);
const logoOffsetY = ref(0);

// Flag to control emit during auto-match or settings load
const isInternalUpdate = ref(false);

// Methods
const isSelected = (logoId: string) => {
  return selectedLogo.value?.id === logoId;
};

const selectLogo = (logo: LogoConfig) => {
  // If already selected, deselect it
  if (selectedLogo.value?.id === logo.id) {
    selectedLogo.value = undefined;
  } else {
    // Only support one logo as per task requirement
    selectedLogo.value = { ...logo };
  }
  emitConfig();
};

const updateShowLogo = (value: boolean) => {
  showLogo.value = value;
  if (!value) {
    emit('update:modelValue', undefined);
  } else {
    // When turning on, auto-match if no logo selected
    if (!selectedLogo.value && props.exifData) {
      const matchedLogo = autoMatchLogo(props.exifData);
      if (matchedLogo) {
        selectLogo(matchedLogo);
        return;
      }
    }
    emitConfig();
  }
};

const updateOffsetX = (value: number | null) => {
  if (value === null) return;
  logoOffsetX.value = value;
  emitConfig();
};

const updateOffsetY = (value: number | null) => {
  if (value === null) return;
  logoOffsetY.value = value;
  emitConfig();
};

const updateSize = (value: number | null) => {
  if (value === null) return;
  logoSize.value = value;
  emitConfig();
};

const updateOpacity = (value: number | null) => {
  if (value === null) return;
  logoOpacity.value = value;
  emitConfig();
};

const emitConfig = () => {
  if (isInternalUpdate.value) return;

  if (!showLogo.value || !selectedLogo.value) {
    emit('update:modelValue', undefined);
    return;
  }

  emit('update:modelValue', {
    ...selectedLogo.value,
    size: logoSize.value,
    opacity: logoOpacity.value / 100,
    offsetX: logoOffsetX.value,
    offsetY: logoOffsetY.value,
  });
};

// Initialize from props
isInternalUpdate.value = true;
if (props.modelValue) {
  showLogo.value = true;
  const presetLogo = PRESET_LOGOS.find(l => l.id === props.modelValue?.id);
  if (presetLogo) {
    selectedLogo.value = { ...presetLogo };
    logoSize.value = props.modelValue.size;
    logoOpacity.value = props.modelValue.opacity * 100;
    logoOffsetX.value = props.modelValue.offsetX ?? defaultLogoOffsetX;
    logoOffsetY.value = props.modelValue.offsetY ?? 0;
  }
}
void nextTick(() => {
  isInternalUpdate.value = false;
});

// Watch for EXIF data changes to auto-match logo
// When photo is loaded, automatically display brand logo as per task requirement
watch(() => props.exifData, (newExif, oldExif) => {
  console.log('[PresetLogoSelector] exifData watch triggered:', {
    showLogo: showLogo.value,
    newExif,
    oldExif,
    selectedLogo: selectedLogo.value?.id
  });
  if (showLogo.value && newExif?.make) {
    const exifChanged = !oldExif || oldExif.make !== newExif.make || oldExif.model !== newExif.model;
    console.log('[PresetLogoSelector] exifChanged:', exifChanged, '!selectedLogo.value:', !selectedLogo.value);
    if (exifChanged && !selectedLogo.value) {
      const matchedLogo = autoMatchLogo(newExif);
      console.log('[PresetLogoSelector] matchedLogo:', matchedLogo);
      if (matchedLogo) {
        // Set the selected logo and emit immediately without waiting for nextTick
        // This ensures the parent component gets the update before preview refresh
        selectedLogo.value = { ...matchedLogo };
        // Emit the config directly without going through emitConfig
        emit('update:modelValue', {
          ...matchedLogo,
          size: logoSize.value,
          opacity: logoOpacity.value / 100,
          offsetX: logoOffsetX.value,
          offsetY: logoOffsetY.value,
        });
      }
    }
  }
}, { immediate: true });

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    isInternalUpdate.value = true;
    showLogo.value = true;
    const presetLogo = PRESET_LOGOS.find(l => l.id === newValue.id);
    if (presetLogo) {
      selectedLogo.value = { ...presetLogo };
      logoSize.value = newValue.size;
      logoOpacity.value = newValue.opacity * 100;
      logoOffsetX.value = newValue.offsetX ?? defaultLogoOffsetX;
      logoOffsetY.value = newValue.offsetY ?? 0;
    } else {
      // Not a preset logo, clear selection
      selectedLogo.value = undefined;
    }
    void nextTick(() => {
      isInternalUpdate.value = false;
    });
  }
});
</script>

<style scoped lang="scss">
.preset-logo-selector {
  .logo-card {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    &.selected {
      border-color: $primary;
      background-color: rgba($primary, 0.05);
    }

    .logo-preview {
      width: 100%;
      height: 40px;
      object-fit: contain;
    }
  }

  // Shorten slider length
  :deep(.q-slider) {
    max-width: 85%;
    margin: 0 auto;
  }

  .text-caption {
    min-height: 18px;
    display: flex;
    align-items: center;
  }
}
</style>
