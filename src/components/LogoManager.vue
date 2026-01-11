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
      <!-- Logo Source Selection -->
      <div class="q-mt-md">
        <div class="text-subtitle2 q-mb-sm">选择 Logo</div>
        <q-btn-group flat>
          <q-btn
            :flat="logoSource !== 'preset'"
            :color="logoSource === 'preset' ? 'primary' : 'grey'"
            label="预设"
            @click="logoSource = 'preset'"
          />
          <q-btn
            :flat="logoSource !== 'custom'"
            :color="logoSource === 'custom' ? 'primary' : 'grey'"
            label="自定义"
            :disable="!canUseCustomLogo"
            @click="canUseCustomLogo && (logoSource = 'custom')"
          >
            <q-tooltip v-if="!canUseCustomLogo">登录后可使用自定义Logo</q-tooltip>
          </q-btn>
          <q-btn
            :flat="logoSource !== 'text'"
            :color="logoSource === 'text' ? 'primary' : 'grey'"
            label="文字"
            @click="logoSource = 'text'"
          />
        </q-btn-group>
      </div>

      <!-- Preset Logos -->
      <div v-if="logoSource === 'preset'" class="q-mt-md">
        <div class="row q-col-gutter-sm">
          <div
            v-for="logo in PRESET_LOGOS"
            :key="logo.id"
            class="col-4 col-sm-3 col-md-2"
          >
            <q-card
              :class="['logo-card', { selected: selectedLogo?.id === logo.id }]"
              flat
              bordered
              clickable
              @click="selectPresetLogo(logo)"
            >
              <q-card-section class="q-pa-sm">
                <img :src="logo.url" :alt="logo.name" class="logo-preview" />
              </q-card-section>
              <div class="text-caption text-center q-px-sm q-pb-sm">{{ logo.name }}</div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Custom Logo Upload -->
      <div v-else-if="logoSource === 'custom'" class="q-mt-md">
        <div v-if="customLogoUrl" class="q-mb-md">
          <q-card flat bordered>
            <q-card-section class="q-pa-md">
              <div class="row items-center q-gutter-md">
                <img :src="customLogoUrl" alt="Custom Logo" class="custom-logo-preview" />
                <div class="col">
                  <div class="text-subtitle2">{{ customLogoName }}</div>
                  <q-btn flat color="negative" label="移除" size="sm" @click="removeCustomLogo" />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <q-uploader
          v-else
          url=""
          label="点击或拖放上传 Logo 图片"
          accept=".png,.jpg,.jpeg,.svg"
          max-files="1"
          flat
          bordered
          @added="onCustomLogoUpload"
          @removed="removeCustomLogo"
        />
      </div>

      <!-- Text Logo -->
      <div v-else-if="logoSource === 'text'" class="q-mt-md">
        <q-input
          v-model="textLogo"
          label="Logo 文字"
          outlined
          dense
          @update:model-value="generateTextLogo"
        >
          <template #append>
            <q-color
              v-model="textLogoColor"
              style="width: 40px"
              class="no-border"
              flat
              @update:model-value="generateTextLogo"
            />
          </template>
        </q-input>
        <div v-if="textLogoUrl" class="q-mt-md">
          <q-card flat bordered>
            <q-card-section class="q-pa-md">
              <img :src="textLogoUrl" alt="Text Logo" class="text-logo-preview" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Logo Position and Size Controls -->
      <q-expansion-item
        v-if="selectedLogo"
        icon="tune"
        label="Logo 位置和样式"
        class="q-mt-md"
        default-opened
      >
        <q-card flat bordered class="q-mt-sm">
          <q-card-section>
            <!-- Horizontal Position -->
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
                @update:model-value="updateLogoOffsetX"
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
                @update:model-value="updateLogoOffsetY"
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
                @update:model-value="updateLogoSize"
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
                @update:model-value="updateLogoOpacity"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { PRESET_LOGOS, generateTextLogo as generateTextLogoUtil, autoMatchLogo } from '@/utils/logoLibrary';
import type { LogoConfig, ExifData } from '@/types/image';
import { useUserStore } from '@/stores/userStore';

interface Props {
  modelValue?: LogoConfig;
  exifData?: ExifData | null;
  bottomHeightPercent?: number; // Bottom border height as percentage of image height
}

interface Emits {
  (e: 'update:modelValue', value: LogoConfig | undefined): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// User store for permissions
const userStore = useUserStore();
const canUseCustomLogo = computed(() => userStore.canUseCustomLogo);

// Calculate default logo size based on bottom border height
// Logo size should be 3/5 of bottom border height, as percentage of image width
const defaultLogoSize = computed(() => {
  if (!props.bottomHeightPercent) return 10;
  // bottomHeightPercent is relative to image height
  // We need to convert to percentage of image width
  // Assuming typical aspect ratio, we approximate
  return (props.bottomHeightPercent * 3 / 5);
});

// State
const showLogo = ref(props.modelValue?.showLogo ?? false);
const logoSource = ref<'preset' | 'custom' | 'text'>('preset');
const selectedLogo = ref<LogoConfig | undefined>(props.modelValue);
const customLogoUrl = ref<string>();
const customLogoName = ref<string>();
const textLogo = ref('MY LOGO');
const textLogoColor = ref('#ffffff');
const textLogoUrl = ref<string>();

// Logo settings - default to left edge (-50%) and calculated size
const logoSize = ref(props.modelValue?.size ?? defaultLogoSize.value);
const logoOpacity = ref((props.modelValue?.opacity ?? 1) * 100);
const logoOffsetX = ref(props.modelValue?.offsetX ?? -50); // Default to left edge
const logoOffsetY = ref(props.modelValue?.offsetY ?? 0);

// Methods
const updateShowLogo = (value: boolean) => {
  showLogo.value = value;
  if (!value) {
    emit('update:modelValue', undefined);
  } else {
    // Auto-match logo when enabling if no logo is selected
    if (!selectedLogo.value && props.exifData) {
      const matchedLogo = autoMatchLogo(props.exifData);
      if (matchedLogo) {
        selectPresetLogo(matchedLogo);
        return;
      }
    }
    emitConfig();
  }
};

const selectPresetLogo = (logo: LogoConfig) => {
  selectedLogo.value = logo;
  logoSize.value = logo.size;
  logoOpacity.value = logo.opacity * 100;
  logoOffsetX.value = logo.offsetX ?? 0;
  logoOffsetY.value = logo.offsetY ?? 0;
  emitConfig();
};

const onCustomLogoUpload = async (files: readonly File[]) => {
  const file = files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target?.result as string;
    customLogoUrl.value = url;
    customLogoName.value = file.name;

    selectedLogo.value = {
      id: `custom_${Date.now()}`,
      name: file.name,
      url,
      position: 'bottom',
      align: 'center',
      size: logoSize.value,
      opacity: logoOpacity.value / 100,
      offsetX: logoOffsetX.value,
      offsetY: logoOffsetY.value,
    };

    emitConfig();
  };
  reader.readAsDataURL(file);
};

const removeCustomLogo = () => {
  customLogoUrl.value = undefined;
  customLogoName.value = undefined;
  selectedLogo.value = undefined;
};

const generateTextLogo = () => {
  if (!textLogo.value) return;
  textLogoUrl.value = generateTextLogoUtil(textLogo.value, textLogoColor.value);

  selectedLogo.value = {
    id: `text_${Date.now()}`,
    name: textLogo.value,
    url: textLogoUrl.value,
    position: 'bottom',
    align: 'center',
    size: logoSize.value,
    opacity: logoOpacity.value / 100,
    offsetX: logoOffsetX.value,
    offsetY: logoOffsetY.value,
  };

  emitConfig();
};

const updateLogoOffsetX = (value: number | null) => {
  if (value === null) return;
  logoOffsetX.value = value;
  emitConfig();
};

const updateLogoOffsetY = (value: number | null) => {
  if (value === null) return;
  logoOffsetY.value = value;
  emitConfig();
};

const updateLogoSize = (value: number | null) => {
  if (value === null) return;
  logoSize.value = value;
  emitConfig();
};

const updateLogoOpacity = (value: number | null) => {
  if (value === null) return;
  logoOpacity.value = value;
  emitConfig();
};

const emitConfig = () => {
  if (!showLogo.value || !selectedLogo.value) {
    emit('update:modelValue', undefined);
    return;
  }

  const config: LogoConfig = {
    ...selectedLogo.value,
    position: 'bottom',
    align: 'center',
    size: logoSize.value,
    opacity: logoOpacity.value / 100,
    offsetX: logoOffsetX.value,
    offsetY: logoOffsetY.value,
  };

  emit('update:modelValue', config);
};

// Initialize
if (props.modelValue) {
  showLogo.value = true;
  selectedLogo.value = props.modelValue;
  // Size is now a percentage of image width
  logoSize.value = props.modelValue.size >= 100 ? defaultLogoSize.value : props.modelValue.size;
  logoOpacity.value = props.modelValue.opacity * 100;
  logoOffsetX.value = props.modelValue.offsetX ?? -50;
  logoOffsetY.value = props.modelValue.offsetY ?? 0;
}

// Watch for EXIF data changes to auto-match logo when showLogo is enabled
watch(() => props.exifData, (newExif) => {
  // Only auto-match if showLogo is enabled and no logo is currently selected
  if (showLogo.value && !selectedLogo.value && newExif) {
    const matchedLogo = autoMatchLogo(newExif);
    if (matchedLogo) {
      selectPresetLogo(matchedLogo);
    }
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

  .custom-logo-preview,
  .text-logo-preview {
    max-width: 150px;
    max-height: 60px;
    object-fit: contain;
  }

  .logo-preview-container {
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
  }
}
</style>
