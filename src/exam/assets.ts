/** Every exam download goes through this function so a later signed-URL change stays in one place. */
export function resolveExamAsset(key: string): string {
  const base = (import.meta.env.VITE_EXAM_ASSET_BASE_URL || '/exam-assets').replace(/\/+$/, '');
  const normalized = key.replace(/^\/+/, '');
  return `${base}/${normalized}`;
}
