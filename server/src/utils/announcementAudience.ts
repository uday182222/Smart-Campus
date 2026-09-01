/**
 * Normalise announcement targetAudience to a string array for consistent DB storage.
 */
export function normalizeTargetAudience(raw: unknown): string[] {
  if (raw == null) return ['all'];
  if (Array.isArray(raw)) {
    const list = raw.map(String).map((s) => s.trim()).filter(Boolean);
    return list.length ? list : ['all'];
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    return s ? [s] : ['all'];
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => obj[k] === true || obj[k] === 'true');
    return keys.length ? keys : ['all'];
  }
  return ['all'];
}
