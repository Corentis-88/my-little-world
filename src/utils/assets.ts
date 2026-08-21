export function assetUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}assets/${fileName}`;
}

export function iconUrl(fileName: string): string {
  return `${import.meta.env.BASE_URL}icons/${fileName}`;
}
