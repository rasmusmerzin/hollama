export function stripObject<T extends object>(obj: T): Omit<T, `_${string}`> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !key.startsWith("_")),
  ) as any;
}
