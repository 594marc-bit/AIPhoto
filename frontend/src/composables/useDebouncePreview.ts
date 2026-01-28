/**
 * Debounce composable for preview refresh
 *
 * Prevents excessive preview updates when user rapidly changes settings.
 * Only executes the refresh function after a delay period has passed
 * without any new changes.
 */

export function useDebouncePreview(
  refreshFn: () => Promise<void>,
  delay: number = 150,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Debounced refresh function
   * Cancels any pending refresh and schedules a new one
   */
  const debouncedRefresh = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      void refreshFn();
      timeoutId = null;
    }, delay);
  };

  /**
   * Cancel any pending refresh
   */
  const cancel = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  /**
   * Execute refresh immediately without debounce
   */
  const flush = async (): Promise<void> => {
    cancel();
    await refreshFn();
  };

  return {
    debouncedRefresh,
    cancel,
    flush,
  };
}
