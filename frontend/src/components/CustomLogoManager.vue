<template>
  <div class="custom-logo-manager">
    <!-- Show Logo Toggle - Default OFF -->
    <q-toggle
      :model-value="showLogo"
      label="启用自定义 Logo"
      color="primary"
      @update:model-value="updateShowLogo"
    >
      <q-tooltip v-if="!canUseCustomLogo">登录后可使用自定义Logo</q-tooltip>
    </q-toggle>

    <template v-if="showLogo && canUseCustomLogo">
      <!-- Custom Logo Upload and Display -->
      <div class="q-mt-md">
        <!-- Selected Custom Logo Display -->
        <div v-if="customLogo" class="q-mb-md">
          <div class="text-subtitle2 q-mb-sm">当前自定义 Logo</div>
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
                @click="removeCustomLogo"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Upload Button -->
        <q-uploader
          url=""
          label="点击或拖放上传 Logo 图片"
          accept=".png,.jpg,.jpeg,.svg"
          max-files="1"
          flat
          bordered
          @added="onCustomLogoUpload"
        />
      </div>

      <!-- Logo Position and Size Controls - Show when logo is set -->
      <q-expansion-item
        v-if="customLogo"
        icon="tune"
        label="Logo 位置和样式"
        class="q-mt-sm"
        default-opened
      >
        <q-card flat bordered class="q-mt-sm">
          <q-card-section>
            <!-- Horizontal Position - Default -45 as per task requirement -->
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

    <!-- Login prompt for guest users -->
    <q-banner v-if="showLogo && !canUseCustomLogo" class="bg-info text-white q-mt-sm rounded-borders">
      <template v-slot:avatar>
        <q-icon name="lock" />
      </template>
      <div class="text-body2">
        自定义 Logo 功能需要登录后使用。登录后可上传自己的 Logo 并与预设 Logo 同时使用。
      </div>
    </q-banner>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useUserStore } from '@/stores/userStore';
import type { LogoConfig } from '@/types/image';

interface Props {
  modelValue?: LogoConfig | undefined;
  bottomHeightPercent?: number;
  disableEmit?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: LogoConfig | undefined): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// User store for permissions
const userStore = useUserStore();
const canUseCustomLogo = computed(() => userStore.canUseCustomLogo);

// Default settings - Horizontal position defaults to -45 as per task requirement
const defaultLogoSize = 8;
const defaultLogoOffsetX = -45; // -45 as per task requirement

// State
const showLogo = ref(false); // Default OFF as per task requirement
const customLogo = ref<LogoConfig | undefined>(undefined);

// Logo settings
const logoSize = ref(defaultLogoSize);
const logoOpacity = ref(100);
const logoOffsetX = ref(defaultLogoOffsetX);
const logoOffsetY = ref(0);

// Flag to control emit during settings load
const isInternalUpdate = ref(false);

// Methods
const updateShowLogo = (value: boolean) => {
  showLogo.value = value;
  if (!value || !canUseCustomLogo.value) {
    emit('update:modelValue', undefined);
  } else {
    emitConfig();
  }
};

const onCustomLogoUpload = (files: readonly File[]) => {
  const file = files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target?.result as string;
    customLogo.value = {
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
  customLogo.value = undefined;
  emit('update:modelValue', undefined);
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

  if (!showLogo.value || !customLogo.value || !canUseCustomLogo.value) {
    emit('update:modelValue', undefined);
    return;
  }

  emit('update:modelValue', {
    ...customLogo.value,
    size: logoSize.value,
    opacity: logoOpacity.value / 100,
    offsetX: logoOffsetX.value,
    offsetY: logoOffsetY.value,
  });
};

// Initialize from props
isInternalUpdate.value = true;
if (props.modelValue && canUseCustomLogo.value) {
  // Check if it's a custom logo (not in preset list)
  // We'll assume it's custom if it's passed to this component
  customLogo.value = { ...props.modelValue };
  showLogo.value = true;
  logoSize.value = props.modelValue.size;
  logoOpacity.value = props.modelValue.opacity * 100;
  logoOffsetX.value = props.modelValue.offsetX ?? defaultLogoOffsetX;
  logoOffsetY.value = props.modelValue.offsetY ?? 0;
}
void nextTick(() => {
  isInternalUpdate.value = false;
});

// Watch for modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && canUseCustomLogo.value) {
    isInternalUpdate.value = true;
    customLogo.value = { ...newValue };
    showLogo.value = true;
    logoSize.value = newValue.size;
    logoOpacity.value = newValue.opacity * 100;
    logoOffsetX.value = newValue.offsetX ?? defaultLogoOffsetX;
    logoOffsetY.value = newValue.offsetY ?? 0;
    void nextTick(() => {
      isInternalUpdate.value = false;
    });
  }
});

// Watch for permission changes
watch(canUseCustomLogo, (canUse) => {
  if (!canUse && showLogo.value) {
    showLogo.value = false;
    emit('update:modelValue', undefined);
  }
});
</script>

<style scoped lang="scss">
.custom-logo-manager {
  .custom-logo-item {
    max-width: 300px;
    margin: 0 auto;
  }

  .custom-logo-preview {
    width: 100%;
    max-width: 250px;
    max-height: 100px;
    object-fit: contain;
    display: block;
    margin: 0 auto;
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
