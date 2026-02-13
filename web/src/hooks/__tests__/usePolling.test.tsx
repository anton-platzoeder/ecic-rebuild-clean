/**
 * Tests for usePolling Hook
 *
 * Tests polling behavior including interval timing,
 * enable/disable functionality, and cleanup.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePolling } from '@/hooks/usePolling';

describe('usePolling()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('calls callback at specified interval when enabled', () => {
    const callback = vi.fn();
    const interval = 5000; // 5 seconds

    renderHook(() => usePolling(callback, interval, true));

    expect(callback).not.toHaveBeenCalled();

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance another 5 seconds
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(2);

    // Advance another 5 seconds
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('does not call callback when enabled is false', () => {
    const callback = vi.fn();
    const interval = 5000;

    renderHook(() => usePolling(callback, interval, false));

    vi.advanceTimersByTime(10000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('stops calling callback when unmounted', () => {
    const callback = vi.fn();
    const interval = 5000;

    const { unmount } = renderHook(() => usePolling(callback, interval, true));

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    vi.advanceTimersByTime(10000);
    // Should not have been called again after unmount
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('updates callback when callback function changes', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ cb }) => usePolling(cb, interval, true),
      {
        initialProps: { cb: callback1 },
      },
    );

    vi.advanceTimersByTime(5000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    // Update callback
    rerender({ cb: callback2 });

    vi.advanceTimersByTime(5000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('handles async callbacks correctly', async () => {
    const asyncCallback = vi.fn().mockResolvedValue(undefined);
    const interval = 5000;

    renderHook(() => usePolling(asyncCallback, interval, true));

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(asyncCallback).toHaveBeenCalledTimes(1);
    });

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(asyncCallback).toHaveBeenCalledTimes(2);
    });
  });

  it('restarts polling when interval changes', () => {
    const callback = vi.fn();
    let interval = 5000;

    const { rerender } = renderHook(() => usePolling(callback, interval, true));

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Change interval to 10 seconds
    interval = 10000;
    rerender();

    // Old interval (5s) should not trigger
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    // New interval (10s) should trigger
    vi.advanceTimersByTime(5000); // Total 10s
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('stops and starts polling when enabled changes', () => {
    const callback = vi.fn();
    const interval = 5000;

    const { rerender } = renderHook(
      ({ enabled }) => usePolling(callback, interval, enabled),
      {
        initialProps: { enabled: true },
      },
    );

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Disable polling
    rerender({ enabled: false });

    vi.advanceTimersByTime(10000);
    // Should not have been called again
    expect(callback).toHaveBeenCalledTimes(1);

    // Re-enable polling
    rerender({ enabled: true });

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('defaults enabled to true when not specified', () => {
    const callback = vi.fn();
    const interval = 5000;

    renderHook(() => usePolling(callback, interval));

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
