<template>
  <div class="settings-panel">
    <q-tabs
      v-model="activeTab"
      dense
      vertical
      class="text-grey-7"
      active-color="primary"
      active-bg-color="grey-2"
      indicator-color="primary"
      :class="['settings-tabs', { 'settings-tabs-mobile': isMobile }]"
    >
      <q-tab name="border" icon="border_style" label="边框样式" />
      <q-tab name="exif" icon="info" label="EXIF设置" />
      <q-tab name="presetLogo" icon="collections" label="预设Logo" />
      <q-tab
        name="customLogo"
        icon="upload"
        label="自定义Logo"
        :disable="!canUseCustomLogo"
      >
        <q-tooltip v-if="!canUseCustomLogo">登录后可使用自定义Logo</q-tooltip>
      </q-tab>
    </q-tabs>

    <q-separator :vertical="!isMobile" />

    <q-tab-panels
      v-model="activeTab"
      animated
      :transition-prev="isMobile ? 'slide-down' : 'slide-right'"
      :transition-next="isMobile ? 'slide-up' : 'slide-left'"
      class="settings-panels col"
    >
      <!-- Border Style Panel -->
      <q-tab-panel name="border" class="q-pa-sm">
        <border-style-selector
          v-model="borderStyle"
          :image-width="imageWidth"
          :image-height="imageHeight"
        />
      </q-tab-panel>

      <!-- EXIF Settings Panel -->
      <q-tab-panel name="exif" class="q-pa-sm">
        <q-card flat bordered>
          <q-card-section class="bg-primary text-white q-py-sm">
            <div class="text-subtitle2 flex items-center">
              <q-icon name="info" class="q-mr-sm" size="xs" />
              EXIF 设置
            </div>
          </q-card-section>
          <q-card-section class="q-pa-sm">
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
              :exif-data="exifData"
              :image-width="imageWidth"
            />
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Preset Logo Panel -->
      <q-tab-panel name="presetLogo" class="q-pa-sm">
        <q-card flat bordered>
          <q-card-section class="bg-primary text-white q-py-sm">
            <div class="text-subtitle2 flex items-center">
              <q-icon name="collections" class="q-mr-sm" size="xs" />
              预设 Logo
            </div>
          </q-card-section>
          <q-card-section class="q-pa-sm">
            <preset-logo-selector
              :model-value="presetLogoConfig"
              :exif-data="exifData"
              :bottom-height-percent="borderStyle.bottomHeightPercent ?? 5"
              @update:model-value="emit('update:presetLogoConfig', $event)"
            />
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- Custom Logo Panel -->
      <q-tab-panel name="customLogo" class="q-pa-sm">
        <q-card flat bordered>
          <q-card-section class="bg-primary text-white q-py-sm">
            <div class="text-subtitle2 flex items-center">
              <q-icon name="upload" class="q-mr-sm" size="xs" />
              自定义 Logo
            </div>
          </q-card-section>
          <q-card-section class="q-pa-sm">
            <custom-logo-manager
              :model-value="customLogoConfig"
              :bottom-height-percent="borderStyle.bottomHeightPercent ?? 5"
              @update:model-value="emit('update:customLogoConfig', $event)"
            />
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import BorderStyleSelector from '@/components/BorderStyleSelector.vue';
import ExifFieldSelector from '@/components/ExifFieldSelector.vue';
import PresetLogoSelector from '@/components/PresetLogoSelector.vue';
import CustomLogoManager from '@/components/CustomLogoManager.vue';
import type { BorderStyle, LogoConfig, ExifData } from '@/types/image';

interface Props {
  borderStyle: BorderStyle;
  exifFields: string[];
  showExif: boolean;
  exifTextAlign: 'left' | 'center' | 'right';
  exifTextOffset: number;
  exifTextOffsetX: number;
  exifTextOffsetY: number;
  exifFont: string;
  exifFontSize: number;
  exifColor: string;
  presetLogoConfig?: LogoConfig | undefined;
  customLogoConfig?: LogoConfig | undefined;
  exifData?: ExifData | null;
  imageWidth: number;
  imageHeight: number;
}

interface Emits {
  (e: 'update:borderStyle', value: BorderStyle): void;
  (e: 'update:exifFields', value: string[]): void;
  (e: 'update:showExif', value: boolean): void;
  (e: 'update:exifTextAlign', value: 'left' | 'center' | 'right'): void;
  (e: 'update:exifTextOffset', value: number): void;
  (e: 'update:exifTextOffsetX', value: number): void;
  (e: 'update:exifTextOffsetY', value: number): void;
  (e: 'update:exifFont', value: string): void;
  (e: 'update:exifFontSize', value: number): void;
  (e: 'update:exifColor', value: string): void;
  (e: 'update:presetLogoConfig', value: LogoConfig | undefined): void;
  (e: 'update:customLogoConfig', value: LogoConfig | undefined): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// User store for permissions
const userStore = useUserStore();
const canUseCustomLogo = computed(() => userStore.canUseCustomLogo);

// Responsive detection
const isMobile = ref(window.innerWidth < 768);

// Update responsive state on resize
const updateResponsive = () => {
  isMobile.value = window.innerWidth < 768;
};

if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateResponsive);
}

// Active tab
const activeTab = ref('border');

// Border style
const borderStyle = computed({
  get: () => props.borderStyle,
  set: (value) => emit('update:borderStyle', value),
});

// EXIF settings
const exifFields = computed({
  get: () => props.exifFields,
  set: (value) => emit('update:exifFields', value),
});

const showExif = computed({
  get: () => props.showExif,
  set: (value) => emit('update:showExif', value),
});

const exifTextAlign = computed({
  get: () => props.exifTextAlign,
  set: (value) => emit('update:exifTextAlign', value),
});

const exifTextOffset = computed({
  get: () => props.exifTextOffset,
  set: (value) => emit('update:exifTextOffset', value),
});

const exifTextOffsetX = computed({
  get: () => props.exifTextOffsetX,
  set: (value) => emit('update:exifTextOffsetX', value),
});

const exifTextOffsetY = computed({
  get: () => props.exifTextOffsetY,
  set: (value) => emit('update:exifTextOffsetY', value),
});

const exifFont = computed({
  get: () => props.exifFont,
  set: (value) => emit('update:exifFont', value),
});

const exifFontSize = computed({
  get: () => props.exifFontSize,
  set: (value) => emit('update:exifFontSize', value),
});

const exifColor = computed({
  get: () => props.exifColor,
  set: (value) => emit('update:exifColor', value),
});
</script>

<style scoped lang="scss">
.settings-panel {
  display: flex;
  flex-direction: row;
  gap: 0;
  height: 100%;

  .settings-tabs {
    min-width: 120px;
    width: 120px;

    &.settings-tabs-mobile {
      width: 100%;
      min-width: unset;
    }
  }

  .settings-panels {
    flex: 1;
    overflow-y: auto;
  }

  :deep(.q-tab-panel) {
    padding: 8px;
    min-height: 400px;
  }

  :deep(.q-tabs) {
    .q-tab {
      padding: 12px 16px;
      min-height: 48px;
    }
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .settings-panel {
    flex-direction: column;

    .settings-tabs {
      width: 100%;
      min-width: unset;
    }

    .q-separator {
      width: 100% !important;
      height: 1px !important;
    }
  }
}
</style>
