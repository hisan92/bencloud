export function match<V extends string | number | symbol = string, R = unknown>(
  key: V,
  record: Record<V, R | ((...args: any[]) => R)>,
  ...args: any[]
): R {
  if (key in record) {
    const fn = record[key];
    return typeof fn === "function" ? fn(...args) : (fn as any);
  }

  const error = new Error(
    `No matching key: ${JSON.stringify(key)} in ${JSON.stringify(Object.keys(record))}`,
  );

  Error.captureStackTrace?.(error, match);

  throw error;
}
