export const displayName = (name?: string | null, fallback = 'User') =>
  (name ?? fallback).replace(/\s*\([^)]*\)\s*$/, '').trim() || fallback;
