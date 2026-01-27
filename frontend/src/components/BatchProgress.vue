<template>
  <div v-if="show" class="batch-progress-panel">
    <q-card flat bordered>
      <!-- Header -->
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <div class="text-h6">批量处理进度</div>
          <q-space />
          <q-btn
            v-if="!isComplete"
            flat
            dense
            round
            :icon="isPaused ? 'play_arrow' : 'pause'"
            @click="togglePause"
          >
            <q-tooltip>{{ isPaused ? '继续' : '暂停' }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            round
            icon="cancel"
            @click="handleCancel"
            class="q-ml-sm"
          >
            <q-tooltip>取消</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <!-- Progress Bar -->
      <q-card-section>
        <div class="text-caption text-grey q-mb-sm">
          处理中: {{ progress.current }} / {{ progress.total }}
          <span v-if="progress.errors > 0" class="text-negative q-ml-md">
            失败: {{ progress.errors }}
          </span>
        </div>
        <q-linear-progress
          :value="progress.percentage / 100"
          :color="isComplete ? 'positive' : 'primary'"
          size="8px"
          rounded
        />
        <div class="text-caption text-grey q-mt-xs text-right">
          {{ progress.percentage.toFixed(1) }}%
        </div>

        <!-- Current Image Info -->
        <div v-if="progress.currentImageName" class="text-caption text-primary q-mt-md">
          <q-icon name="photo" size="16px" />
          正在处理: {{ progress.currentImageName }}
        </div>
      </q-card-section>

      <!-- Statistics -->
      <q-separator />
      <q-card-section>
        <div class="row q-gutter-md">
          <div class="col">
            <q-chip size="sm" icon="check_circle" color="positive" text-color="white">
              完成: {{ progress.completed }}
            </q-chip>
          </div>
          <div class="col">
            <q-chip size="sm" icon="pending" color="grey" text-color="white">
              待处理: {{ statistics.pending }}
            </q-chip>
          </div>
          <div class="col">
            <q-chip
              v-if="progress.errors > 0"
              size="sm"
              icon="error"
              color="negative"
              text-color="white"
            >
              失败: {{ progress.errors }}
            </q-chip>
          </div>
        </div>
      </q-card-section>

      <!-- Error List -->
      <q-separator v-if="errors.length > 0" />
      <q-card-section v-if="errors.length > 0" class="q-pa-none">
        <q-expansion-item
          icon="error"
          label="错误详情"
          :caption="`${errors.length} 个错误`"
          dense
        >
          <q-list separator>
            <q-item v-for="(error, index) in errors" :key="index" dense>
              <q-item-section avatar>
                <q-icon name="error" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-caption">{{ error }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </q-card-section>

      <!-- Actions -->
      <q-separator />
      <q-card-section class="q-pa-sm">
        <div class="row q-gutter-sm justify-end">
          <q-btn
            v-if="progress.errors > 0 && !isProcessing"
            flat
            color="warning"
            label="重试失败"
            icon="refresh"
            size="sm"
            @click="handleRetry"
          />
          <q-btn
            v-if="isComplete"
            flat
            color="primary"
            label="关闭"
            icon="close"
            size="sm"
            @click="handleClose"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BatchProgress } from '@/composables/useBatchProcessor';

interface Props {
  show?: boolean;
  isProcessing?: boolean;
  isPaused?: boolean;
  progress: BatchProgress;
  errors: string[];
  statistics: {
    total: number;
    completed: number;
    processing: number;
    pending: number;
    errors: number;
  };
}

interface Emits {
  (e: 'pause'): void;
  (e: 'resume'): void;
  (e: 'cancel'): void;
  (e: 'retry'): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  isProcessing: false,
  isPaused: false,
});

const emit = defineEmits<Emits>();

const isComplete = computed(() => {
  return props.progress.current >= props.progress.total && props.progress.total > 0;
});

const togglePause = () => {
  if (props.isPaused) {
    emit('resume');
  } else {
    emit('pause');
  }
};

const handleCancel = () => {
  emit('cancel');
};

const handleRetry = () => {
  emit('retry');
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped lang="scss">
.batch-progress-panel {
  :deep(.q-card) {
    background-color: $grey-1;
  }
}
</style>
