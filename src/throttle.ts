export function throttle<A extends any[], T>(
  fn: (...args: A) => T,
  ms: number,
): (...args: A) => T | void {
  let last = 0;
  let timeout: any;
  return function throttled(...args: A): T | void {
    const now = Date.now();
    const elapsed = now - last;
    if (elapsed < ms) {
      clearTimeout(timeout);
      timeout = setTimeout(throttled, ms - elapsed, ...args);
      return;
    }
    last = now;
    return fn(...args);
  };
}
