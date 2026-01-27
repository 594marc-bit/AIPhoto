<template>
  <div class="logo-manager">
    <!-- Show Logo Toggle -->
    <q-toggle
      :model-value="showLogo"
      label="显示 Logo"
      color="primary"
      @update:model-value="updateShowLogo"
    />

    <template v-if="showLogo">
      <!-- Preset Logos Section -->
      <q-expansion-item
        icon="collections"
        label="预设 Logo"
        class="q-mt-md"
        default-opened
      >
        <q-card flat bordered class="q-mt-sm">
          <q-card-section>
            <div class="row q-col-gutter-sm">
              <div
                v-for="logo in PRESET_LOGOS"
                :key="logo.id"
                class="col-4 col-sm-3 col-md-2"
              >
                <q-card
                  :class="['logo-card', { selected: isPresetLogoSelected(logo.id) }]"
                  flat
                  bordered
                  clickable
                  @click="togglePresetLogo(logo)"
                >
                  <q-card-section class="q-pa-sm">
                    <img :src="logo.url" :alt="logo.name" class="logo-preview" />
                  </q-card-section>
                  <div class="text-caption text-center q-px-sm q-pb-sm">{{ logo.name }}</div>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <!-- Custom Logo Section -->
      <q-expansion-item
        icon="upload"
        label="自定义 Logo"
        class="q-mt-sm"
        default-opened
      >
        <q-card flat bordered class="q-mt-sm">
          <q-card-section class="q-pa-sm">
            <!-- Selected Custom Logos -->
            <div v-if="customLogos.length > 0" class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">已上传的自定义 Logo</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="(customLogo, index) in customLogos"
                  :key="customLogo.id"
                  class="col-6 col-sm-4 col-md-3"
                >
                  <q-card flat bordered class="custom-logo-item">
                    <q-card-section class="q-pa-sm">
                      <img :src="customLogo.url" :alt="customLogo.name" class="custom-logo-preview" />
                      <div class="text-caption text-center q-mt-xs">{{ customLogo.name }}</div>
                      <q-btn
                        flat
                        color="negative"
                        label="移除"
                        size="sm"
                        class="full-width q-mt-xs"
                        @click="removeCustomLogo(index)"
                      />
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Upload Button -->
            <q-uploader
              url=""
              label="点击或拖放上传 Logo 图片"
              accept=".png,.jpg,.jpeg,.svg"
              max-files="1"
              flat
              bordered
              :disable="!canUseCustomLogo"
              @added="onCustomLogoUpload"
            >
              <template v-if="!canUseCustomLogo" #header>
                <q-tooltip>登录后可使用自定义Logo</q-tooltip>
              </template>
            </q-uploader>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <!-- Logo Position and Size Controls (Unified) -->
      <q-expansion-item
        v-if="hasAnyLogo"
        icon="tune"
        :label="activeLogoType === 'custom' ? '自定义 Logo 位置和样式' : '预设 Logo 位置和样式'"
        class="q-mt-sm"
        default-opened
      >
        <q-card flat bordered class="q-mt-sm">
          <q-card-section>
            <!-- Logo Type Selector (when both types are present) -->
            <div v-if="hasPresetLogo && hasCustomLogo" class="q-mb-md">
              <div class="text-caption q-mb-sm">选择要调整的 Logo 类型：</div>
              <div class="row q-gutter-sm">
                <q-btn
                  :flat="activeLogoType !== 'preset'"
                  :color="activeLogoType === 'preset' ? 'primary' : 'grey-7'"
                  label="预设 Logo"
                  @click="activeLogoType = 'preset'"
                />
                <q-btn
                  :flat="activeLogoType !== 'custom'"
                  :color="activeLogoType === 'custom' ? 'primary' : 'grey-7'"
                  label="自定义 Logo"
                  @click="activeLogoType = 'custom'"
                />
              </div>
            </div>

            <!-- Horizontal Position -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">水平位置</div>
                <div class="text-caption text-grey q-ml-auto">{{ activeOffsetX }}%</div>
              </div>
              <q-slider
                :model-value="activeOffsetX"
                :min="-50"
                :max="50"
                markers
                label-always
                @update:model-value="updateActiveOffsetX"
              />
            </div>

            <!-- Vertical Position -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">上下位置</div>
                <div class="text-caption text-grey q-ml-auto">{{ activeOffsetY }}%</div>
              </div>
              <q-slider
                :model-value="activeOffsetY"
                :min="-90"
                :max="20"
                markers
                label-always
                @update:model-value="updateActiveOffsetY"
              />
            </div>

            <!-- Size -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">Logo 大小</div>
                <div class="text-caption text-grey q-ml-auto">{{ activeSize }}%</div>
              </div>
              <q-slider
                :model-value="activeSize"
                :min="1"
                :max="20"
                :step="0.5"
                markers
                label-always
                @update:model-value="updateActiveSize"
              />
            </div>

            <!-- Opacity -->
            <div class="q-mb-md">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">不透明度</div>
                <div class="text-caption text-grey q-ml-auto">{{ activeOpacity }}%</div>
              </div>
              <q-slider
                :model-value="activeOpacity"
                :min="10"
                :max="100"
                markers
                label-always
                @update:model-value="updateActiveOpacity"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { PRESET_LOGOS, autoMatchLogo } from '@/utils/logoLibrary';
import type { LogoConfig, ExifData } from '@/types/image';
import { useUserStore } from '@/stores/userStore';

interface Props {
  modelValue?: LogoConfig;
  exifData?: ExifData | null;
  bottomHeightPercent?: number;
  disableEmit?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: LogoConfig | undefined): void;
  (e: 'update:logoConfigs', value: LogoConfig[] | undefined): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// User store for permissions
const userStore = useUserStore();
const canUseCustomLogo = computed(() => userStore.canUseCustomLogo);

// Default logo size
const defaultLogoSize = 8;

// State
const showLogo = ref(props.modelValue?.showLogo ?? true);
const selectedPresetLogoIds = ref<string[]>([]);
const customLogos = ref<LogoConfig[]>([]);

// Flag to control emit during auto-match or settings load
const isInternalUpdate = ref(false);

// Preset logo settings
const logoSize = ref(props.modelValue?.size ?? defaultLogoSize);
const logoOpacity = ref((props.modelValue?.opacity ?? 1) * 100);
const logoOffsetX = ref(props.modelValue?.offsetX ?? -50);
const logoOffsetY = ref(props.modelValue?.offsetY ?? 0);

// Custom logo settings (independent)
const customLogoSize = ref(8);
const customLogoOpacity = ref(100);
const customLogoOffsetX = ref(-50);
const customLogoOffsetY = ref(0);

// Active logo type for unified controls ('preset' or 'custom')
const activeLogoType = ref<'preset' | 'custom'>('preset');

// Check if any logo is selected
const hasAnyLogo = computed(() => selectedPresetLogoIds.value.length > 0 || customLogos.value.length > 0);
const hasCustomLogo = computed(() => customLogos.value.length > 0);
const hasPresetLogo = computed(() => selectedPresetLogoIds.value.length > 0);

// Computed values for unified controls - based on active logo type
const activeOffsetX = computed(() => activeLogoType.value === 'preset' ? logoOffsetX.value : customLogoOffsetX.value);
const activeOffsetY = computed(() => activeLogoType.value === 'preset' ? logoOffsetY.value : customLogoOffsetY.value);
const activeSize = computed(() => activeLogoType.value === 'preset' ? logoSize.value : customLogoSize.value);
const activeOpacity = computed(() => activeLogoType.value === 'preset' ? logoOpacity.value : customLogoOpacity.value);

// Auto-switch active logo type when only one type is present
watch([hasPresetLogo, hasCustomLogo], ([hasPreset, hasCustom]) => {
  if (hasPreset && !hasCustom) {
    activeLogoType.value = 'preset';
  } else if (hasCustom && !hasPreset) {
    activeLogoType.value = 'custom';
  }
  // If both are present, keep current selection
});

// Methods
const updateShowLogo = (value: boolean) => {
  showLogo.value = value;
  if (!value) {
    emit('update:modelValue', undefined);
  } else {
    if (!hasAnyLogo.value && props.exifData) {
      const matchedLogo = autoMatchLogo(props.exifData);
      if (matchedLogo) {
        togglePresetLogo(matchedLogo);
        return;
      }
    }
    emitConfig();
  }
};

const isPresetLogoSelected = (logoId: string) => {
  return selectedPresetLogoIds.value.includes(logoId);
};

const togglePresetLogo = (logo: LogoConfig) => {
  const index = selectedPresetLogoIds.value.indexOf(logo.id);
  if (index > -1) {
    selectedPresetLogoIds.value.splice(index, 1);
  } else {
    selectedPresetLogoIds.value.push(logo.id);
  }
  emitConfig();
};

const onCustomLogoUpload = (files: readonly File[]) => {
  const file = files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target?.result as string;
    const newLogo: LogoConfig = {
      id: `custom_${Date.now()}`,
      name: file.name,
      url,
      position: 'bottom',
      align: 'center',
      size: customLogoSize.value,
      opacity: customLogoOpacity.value / 100,
      offsetX: customLogoOffsetX.value,
      offsetY: customLogoOffsetY.value,
    };

    // Allow custom logo to coexist with preset logos
    customLogos.value.push(newLogo);
    emitConfig();
  };
  reader.readAsDataURL(file);
};

const removeCustomLogo = (index: number) => {
  customLogos.value.splice(index, 1);
  emitConfig();
};

// Unified update methods - based on active logo type
const updateActiveOffsetX = (value: number | null) => {
  if (value === null) return;
  if (activeLogoType.value === 'preset') {
    logoOffsetX.value = value;
  } else {
    customLogoOffsetX.value = value;
  }
  emitConfig();
};

const updateActiveOffsetY = (value: number | null) => {
  if (value === null) return;
  if (activeLogoType.value === 'preset') {
    logoOffsetY.value = value;
  } else {
    customLogoOffsetY.value = value;
  }
  emitConfig();
};

const updateActiveSize = (value: number | null) => {
  if (value === null) return;
  if (activeLogoType.value === 'preset') {
    logoSize.value = value;
  } else {
    customLogoSize.value = value;
  }
  emitConfig();
};

const updateActiveOpacity = (value: number | null) => {
  if (value === null) return;
  if (activeLogoType.value === 'preset') {
    logoOpacity.value = value;
  } else {
    customLogoOpacity.value = value;
  }
  emitConfig();
};

const emitConfig = () => {
  if (isInternalUpdate.value) return;

  if (!showLogo.value || !hasAnyLogo.value) {
    emit('update:modelValue', undefined);
    emit('update:logoConfigs', undefined);
    return;
  }

  // Collect all selected logos with their settings
  const logoConfigs: LogoConfig[] = [];

  // Add preset logos
  for (const logoId of selectedPresetLogoIds.value) {
    const presetLogo = PRESET_LOGOS.find(l => l.id === logoId);
    if (presetLogo) {
      logoConfigs.push({
        id: presetLogo.id,
        name: presetLogo.name,
        url: presetLogo.url,
        position: 'bottom',
        align: 'center',
        size: logoSize.value,
        opacity: logoOpacity.value / 100,
        offsetX: logoOffsetX.value,
        offsetY: logoOffsetY.value,
      });
    }
  }

  // Add custom logos
  for (const customLogo of customLogos.value) {
    logoConfigs.push({
      id: customLogo.id,
      name: customLogo.name,
      url: customLogo.url,
      position: 'bottom',
      align: 'center',
      size: customLogoSize.value,
      opacity: customLogoOpacity.value / 100,
      offsetX: customLogoOffsetX.value,
      offsetY: customLogoOffsetY.value,
    });
  }

  // Emit multiple logos
  emit('update:logoConfigs', logoConfigs.length > 0 ? logoConfigs : undefined);

  // For backward compatibility, also emit single logo (first one or priority to preset)
  if (logoConfigs.length > 0) {
    emit('update:modelValue', logoConfigs[0]);
  } else {
    emit('update:modelValue', undefined);
  }
};

// Initialize
isInternalUpdate.value = true;
if (props.modelValue) {
  showLogo.value = true;

  // Check if current logo is a preset or custom
  const presetLogo = PRESET_LOGOS.find(l => l.id === props.modelValue?.id);
  if (presetLogo) {
    // It's a preset logo, use preset settings
    selectedPresetLogoIds.value = [props.modelValue.id];
    logoSize.value = props.modelValue.size;
    logoOpacity.value = props.modelValue.opacity * 100;
    logoOffsetX.value = props.modelValue.offsetX ?? -50;
    logoOffsetY.value = props.modelValue.offsetY ?? 0;
    activeLogoType.value = 'preset';
  } else {
    // It's a custom logo, use custom settings
    customLogos.value = [{ ...props.modelValue }];
    customLogoSize.value = props.modelValue.size;
    customLogoOpacity.value = props.modelValue.opacity * 100;
    customLogoOffsetX.value = props.modelValue.offsetX ?? -50;
    customLogoOffsetY.value = props.modelValue.offsetY ?? 0;
    activeLogoType.value = 'custom';
  }
}
void nextTick(() => {
  isInternalUpdate.value = false;
});

// Watch for EXIF data changes to auto-match logo
watch(() => props.exifData, (newExif, oldExif) => {
  if (showLogo.value && newExif?.make && !hasAnyLogo.value) {
    const exifChanged = oldExif?.make !== newExif.make || oldExif?.model !== newExif.model;
    if (exifChanged) {
      const matchedLogo = autoMatchLogo(newExif);
      if (matchedLogo) {
        isInternalUpdate.value = true;
        togglePresetLogo(matchedLogo);
        void nextTick(() => {
          isInternalUpdate.value = false;
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
      // It's a preset logo, use preset settings
      selectedPresetLogoIds.value = [newValue.id];
      customLogos.value = [];
      logoSize.value = newValue.size;
      logoOpacity.value = newValue.opacity * 100;
      logoOffsetX.value = newValue.offsetX ?? -50;
      logoOffsetY.value = newValue.offsetY ?? 0;
      activeLogoType.value = 'preset';
    } else {
      // It's a custom logo, use custom settings
      customLogos.value = [{ ...newValue }];
      selectedPresetLogoIds.value = [];
      customLogoSize.value = newValue.size;
      customLogoOpacity.value = newValue.opacity * 100;
      customLogoOffsetX.value = newValue.offsetX ?? -50;
      customLogoOffsetY.value = newValue.offsetY ?? 0;
      activeLogoType.value = 'custom';
    }
    void nextTick(() => {
      isInternalUpdate.value = false;
    });
  }
});
</script>

<style scoped lang="scss">
.logo-manager {
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

  .custom-logo-item {
    .custom-logo-preview {
      width: 100%;
      max-width: 150px;
      max-height: 60px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
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
