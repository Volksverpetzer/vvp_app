/**
 * Converts a hex color string into its RGB components.
 * Supports shorthand (#abc) and full (#aabbcc) formats.
 * @param hex - The hex color string (with or without leading '#').
 * @returns A tuple of [r, g, b] values.
 */
export function hexToRgb(hex: string): [number, number, number] {
  if (hex.length === 4) {
    hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const bigint = Number.parseInt(hex.replace("#", ""), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
