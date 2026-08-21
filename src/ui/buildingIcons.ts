const ICON_PATHS: Record<string, string> = {
  bowl: '<path d="M8 13h20c-1 8-5 12-10 12S9 21 8 13Z"/><path d="M13 8c0-3 3-4 3-7m5 7c0-3 3-4 3-7"/>',
  leaf: '<path d="M25 5C10 6 5 14 8 25c11 2 19-5 17-20Z"/><path d="M8 25c5-6 9-10 15-14"/>',
  note: '<path d="M18 7v14m0-14 9-2v14"/><circle cx="13" cy="23" r="4"/><circle cx="22" cy="21" r="4"/>',
  book: '<path d="M6 7c6-3 10-2 14 1v17c-4-3-8-3-14-1Z"/><path d="M22 8c3-3 7-4 12-1v17c-5-2-9-2-12 1Z"/>',
  school: '<path d="m5 13 13-7 13 7-13 7Z"/><path d="M9 15v9h18v-9M14 24v-6h8v6"/>',
  star: '<path d="m18 4 4 9 10 1-8 7 2 10-8-5-9 5 3-10-8-7 10-1Z"/>',
  rail: '<path d="M9 5h18c3 0 5 2 5 5v10c0 4-4 6-9 6H13c-5 0-9-2-9-6V10c0-3 2-5 5-5Z"/><path d="M10 26 6 31m20-5 4 5M9 13h18M12 20h.1m12 0h.1"/>'
};

export function buildingIcon(kind: string, className = ""): string {
  const path = ICON_PATHS[kind] ?? ICON_PATHS.star;
  return `<svg class="building-icon ${className}" viewBox="0 0 36 36" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
