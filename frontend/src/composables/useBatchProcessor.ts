/**
 * Batch image processing system with queue management
 * Provides non-blocking batch processing with progress tracking
 */

import { ref, computed } from 'vue';
import type { ImageFile, ProcessOptions } from '@/types/image';
import { CanvasRenderer } from '@/utils/canvasRenderer';

export interface ProcessTask {
  id: string;
  image: ImageFile;
  options: ProcessOptions;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: {
    url: string;
    width: number;
    height: number;
  };
  error?: string;
}

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
  completed: number;
  errors: number;
  currentImageId: string | undefined;
  currentImageName: string | undefined;
}

export interface BatchProcessorOptions {
  concurrent?: number; // Number of concurrent processing tasks
  delayBetweenTasks?: number; // Delay in ms between tasks (0 = no delay)
  onProgress?: (progress: BatchProgress) => void;
  onTaskComplete?: (task: ProcessTask) => void;
  onTaskError?: (task: ProcessTask) => void;
  onComplete?: (results: ProcessTask[]) => void;
}

export function useBatchProcessor() {
  // State
  const isProcessing = ref(false);
  const isPaused = ref(false);
  const tasks = ref<ProcessTask[]>([]);
  const processedTasks = ref<Map<string, ProcessTask>>(new Map());
  const errors = ref<string[]>([]);

  const renderer = new CanvasRenderer();

  // Computed
  const progress = computed<BatchProgress>(() => {
    const total = tasks.value.length;
    const completed = tasks.value.filter((t) => t.status === 'completed').length;
    const errorCount = tasks.value.filter((t) => t.status === 'error').length;
    const processing = tasks.value.filter((t) => t.status === 'processing').length;

    const current = completed + errorCount + processing;

    return {
      current,
      total,
      percentage: total > 0 ? (current / total) * 100 : 0,
      completed,
      errors: errorCount,
      currentImageId: tasks.value.find((t) => t.status === 'processing')?.id,
      currentImageName: tasks.value.find((t) => t.status === 'processing')?.image.name,
    };
  });

  /**
   * Add a task to the queue
   */
  const addTask = (image: ImageFile, options: ProcessOptions): string => {
    const task: ProcessTask = {
      id: image.id,
      image,
      options,
      status: 'pending',
    };

    tasks.value.push(task);
    return task.id;
  };

  /**
   * Add multiple tasks to the queue
   */
  const addTasks = (images: ImageFile[], options: ProcessOptions): string[] => {
    return images.map((image) => addTask(image, options));
  };

  /**
   * Clear all tasks
   */
  const clearTasks = (): void => {
    tasks.value = [];
    processedTasks.value.clear();
    errors.value = [];
    isProcessing.value = false;
    isPaused.value = false;
  };

  /**
   * Remove a specific task
   */
  const removeTask = (taskId: string): boolean => {
    const index = tasks.value.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = tasks.value[index];
      // Can't remove processing task
      if (task?.status === 'processing') {
        return false;
      }
      tasks.value.splice(index, 1);
      processedTasks.value.delete(taskId);
      return true;
    }
    return false;
  };

  /**
   * Retry failed tasks
   */
  const retryFailed = (): void => {
    tasks.value = tasks.value.map((task) => {
      if (task.status === 'error') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error, ...rest } = task;
        return { ...rest, status: 'pending' as const };
      }
      return task;
    });
    errors.value = [];
  };

  /**
   * Pause processing
   */
  const pause = (): void => {
    isPaused.value = true;
  };

  /**
   * Resume processing
   */
  const resume = (): void => {
    isPaused.value = false;
  };

  /**
   * Cancel all processing
   */
  const cancel = (): void => {
    isProcessing.value = false;
    isPaused.value = false;
    // Reset processing tasks to pending
    tasks.value = tasks.value.map((task) => {
      if (task.status === 'processing') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { error, result, ...rest } = task;
        return { ...rest, status: 'pending' as const };
      }
      return task;
    });
  };

  /**
   * Process a single task
   */
  const processSingleTask = async (task: ProcessTask): Promise<void> => {
    try {
      task.status = 'processing';

      console.log('[useBatchProcessor] Processing image:', task.image.name);

      // Use Canvas for all images (no HDR special handling)
      const result = await renderer.render({
        imageFile: task.image,
        ...task.options,
      });

      task.status = 'completed';
      task.result = {
        url: result.url,
        width: result.width,
        height: result.height,
      };

      processedTasks.value.set(task.id, task);
    } catch (error) {
      task.status = 'error';
      task.error = error instanceof Error ? error.message : String(error);
      errors.value.push(`${task.image.name}: ${task.error}`);
    }
  };

  /**
   * Process all tasks in the queue
   */
  const processAll = async (options: BatchProcessorOptions = {}): Promise<ProcessTask[]> => {
    if (isProcessing.value) {
      throw new Error('Processing is already in progress');
    }

    const {
      concurrent = 1,
      delayBetweenTasks = 0,
      onProgress,
      onTaskComplete,
      onTaskError,
      onComplete,
    } = options;

    isProcessing.value = true;
    isPaused.value = false;

    // Filter only pending tasks
    const pendingTasks = tasks.value.filter((t) => t.status === 'pending');
    const results: ProcessTask[] = [...tasks.value];

    // Process with concurrency limit
    const processInBatches = async (): Promise<void> => {
      const batches: ProcessTask[][] = [];
      for (let i = 0; i < pendingTasks.length; i += concurrent) {
        batches.push(pendingTasks.slice(i, i + concurrent));
      }

      for (const batch of batches) {
        if (!isProcessing.value) {
          break;
        }

        // Wait for pause to be lifted
        while (isPaused.value) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (!isProcessing.value) {
            break;
          }
        }

        if (!isProcessing.value) {
          break;
        }

        // Process batch concurrently
        await Promise.all(
          batch.map(async (task) => {
            await processSingleTask(task);

            if (task.status === 'completed' && onTaskComplete) {
              onTaskComplete(task);
            } else if (task.status === 'error' && onTaskError) {
              onTaskError(task);
            }
          }),
        );

        // Notify progress
        if (onProgress) {
          onProgress(progress.value);
        }

        // Add delay between batches (except for last batch)
        if (delayBetweenTasks > 0 && batch !== batches[batches.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenTasks));
        }
      }
    };

    try {
      await processInBatches();

      if (onComplete) {
        onComplete(results);
      }

      return results;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Get task by ID
   */
  const getTask = (taskId: string): ProcessTask | undefined => {
    return tasks.value.find((t) => t.id === taskId);
  };

  /**
   * Get all completed tasks
   */
  const getCompletedTasks = (): ProcessTask[] => {
    return tasks.value.filter((t) => t.status === 'completed');
  };

  /**
   * Get all failed tasks
   */
  const getFailedTasks = (): ProcessTask[] => {
    return tasks.value.filter((t) => t.status === 'error');
  };

  /**
   * Get processing statistics
   */
  const getStatistics = () => {
    return {
      total: tasks.value.length,
      completed: tasks.value.filter((t) => t.status === 'completed').length,
      processing: tasks.value.filter((t) => t.status === 'processing').length,
      pending: tasks.value.filter((t) => t.status === 'pending').length,
      errors: tasks.value.filter((t) => t.status === 'error').length,
    };
  };

  return {
    // State
    isProcessing,
    isPaused,
    tasks,
    errors,
    progress,

    // Queue management
    addTask,
    addTasks,
    clearTasks,
    removeTask,
    retryFailed,

    // Control
    pause,
    resume,
    cancel,
    processAll,

    // Query
    getTask,
    getCompletedTasks,
    getFailedTasks,
    getStatistics,
  };
}
