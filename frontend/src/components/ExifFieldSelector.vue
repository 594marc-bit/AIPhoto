<template>
  <div class="exif-field-selector">
    <!-- Show EXIF Toggle -->
    <q-toggle
      :model-value="showExif"
      label="显示 EXIF 信息"
      color="primary"
      class="q-mb-md"
      @update:model-value="updateShowExif"
    />

    <template v-if="showExif">
      <!-- Quick presets -->
    <div class="q-mb-md">
      <q-btn-group flat>
        <q-btn
          size="sm"
          label="全部"
          :color="selectedFields.length === EXIF_FIELDS.length ? 'primary' : 'grey'"
          @click="selectAll"
        />
        <q-btn size="sm" label="基础" color="grey" @click="selectBasic" />
        <q-btn size="sm" label="详细" color="grey" @click="selectDetailed" />
        <q-btn size="sm" label="清空" color="grey" @click="clearAll" />
      </q-btn-group>
    </div>

    <!-- Field checkboxes with actual EXIF values -->
    <q-list bordered separator>
      <q-item
        v-for="field in EXIF_FIELDS"
        :key="field.value"
        clickable
        @click="toggleField(field.value)"
      >
        <q-item-section side>
          <q-checkbox
            :model-value="isSelected(field.value)"
            @update:model-value="toggleField(field.value)"
            color="primary"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ field.label }}</q-item-label>
          <q-item-label caption>
            <span v-if="exifData && getFieldValue(field.value)" class="text-primary">
              {{ getFieldValue(field.value) }}
            </span>
            <span v-else class="text-grey">{{ field.description }}</span>
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-icon name="info" color="grey">
            <q-tooltip>
              <div v-if="exifData && getFieldValue(field.value)">
                {{ field.description }}<br>
                <strong>当前值: {{ getFieldValue(field.value) }}</strong>
              </div>
              <div v-else>{{ field.description }}</div>
            </q-tooltip>
          </q-icon>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Selected count -->
    <div class="q-mt-md text-caption text-grey">
      已选择 {{ selectedFields.length }} / {{ EXIF_FIELDS.length }} 个字段
      <span v-if="exifData" class="text-primary q-ml-sm">
        ({{ Object.keys(exifData).length }} 个可用字段)
      </span>
      <span v-else class="text-negative q-ml-sm">
        (未检测到 EXIF 数据)
      </span>
    </div>

    <!-- Text position adjustment -->
    <q-expansion-item icon="tune" label="文本位置调整" class="q-mt-md">
      <q-card flat bordered class="q-mt-sm">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Text alignment -->
            <div class="col-12">
              <div class="text-caption q-mb-sm">文字对齐</div>
              <q-btn-group flat>
                <q-btn
                  :flat="textAlign !== 'left'"
                  :color="textAlign === 'left' ? 'primary' : 'grey'"
                  label="左对齐"
                  icon="format_align_left"
                  @click="updateTextAlign('left')"
                />
                <q-btn
                  :flat="textAlign !== 'center'"
                  :color="textAlign === 'center' ? 'primary' : 'grey'"
                  label="居中"
                  icon="format_align_center"
                  @click="updateTextAlign('center')"
                />
                <q-btn
                  :flat="textAlign !== 'right'"
                  :color="textAlign === 'right' ? 'primary' : 'grey'"
                  label="右对齐"
                  icon="format_align_right"
                  @click="updateTextAlign('right')"
                />
              </q-btn-group>
            </div>

            <!-- Horizontal offset -->
            <div class="col-12">
              <div class="row items-center q-gutter-sm">
                <div class="text-caption">水平位置</div>
                <div class="text-caption text-grey q-ml-auto">{{ textOffsetX }}%</div>
              </div>
              <q-slider
                :model-value="textOffsetX"
                :min="-50"
                :max="50"
                :step="1"
                markers
                label-always
                @update:model-value="updateTextOffsetX"
              />
            </div>

            <!-- Vertical offset -->
            <div class="col-12">
              <div class="row items-center q-gutter-sm">
                <div class="text-caption">上下位置</div>
                <div class="text-caption text-grey q-ml-auto">{{ textOffsetY }}%</div>
              </div>
              <q-slider
                :model-value="textOffsetY"
                :min="-90"
                :max="20"
                markers
                label-always
                @update:model-value="updateTextOffsetY"
              />
            </div>

            <!-- Font settings -->
            <div class="col-12 col-sm-6">
              <q-select
                :model-value="fontFamily"
                :options="fontOptions"
                label="字体"
                emit-value
                map-options
                dense
                outlined
                @update:model-value="updateFontFamily"
              />
            </div>

            <div class="col-12 col-sm-6">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <div class="text-caption">字体大小</div>
                <div class="text-caption text-grey q-ml-auto">{{ fontSize }}%</div>
              </div>
              <q-slider
                :model-value="fontSize"
                :min="0.5"
                :max="3"
                :step="0.1"
                markers
                label-always
                @update:model-value="updateFontSize"
              />
            </div>

            <!-- Text color -->
            <div class="col-12">
              <div class="row items-center q-gutter-sm">
                <div class="text-caption">文字颜色：</div>
                <q-btn
                  v-for="color in presetColors"
                  :key="color.value"
                  round
                  size="sm"
                  :style="{ backgroundColor: color.value }"
                  :outline="textColor !== color.value"
                  @click="updateTextColor(color.value)"
                />
                <q-input
                  :model-value="textColor"
                  label="自定义"
                  dense
                  outlined
                  readonly
                  class="col"
                >
                  <template #append>
                    <q-icon name="palette" :style="{ color: textColor }" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-color v-model="customTextColor" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { EXIF_FIELDS, getDefaultExifFields } from '@/utils/exifReader';
import type { ExifData } from '@/types/image';

interface Props {
  modelValue?: string[];
  showExif?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  textOffset?: number;
  textOffsetX?: number; // horizontal offset from center
  textOffsetY?: number; // vertical offset from center
  fontFamily?: string;
  fontSize?: number; // percentage of image width (0.5-3%)
  textColor?: string;
  exifData?: ExifData | null | undefined;
  imageWidth?: number; // original image width for calculating font size
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void;
  (e: 'update:showExif', value: boolean): void;
  (e: 'update:textAlign', value: 'left' | 'center' | 'right'): void;
  (e: 'update:textOffset', value: number): void;
  (e: 'update:textOffsetX', value: number): void;
  (e: 'update:textOffsetY', value: number): void;
  (e: 'update:fontFamily', value: string): void;
  (e: 'update:fontSize', value: number): void;
  (e: 'update:textColor', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => getDefaultExifFields(),
  showExif: true,
  textAlign: 'left',
  textOffset: 0,
  textOffsetX: 0,
  textOffsetY: 0,
  fontFamily: 'Arial',
  fontSize: 1, // 1% of image width
  textColor: '#333333',
  exifData: null,
  imageWidth: 1920,
});

const emit = defineEmits<Emits>();

// Debug: Watch exifData changes
watch(() => props.exifData, (newData) => {
  console.log('[ExifFieldSelector] exifData prop changed:', newData);
  console.log('[ExifFieldSelector] Type of exifData:', typeof newData);
  console.log('[ExifFieldSelector] Keys in exifData:', newData ? Object.keys(newData) : 'null/undefined');
}, { immediate: true });

const selectedFields = computed(() => props.modelValue);
const showExif = computed(() => props.showExif ?? true);
const customTextColor = ref(props.textColor);

// Text alignment from props
const textAlign = computed(() => props.textAlign ?? 'left');

// Text offset X and Y from props
const textOffsetX = computed(() => props.textOffsetX ?? 0);
const textOffsetY = computed(() => props.textOffsetY ?? 0);

const fontOptions = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Helvetica Neue', value: 'Helvetica Neue' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'SimSun (宋体)', value: 'SimSun' },
  { label: 'Microsoft YaHei (微软雅黑)', value: 'Microsoft YaHei' },
];

const presetColors = [
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#ffffff' },
  { label: 'Dark Grey', value: '#333333' },
  { label: 'Light Grey', value: '#cccccc' },
];

// Get the actual value from EXIF data for a field
const getFieldValue = (field: string): string | undefined => {
  console.log('[ExifFieldSelector.getFieldValue] Called for field:', field, 'exifData:', props.exifData);
  if (!props.exifData) return undefined;

  const fieldMap: Record<string, keyof ExifData> = {
    make: 'make',
    model: 'model',
    dateTime: 'dateTime',
    exposureTime: 'exposureTime',
    fNumber: 'fNumber',
    iso: 'iso',
    focalLength: 'focalLength',
    lensModel: 'lensModel',
  };

  const key = fieldMap[field];
  const result = key ? props.exifData[key] : undefined;
  console.log(`[ExifFieldSelector.getFieldValue] Field "${field}" -> key "${key}" -> result:`, result);
  return result;
};

const isSelected = (field: string) => selectedFields.value.includes(field);

const toggleField = (field: string) => {
  const newFields = isSelected(field)
    ? selectedFields.value.filter((f) => f !== field)
    : [...selectedFields.value, field];
  emit('update:modelValue', newFields);
};

const selectAll = () => {
  emit('update:modelValue', EXIF_FIELDS.map((f) => f.value));
};

const selectBasic = () => {
  emit('update:modelValue', ['make', 'model', 'dateTime']);
};

const selectDetailed = () => {
  emit('update:modelValue', getDefaultExifFields());
};

const clearAll = () => {
  emit('update:modelValue', []);
};

const updateShowExif = (value: boolean) => {
  emit('update:showExif', value);
};

const updateTextAlign = (value: 'left' | 'center' | 'right') => {
  emit('update:textAlign', value);
};


const updateTextOffsetX = (value: number | null) => {
  if (value !== null) {
    emit('update:textOffsetX', value);
  }
};

const updateTextOffsetY = (value: number | null) => {
  if (value !== null) {
    emit('update:textOffsetY', value);
  }
};

const updateFontFamily = (value: string) => {
  emit('update:fontFamily', value);
};

const updateFontSize = (value: number | null) => {
  if (value !== null) {
    emit('update:fontSize', value);
  }
};

const updateTextColor = (value: string) => {
  emit('update:textColor', value);
};

// Watch custom color changes
watch(customTextColor, (newColor) => {
  if (newColor !== props.textColor) {
    updateTextColor(newColor);
  }
});
</script>

<style scoped lang="scss">
.exif-field-selector {
  :deep(.q-item) {
    &:hover {
      background-color: $grey-1;
    }
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
