/**
 * Web Worker for image processing
 * Handles canvas rendering in a separate thread to prevent UI blocking
 */

// Since we can't directly use DOM APIs in workers, we'll use a message-based approach
// The worker will coordinate with the main thread for actual canvas operations

interface WorkerMessage {
  type: 'process' | 'process-batch' | 'cancel';
  taskId: string;
  data?: unknown;
}

interface ProcessTask {
  id: string;
  imageData: {
    file: File;
    exif?: Record<string, unknown>;
    width: number;
    height: number;
  };
  options: Record<string, unknown>;
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  taskId: string;
  data?: {
    current?: number;
    total?: number;
    imageId?: string;
    result?: {
      url: string;
      width: number;
      height: number;
    };
    error?: string;
  };
}

// Task queue management
let cancelled = false;

/**
 * Process batch of tasks
 */
async function processBatch(tasks: ProcessTask[]): Promise<void> {
  let isProcessing = true;
  cancelled = false;

  for (let i = 0; i < tasks.length; i++) {
    if (cancelled || !isProcessing) {
      break;
    }

    const task = tasks[i];
    if (!task) continue;

    // Send progress update
    postMessage({
      type: 'progress',
      taskId: task.id,
      data: {
        current: i + 1,
        total: tasks.length,
        imageId: task.id,
      },
    } as WorkerResponse);

    // Simulate async processing - in real implementation, main thread does the work
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  isProcessing = false;
}

/**
 * Message handler
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, taskId, data } = event.data;

  switch (type) {
    case 'process':
      // Single image processing - notify main thread
      postMessage({
        type: 'progress',
        taskId,
        data: {},
      } as WorkerResponse);
      break;

    case 'process-batch':
      if (Array.isArray(data)) {
        processBatch(data as ProcessTask[])
          .then(() => {
            postMessage({
              type: 'complete',
              taskId,
              data: {},
            } as WorkerResponse);
          })
          .catch((error) => {
            postMessage({
              type: 'error',
              taskId,
              data: { error: error.message },
            } as WorkerResponse);
          });
      }
      break;

    case 'cancel':
      cancelled = true;
      postMessage({
        type: 'complete',
        taskId,
        data: {},
      } as WorkerResponse);
      break;

    default: {
      const unknownType: never = type;
      postMessage({
        type: 'error',
        taskId,
        data: { error: `Unknown message type: ${String(unknownType)}` },
      } as WorkerResponse);
    }
  }
};

// Export for TypeScript
export {};
