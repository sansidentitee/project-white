export function writeLocalIfChanged(
  storage: Pick<Storage, "getItem" | "setItem">,
  key: string,
  value: unknown,
) {
  const serialized = JSON.stringify(value);
  if (storage.getItem(key) === serialized) return false;
  storage.setItem(key, serialized);
  return true;
}
