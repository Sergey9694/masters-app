/**
 * Generates a Yandex Maps URL for a given address string.
 */
export function getMapUrl(address: string): string {
  return `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
}

/**
 * Opens Yandex Maps for a given address in a new tab.
 */
export function openMap(address: string): void {
  const url = getMapUrl(address);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
